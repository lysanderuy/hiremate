import { create } from "zustand";

interface FormGuardState {
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
}

export const useFormGuardStore = create<FormGuardState>((set) => ({
  dirty: false,
  setDirty: (dirty) => set({ dirty }),
}));
