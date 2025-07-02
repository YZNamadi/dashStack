import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';

const prisma = new PrismaClient();

// Controller functions
const googleLogin = (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl = typeof req.query.redirect === 'string' ? req.query.redirect : '/dashboard';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: redirectUrl,
  })(req, res, next);
};

const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', {
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
        details: { method: 'google_sso' },
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

const getSsoStatus = (req: Request, res: Response) => {
  res.json({
    google: {
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      clientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not_configured',
    },
  });
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback',
  },
  async (accessToken: string, refreshToken: string, profile: Profile, done: (error: Error | null, user?: User) => void) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Email not provided by Google'));
      }
      let user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName || 'Google User',
            // googleId: profile.id, // Uncomment for Google SSO support
            password: await bcrypt.hash(Math.random().toString(36), 10),
          },
        });
      }
      done(null, user);
    } catch (error) {
        done(error as Error);
    }
  }
));

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

const router = Router();
router.get('/google', googleLogin);
router.get('/google/callback', asyncHandler(googleCallback));
router.get('/status', getSsoStatus);

export default router; 