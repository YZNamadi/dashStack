import { useEffect, useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '../store/authStore';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Loader2, Chrome } from 'lucide-react';

export const Login = () => {
  const { isAuthenticated, setToken } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [ssoLoading, setSsoLoading] = useState(false);

  // Handle SSO callback with token
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (token) {
      setToken(token);
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
      navigate('/dashboard', { replace: true });
    }
    
    if (error) {
      let errorMessage = 'Login failed';
      switch (error) {
        case 'sso_failed':
          errorMessage = 'Google SSO authentication failed';
          break;
        case 'token_generation_failed':
          errorMessage = 'Failed to generate authentication token';
          break;
        default:
          errorMessage = 'An error occurred during login';
      }
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [searchParams, setToken, navigate, toast]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSSO = () => {
    setSsoLoading(true);
    const currentUrl = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(currentUrl)}`;
  };

  return (
    <AuthLayout>
      <LoginForm />
      <div className="mt-6">
        <Button
          className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
          onClick={handleGoogleSSO}
          disabled={ssoLoading}
        >
          {ssoLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <Chrome className="w-4 h-4 mr-2" />
              Sign in with Google
            </>
          )}
        </Button>
      </div>
    </AuthLayout>
  );
};
