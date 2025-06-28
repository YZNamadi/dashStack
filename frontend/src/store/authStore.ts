import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import { apiClient } from '../lib/api';
import { toast } from '@/hooks/use-toast';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await apiClient.login({ email, password });
          localStorage.setItem('dashstack_token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
          });
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
        } catch (error) {
          toast({
            title: 'Login failed',
            description: error instanceof Error ? error.message : 'Invalid credentials',
            variant: 'destructive',
          });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          const response = await apiClient.register({ name, email, password });
          localStorage.setItem('dashstack_token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
          });
          toast({
            title: 'Account created!',
            description: 'Welcome to DashStack.',
          });
        } catch (error) {
          toast({
            title: 'Registration failed',
            description: error instanceof Error ? error.message : 'Please try again',
            variant: 'destructive',
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('dashstack_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        toast({
          title: 'Logged out',
          description: 'You have been successfully logged out.',
        });
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('dashstack_token');
          if (!token) {
            set({ isAuthenticated: false });
            return;
          }

          const user = await apiClient.getMe();
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          localStorage.removeItem('dashstack_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'dashstack-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
