import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, DashboardStats, SystemHealth, WhatsAppStatus } from '@/lib/api';

interface AdminState {
  // Auth
  user: AdminUser | null;
  isAuthenticated: boolean;
  token: string | null;

  // UI
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentPage: string;

  // Dashboard
  dashboardStats: DashboardStats | null;
  systemHealth: SystemHealth | null;

  // WhatsApp
  whatsappStatus: WhatsAppStatus | null;

  // Notifications
  notifications: AdminNotification[];
  unreadCount: number;

  // Actions
  setUser: (user: AdminUser | null) => void;
  setToken: (token: string | null) => void;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setSystemHealth: (health: SystemHealth) => void;
  setWhatsAppStatus: (status: WhatsAppStatus) => void;
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      token: null,
      sidebarOpen: true,
      sidebarCollapsed: false,
      currentPage: 'dashboard',
      dashboardStats: null,
      systemHealth: null,
      whatsappStatus: null,
      notifications: [],
      unreadCount: 0,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          dashboardStats: null,
          systemHealth: null,
          whatsappStatus: null,
        });
      },

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed, sidebarOpen: !state.sidebarOpen })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setCurrentPage: (page) => set({ currentPage: page }),

      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      setSystemHealth: (health) => set({ systemHealth: health }),

      setWhatsAppStatus: (status) => set({ whatsappStatus: status }),

      addNotification: (notification) => {
        const newNotification: AdminNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }));
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'mycryptocoin-admin',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

export default useAdminStore;
