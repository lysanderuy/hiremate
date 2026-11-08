import { create } from "zustand";

interface ToastState {
  message: string;
  visible: boolean;
  seq: number;
  show: (message: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: "",
  visible: false,
  seq: 0,
  show: (message) => set((state) => ({ message, visible: true, seq: state.seq + 1 })),
  clear: () => set({ visible: false }),
}));
