import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole, KycStatus } from '@mycryptocoin/shared';

/**
 * Dashboard-facing User type.
 * Aligns with the shared User interface (Prisma model) but only includes
 * the fields relevant to the authenticated client session.
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  businessName: string;
  businessUrl?: string;
  logoUrl?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  kycStatus: KycStatus;
  lastLoginAt?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  otpPhone: string | null;
  otpEmail: string | null;
  otpPurpose: 'LOGIN' | 'WITHDRAWAL' | 'EMAIL_VERIFY' | 'PASSWORD_RESET' | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setOtpTarget: (phone: string | null, email: string | null, purpose: AuthState['otpPurpose']) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      otpPhone: null,
      otpEmail: null,
      otpPurpose: null,

      setUser: (user) => set({ user }),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      setLoading: (isLoading) => set({ isLoading }),

      setOtpTarget: (otpPhone, otpEmail, otpPurpose) =>
        set({ otpPhone, otpEmail, otpPurpose }),

      login: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isLoading: false }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          otpPhone: null,
          otpEmail: null,
          otpPurpose: null,
        }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'mycryptocoin-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
