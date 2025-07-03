import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
// Placeholder for Okta: import { Strategy as OktaStrategy } from 'passport-okta-oauth';
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';

const prisma = new PrismaClient();

// --- Provider Config ---
const SSO_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    enabled: !!process.env.GOOGLE_CLIENT_ID,
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
  },
  // Example Okta config (disabled by default)
  {
    id: 'okta',
    name: 'Okta',
    enabled: !!process.env.OKTA_CLIENT_ID,
    config: {
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      callbackURL: '/api/auth/okta/callback',
      // Add Okta-specific config here
    },
  },
];

// --- Google SSO ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: (error: Error | null, user?: User) => void) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Email not provided by Google'));
        }
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || 'Google User',
              password: await bcrypt.hash(Math.random().toString(36), 10),
            },
          });
        }
        // TODO: Provisioning rules (auto-assign roles/groups based on email domain)
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    }
  ));
}

// --- Okta SSO (scaffold, not active) ---
// if (process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET) {
//   passport.use(new OktaStrategy({
//     clientID: process.env.OKTA_CLIENT_ID!,
//     clientSecret: process.env.OKTA_CLIENT_SECRET!,
//     callbackURL: '/api/auth/okta/callback',
//     // ...other Okta config
//   },
//   async (accessToken, refreshToken, profile, done) => {
//     // Implement Okta user lookup/provisioning
//     done(null, user);
//   }));
// }

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error as Error, undefined);
  }
});

// --- Controller Functions ---
const ssoLogin = (provider: string) => (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl = typeof req.query.redirect === 'string' ? req.query.redirect : '/dashboard';
  passport.authenticate(provider, {
    scope: provider === 'google' ? ['profile', 'email'] : undefined,
    state: redirectUrl,
  })(req, res, next);
};

const ssoCallback = (provider: string) => (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(provider, {
    failureRedirect: '/login?error=sso_failed',
    session: false,
  }, async (err: Error, user: User) => {
    if (err || !user) {
      return res.redirect('/login?error=sso_failed');
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'login',
        resource: 'auth',
        details: { method: provider + '_sso' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'low',
        status: 'success',
      },
    });
    const redirectUrl = String(req.query.state || '/dashboard');
    res.redirect(`${redirectUrl}?token=${token}`);
  })(req, res, next);
};

const getSsoProviders = (req: Request, res: Response) => {
  res.json({
    providers: SSO_PROVIDERS.map(p => ({
      id: p.id,
      name: p.name,
      enabled: p.enabled,
    })),
  });
};

const getSsoConfig = (req: Request, res: Response) => {
  res.json({
    providers: SSO_PROVIDERS.map(p => ({
      id: p.id,
      name: p.name,
      enabled: p.enabled,
      config: p.enabled ? 'configured' : 'not_configured',
    })),
  });
};

const getSsoStatus = (req: Request, res: Response) => {
  res.json({
    providers: SSO_PROVIDERS.map(p => ({
      id: p.id,
      enabled: p.enabled,
    })),
  });
};

const router = Router();
/**
 * @openapi
 * /auth/providers:
 *   get:
 *     tags:
 *       - SSO
 *     summary: List available SSO providers
 *     responses:
 *       200:
 *         description: List of SSO providers
 */
router.get('/providers', getSsoProviders);

/**
 * @openapi
 * /auth/config:
 *   get:
 *     tags:
 *       - SSO
 *     summary: Get SSO configuration
 *     responses:
 *       200:
 *         description: SSO configuration
 */
router.get('/config', getSsoConfig);

/**
 * @openapi
 * /auth/status:
 *   get:
 *     tags:
 *       - SSO
 *     summary: Get SSO status
 *     responses:
 *       200:
 *         description: SSO status
 */
router.get('/status', getSsoStatus);

/**
 * @openapi
 * /auth/google:
 *   get:
 *     tags:
 *       - SSO
 *     summary: Start Google SSO login
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to Google SSO
 */
router.get('/google', ssoLogin('google'));

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     tags:
 *       - SSO
 *     summary: Google SSO callback
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect with JWT token
 */
router.get('/google/callback', asyncHandler(ssoCallback('google')));
// Okta SSO (scaffold)
// router.get('/okta', ssoLogin('okta'));
// router.get('/okta/callback', asyncHandler(ssoCallback('okta')));

export default router; 