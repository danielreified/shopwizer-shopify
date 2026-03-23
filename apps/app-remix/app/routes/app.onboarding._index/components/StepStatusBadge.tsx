import { Badge } from "@shopify/polaris";

interface StepStatusBadgeProps {
  step: number;
  currentStep: number;
}

export function StepStatusBadge({ step, currentStep }: StepStatusBadgeProps) {
  if (currentStep > step) {
    return <Badge tone="success">Complete</Badge>;
  }
  if (currentStep === step) {
    return <Badge tone="attention">In Progress</Badge>;
  }
  return <Badge tone="new">Locked</Badge>;
}
