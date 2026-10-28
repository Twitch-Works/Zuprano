import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

interface UIState {
  isAuthModalOpen: boolean;
  isCartDrawerOpen: boolean;
  /** Mobile category drawer, opened from the header or the bottom tab bar. */
  isMenuOpen: boolean;
  toast?: { type: ToastType; message: string; id: string };
  openAuthModal: () => void;
  closeAuthModal: () => void;
  toggleCartDrawer: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  showToast: (type: ToastType, message: string) => void;
  closeToast: () => void;
}

export const useUI = create<UIState>((set) => ({
  isAuthModalOpen: false,
  isCartDrawerOpen: false,
  isMenuOpen: false,
  toast: undefined,
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  toggleCartDrawer: () => set((s) => ({ isCartDrawerOpen: !s.isCartDrawerOpen })),
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  showToast: (type, message) => set({ toast: { type, message, id: Math.random().toString(36).slice(2, 11) } }),
  closeToast: () => set({ toast: undefined }),
}));
