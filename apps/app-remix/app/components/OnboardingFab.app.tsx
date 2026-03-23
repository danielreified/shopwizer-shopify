import { useNavigate, useFetcher } from "react-router";
import {
  OnboardingFab as OnboardingFabComponent,
  type Step,
  SyncStatus,
} from "@repo/ui";
import { useAppStore } from "../store/app-store";

export default function OnboardingFab({ variant = "fixed" }: { variant?: "fixed" | "sidebar" }) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const onboarding = useAppStore((s) => s.onboarding);
  const stepIndex = useAppStore((s) => s.getOnboardingStepIndex());
  // Hardcoded for preview:
  const sync = { open: true, message: "Syncing products", complete: false };
  const hideSyncBar = () => console.log("hide");

  // Don't show FAB if onboarding is complete
  if (onboarding.isComplete && !sync.open) {
    return null;
  }

  // Helper to skip a step
  const skipStep = (intent: string) => {
    const fd = new FormData();
    fd.append("intent", intent);
    fetcher.submit(fd, { method: "post", action: "/app/onboarding" });
  };

  // Steps map to:
  // 0 = PREFERENCE
  // 1 = SYNC_PRODUCTS
  // 2 = SYNC_ORDERS
  // 3 = THEME_INSTALL
  // 4 = COMPLETED

  const steps: Step[] = [
    {
      label: "Set storewide preference",
      description:
        "Choose default gender and age settings for your product recommendations.",
      complete: stepIndex > 0,
      actionLabel: "Set preferences",
      onAction: () => navigate("/app/onboarding"),
    },
    {
      label: "Sync your product catalog",
      description:
        "Import your products so we can generate relevant recommendations across your storefront.",
      complete: stepIndex > 1,
      actionLabel: "Start sync",
      onAction: () => navigate("/app/onboarding"),
    },
    {
      label: "Sync last 90 days of orders",
      description:
        "Import your recent order history so we can compute trending, best-sellers, and new-arrivals.",
      complete: stepIndex > 2,
      actionLabel: "Sync orders",
      onAction: () => navigate("/app/onboarding"),
      secondaryActionLabel: "Skip",
      onSecondaryAction: () => skipStep("skipOrders90"),
    },
    {
      label: "Add theme extension",
      description:
        "Install the Shopwise Theme Extension so recommendations appear on your storefront.",
      complete: stepIndex > 3,
      actionLabel: "Open theme editor",
      onAction: () => navigate("/app/onboarding"),
      secondaryActionLabel: "Skip",
      onSecondaryAction: () => skipStep("themeInstalled"),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {sync.open && (
        <>
          <SyncStatus
            message={sync.message}
            isComplete={sync.complete}
            onDismiss={hideSyncBar}
          />
          <div className="border-b border-gray-100" />
        </>
      )}
      {!onboarding.isComplete && <OnboardingFabComponent steps={steps} variant={variant} />}
    </div>
  );
}
