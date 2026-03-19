import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { useAuthStore, User } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface LoginPayload {
  whatsapp?: string;
  email?: string;
  password?: string;
  otp: string;
}

interface RegisterPayload {
  businessName: string;
  email: string;
  password: string;
  businessType: string;
  whatsapp: string;
  otp: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function useAuth() {
  const router = useRouter();
  const { user, token, login, logout, setLoading } = useAuthStore();
  const { addToast } = useNotificationStore();

  const isAuthenticated = !!token && !!user;

  // Fetch current user profile
  const profileQuery = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const { data } = await api.get<User>(ENDPOINTS.MERCHANT.PROFILE);
      useAuthStore.getState().setUser(data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Login with OTP via WhatsApp
  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      setLoading(true);
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, payload);
      return data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      addToast({ type: 'success', title: 'Welcome back!', message: `Signed in as ${data.user.businessName}` });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      setLoading(false);
      addToast({ type: 'error', title: 'Login failed', message: error.message });
    },
  });

  // Register
  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      setLoading(true);
      const { data } = await api.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, payload);
      return data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      addToast({ type: 'success', title: 'Account created!', message: 'Welcome to MyCryptoCoin' });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      setLoading(false);
      addToast({ type: 'error', title: 'Registration failed', message: error.message });
    },
  });

  // Logout
  const handleLogout = async () => {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore logout API errors
    }
    logout();
    router.push('/login');
    addToast({ type: 'info', title: 'Signed out successfully' });
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading: profileQuery.isLoading,
    profile: profileQuery.data,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: handleLogout,
  };
}
