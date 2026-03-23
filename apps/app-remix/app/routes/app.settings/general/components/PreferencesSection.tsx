import { BlockStack, Card, Text } from "@shopify/polaris";
import { SettingsHeader } from "../../../../components/SettingsHeader";
import { PreferenceGrid } from "../../../../components/PreferenceGrid";
import { Sparkles, User, UserRound, Baby, Bike, Users, Settings2 } from "lucide-react";

const SparklesIcon = Sparkles as any;
const UserIcon = User as any;
const UserRoundIcon = UserRound as any;
const BabyIcon = Baby as any;
const BikeIcon = Bike as any;
const UsersIcon = Users as any;
const SettingsIcon = Settings2 as any;

interface PreferencesSectionProps {
  gender: string;
  age: string;
  onGenderChange: (value: string) => void;
  onAgeChange: (value: string) => void;
}

export function PreferencesSection({
  gender,
  age,
  onGenderChange,
  onAgeChange,
}: PreferencesSectionProps) {
  return (
    <BlockStack gap="500">
      <SettingsHeader
        icon={SettingsIcon}
        title="Storewide preferences"
        description="Set default gender and age profiles for your products."
      />
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="bodyMd" fontWeight="semibold">
              Gender
            </Text>
            <PreferenceGrid
              value={gender}
              onChange={onGenderChange}
              options={[
                {
                  value: "auto",
                  label: "Auto",
                  icon: SparklesIcon,
                  description: "Detect from product details",
                },
                {
                  value: "male",
                  label: "Male",
                  icon: UserIcon,
                  description: "Default to male products",
                },
                {
                  value: "female",
                  label: "Female",
                  icon: UserRoundIcon,
                  description: "Default to female products",
                },
              ]}
            />
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h3" variant="bodyMd" fontWeight="semibold">
              Age Group
            </Text>
            <PreferenceGrid
              value={age}
              onChange={onAgeChange}
              columns={5}
              options={[
                {
                  value: "auto",
                  label: "Auto",
                  icon: SparklesIcon,
                  description: "Auto-detect",
                },
                {
                  value: "babies",
                  label: "Babies",
                  icon: BabyIcon,
                  description: "0 - 2 years",
                },
                {
                  value: "kids",
                  label: "Kids",
                  icon: UserRoundIcon,
                  description: "2 - 12 years",
                },
                {
                  value: "teens",
                  label: "Teens",
                  icon: BikeIcon,
                  description: "13 - 19 years",
                },
                {
                  value: "adults",
                  label: "Adults",
                  icon: UsersIcon,
                  description: "20+ years",
                },
              ]}
            />
          </BlockStack>
          <Text tone="subdued" as="p">
            These defaults are applied when specific product data is missing.
          </Text>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
