import { create } from 'zustand';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (userUpdates: Partial<User>) => void;
  initialize: () => void;
}

const TOKEN_COOKIE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    if (typeof window === 'undefined') return;

    try {
      const token = Cookies.get(TOKEN_COOKIE_KEY) || localStorage.getItem(TOKEN_COOKIE_KEY);
      const userRaw = localStorage.getItem(USER_STORAGE_KEY);
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (token && user) {
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: (token: string, user: User) => {
    Cookies.set(TOKEN_COOKIE_KEY, token, {
      expires: 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    localStorage.setItem(TOKEN_COOKIE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    Cookies.remove(TOKEN_COOKIE_KEY);
    localStorage.removeItem(TOKEN_COOKIE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  updateUser: (userUpdates: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updated = { ...currentUser, ...userUpdates };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    set({ user: updated });
  },
}));

