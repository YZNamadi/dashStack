import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

export const Register = () => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
};
