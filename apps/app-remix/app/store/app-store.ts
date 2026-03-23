// app/store/app-store.ts
import { create } from "zustand";

export type ShopInfo = {
  domain: string;
  name?: string | null;
  plan?: string | null;
};

type SyncState = {
  open: boolean;
  message: string;
  complete: boolean;
  type?: "PRODUCT" | "ORDER";
};

// Onboarding step enum values matching Prisma schema
export type OnboardingStep =
  | "PREFERENCE"
  | "SYNC_PRODUCTS"
  | "SYNC_ORDERS"
  | "THEME_INSTALL"
  | "COMPLETED";

type OnboardingState = {
  step: OnboardingStep;
  isComplete: boolean;
};

type SettingsState = {
  isDirty: boolean;
  onSave?: () => void;
  isLoading?: boolean;
  rightPane?: React.ReactNode;
  hideRightPane?: boolean;
};

type AppState = {
  shop?: ShopInfo;
  sync: SyncState;
  onboarding: OnboardingState;
  settings: SettingsState;

  // derived helpers
  isSyncOpen: () => boolean;
  isSyncComplete: () => boolean;
  syncMessage: () => string;
  getOnboardingStepIndex: () => number;

  // actions
  setShop: (shop?: ShopInfo) => void;
  showSync: (message: string, complete?: boolean, type?: "PRODUCT" | "ORDER") => void;
  setSyncMessage: (message: string) => void;
  markSyncComplete: (message?: string, type?: "PRODUCT" | "ORDER") => void;
  hideSyncBar: () => void;
  resetSync: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  setSettingsState: (state: Partial<SettingsState>) => void;
};

const STEP_ORDER: OnboardingStep[] = [
  "PREFERENCE",
  "SYNC_PRODUCTS",
  "SYNC_ORDERS",
  "THEME_INSTALL",
  "COMPLETED",
];

export const useAppStore = create<AppState>((set, get) => ({
  shop: undefined,
  sync: { open: false, message: "", complete: false },
  onboarding: { step: "PREFERENCE", isComplete: false },
  settings: { isDirty: false, isLoading: false, hideRightPane: true },

  // derived
  isSyncOpen: () => get().sync.open,
  isSyncComplete: () => get().sync.complete,
  syncMessage: () => get().sync.message,
  getOnboardingStepIndex: () => {
    const step = get().onboarding.step;
    const idx = STEP_ORDER.indexOf(step);
    return idx >= 0 ? idx : 0;
  },

  // actions
  setShop: (shop) => set({ shop }),

  showSync: (message, complete = false, type) =>
    set({ sync: { open: true, message, complete, type } }),

  setSyncMessage: (message) =>
    set((s) => ({ sync: { ...s.sync, message } })),

  markSyncComplete: (message = "Sync complete", type) =>
    set({ sync: { open: true, message, complete: true, type } }),

  hideSyncBar: () =>
    set((s) => ({ sync: { ...s.sync, open: false } })),

  resetSync: () =>
    set({ sync: { open: false, message: "", complete: false } }),

  setOnboardingStep: (step) =>
    set({
      onboarding: {
        step,
        isComplete: step === "COMPLETED",
      },
    }),

  setSettingsState: (state) =>
    set((s) => ({ settings: { ...s.settings, ...state } })),
}));
