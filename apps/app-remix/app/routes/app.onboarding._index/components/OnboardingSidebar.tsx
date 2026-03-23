import { BlockStack } from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";
import { CircleDashed } from "lucide-react";
import { SidebarGroup, SidebarItem } from "../../../components/SidebarMenu";

interface OnboardingSidebarProps {
  onboardingStep: number;
  stepOrder: string[];
  stepLabels: Record<string, string>;
  stepDescriptions: Record<string, string>;
}

export function OnboardingSidebar({
  onboardingStep,
  stepOrder,
  stepLabels,
  stepDescriptions,
}: OnboardingSidebarProps) {
  return (
    <BlockStack gap="400">
      <SidebarGroup title="Setup Progress">
        {stepOrder.map((step, idx) => {
          const isCompleted = onboardingStep > idx;
          const isActive = onboardingStep === idx;
          const isLocked = onboardingStep < idx;

          return (
            <SidebarItem
              key={step}
              label={stepLabels[step]}
              description={stepDescriptions[step]}
              selected={isActive}
              icon={isCompleted ? CheckCircleIcon : CircleDashed}
              tone={isCompleted ? "success" : "subdued"}
              disabled={isLocked}
              clickable={false}
            />
          );
        })}
      </SidebarGroup>
    </BlockStack>
  );
}
