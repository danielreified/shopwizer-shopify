import type { ReactNode } from "react";
import {
  BlockStack,
  Box,
  Button,
  Collapsible,
  InlineStack,
  Text,
  Card,
} from "@shopify/polaris";
import {
  SlidersHorizontal,
  Package,
  ShoppingCart,
  Paintbrush,
  Sparkles,
  User,
  UserRound,
  Baby,
  Bike,
  Users,
} from "lucide-react";
import { PreferenceGrid } from "../../../components/PreferenceGrid";

interface OnboardingStepsSectionProps {
  onboardingStep: number;
  gender: string;
  onGenderChange: (v: string) => void;
  age: string;
  onAgeChange: (v: string) => void;
  onSavePreferences: () => void;
  onStartSync: () => void;
  onSyncOrders: () => void;
  onSkipOrders: () => void;
  onThemeInstalled: () => void;
  onOpenThemeEditor: () => void;
  activeIntent: string | null;
  uploading: boolean;
}

interface StepCardProps {
  id: string;
  icon: any;
  title: string;
  description: string;
  iconGradient: { from: string; to: string };
  isActive: boolean;
  isLocked: boolean;
  children: ReactNode;
}

function StepCard({
  id,
  icon: Icon,
  title,
  description,
  iconGradient,
  isActive,
  isLocked,
  children,
}: StepCardProps) {
  return (
    <div
      style={{
        opacity: isLocked ? 0.5 : 1,
        pointerEvents: isLocked ? "none" : "auto",
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 0",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${iconGradient.from} 0%, ${iconGradient.to} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 2px 8px ${iconGradient.from}4D`,
            flexShrink: 0,
          }}
        >
          <Icon size={18} color="white" />
        </div>
        <div>
          <Text variant="headingSm" as="h4">{title}</Text>
          <Text variant="bodySm" as="p" tone="subdued">{description}</Text>
        </div>
      </div>

      {/* Content */}
      <Collapsible open={isActive} id={id}>
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f6f6f7",
            borderRadius: "12px",
            border: "1px solid #e1e3e5",
            marginBottom: "8px",
          }}
        >
          {children}
        </div>
      </Collapsible>
    </div>
  );
}

export function OnboardingStepsSection({
  onboardingStep,
  onGenderChange,
  gender,
  age,
  onAgeChange,
  onSavePreferences,
  onStartSync,
  onSyncOrders,
  onSkipOrders,
  onThemeInstalled,
  onOpenThemeEditor,
  activeIntent,
  uploading,
}: OnboardingStepsSectionProps) {
  return (
    <Card>
      <BlockStack gap="0">
        {/* Step 1: Preferences */}
        <StepCard
          id="step-preference"
          icon={SlidersHorizontal}
          title="Storewide preference"
          description="Choose a default profile for your store"
          iconGradient={{ from: "#8b5cf6", to: "#a855f7" }}
          isActive={onboardingStep === 0}
          isLocked={false}
        >
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="bodySm" fontWeight="bold">Gender</Text>
              <PreferenceGrid
                value={gender}
                onChange={onGenderChange}
                options={[
                  { value: "auto", label: "Auto", icon: Sparkles, description: "Detect from product details" },
                  { value: "male", label: "Male", icon: User, description: "Default to male products" },
                  { value: "female", label: "Female", icon: UserRound, description: "Default to female products" },
                ]}
              />
            </BlockStack>
            <BlockStack gap="200">
              <Text as="h3" variant="bodySm" fontWeight="bold">Age Group</Text>
              <PreferenceGrid
                value={age}
                onChange={onAgeChange}
                columns={5}
                options={[
                  { value: "auto", label: "Auto", icon: Sparkles, description: "Auto-detect" },
                  { value: "babies", label: "Babies", icon: Baby, description: "0 - 2 years" },
                  { value: "kids", label: "Kids", icon: UserRound, description: "2 - 12 years" },
                  { value: "teens", label: "Teens", icon: Bike, description: "13 - 19 years" },
                  { value: "adults", label: "Adults", icon: Users, description: "20+ years" },
                ]}
              />
            </BlockStack>
            <Text tone="subdued" variant="bodySm" as="p">
              These defaults are applied when specific product data is missing.
            </Text>
            <InlineStack gap="200">
              <Button
                variant="primary"
                onClick={onSavePreferences}
                loading={activeIntent === "savePreferences"}
              >
                Save preference
              </Button>
            </InlineStack>
          </BlockStack>
        </StepCard>

        {/* Step 2: Sync Products */}
        <StepCard
          id="step-sync-products"
          icon={Package}
          title="Sync your product catalog"
          description="Import your products so recommendations can be generated"
          iconGradient={{ from: "#10b981", to: "#14b8a6" }}
          isActive={onboardingStep === 1}
          isLocked={onboardingStep < 1}
        >
          <BlockStack gap="400">
            <Text as="p" tone="subdued">
              Import your products so recommendations can be generated based on your inventory.
            </Text>
            <InlineStack gap="200">
              <Button variant="primary" onClick={onStartSync} loading={uploading}>
                Start sync
              </Button>
            </InlineStack>
          </BlockStack>
        </StepCard>

        {/* Step 3: Sync Orders */}
        <StepCard
          id="step-sync-orders"
          icon={ShoppingCart}
          title="Sync last 90 days of orders"
          description="Import recent order history for trending and best-seller data"
          iconGradient={{ from: "#f59e0b", to: "#f97316" }}
          isActive={onboardingStep === 2}
          isLocked={onboardingStep < 2}
        >
          <BlockStack gap="400">
            <Text as="p" tone="subdued">
              Import your recent order history so we can compute trending, best-sellers, and new-arrivals.
            </Text>
            <InlineStack gap="200">
              <Button
                variant="primary"
                onClick={onSyncOrders}
                loading={activeIntent === "syncOrders90"}
              >
                Sync orders
              </Button>
              <Button onClick={onSkipOrders}>Skip</Button>
            </InlineStack>
          </BlockStack>
        </StepCard>

        {/* Step 4: Theme Install */}
        <StepCard
          id="step-theme-install"
          icon={Paintbrush}
          title="Add theme extension"
          description="Install the theme extension so recommendations appear on your storefront"
          iconGradient={{ from: "#ec4899", to: "#f43f5e" }}
          isActive={onboardingStep === 3}
          isLocked={onboardingStep < 3}
        >
          <BlockStack gap="400">
            <Text as="p" tone="subdued">
              Install the Shopwise Theme Extension so recommendations appear on your storefront.
            </Text>
            <InlineStack gap="200">
              <Button variant="primary" onClick={onOpenThemeEditor}>
                Open theme editor
              </Button>
              <Button onClick={onThemeInstalled} loading={activeIntent === "themeInstalled"}>
                Mark as done
              </Button>
            </InlineStack>
          </BlockStack>
        </StepCard>
      </BlockStack>
    </Card>
  );
}
