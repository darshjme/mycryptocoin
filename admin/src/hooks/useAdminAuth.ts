'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAdminStore } from '@/stores/adminStore';
import type { AdminUser } from '@/lib/api';

export function useAdminAuth() {
  const router = useRouter();
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout, setUser } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpRequired, setOtpRequired] = useState(false);

  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    if (savedUser && savedToken && !user) {
      try {
        const parsed = JSON.parse(savedUser) as AdminUser;
        setUser(parsed);
      } catch {
        // invalid stored user
      }
    }
  }, [user, setUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.login(email, password);
      if (response.data.requiresOtp) {
        setOtpRequired(true);
      }
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.verify2FA(otp);
      storeLogin(response.data.user, response.data.token);
      setOtpRequired(false);
      router.push('/admin/dashboard');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeLogin, router]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // continue logout even on error
    } finally {
      storeLogout();
      router.push('/login');
    }
  }, [storeLogout, router]);

  const checkAuth = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) return false;

    try {
      const response = await api.getMe();
      setUser(response.data);
      return true;
    } catch {
      storeLogout();
      return false;
    }
  }, [setUser, storeLogout]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    otpRequired,
    login,
    verifyOtp,
    logout,
    checkAuth,
    setError,
  };
}

export default useAdminAuth;
