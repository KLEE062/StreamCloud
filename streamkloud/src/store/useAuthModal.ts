import { create } from 'zustand';

interface AuthModalStore {
  isOpen: boolean;
  mode: 'login' | 'signup' | 'verify';
  open: (mode?: 'login' | 'signup' | 'verify') => void;
  close: () => void;
  setMode: (mode: 'login' | 'signup' | 'verify') => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  mode: 'login',
  open: (mode = 'login') => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
}));
