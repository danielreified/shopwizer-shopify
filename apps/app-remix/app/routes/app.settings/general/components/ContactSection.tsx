import { BlockStack, Card, Text, TextField } from "@shopify/polaris";
import { SettingsHeader } from "../../../../components/SettingsHeader";
import { Mail } from "lucide-react";

const MailIcon = Mail as any;

interface ContactSectionProps {
  contactName: string;
  contactEmail: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

export function ContactSection({
  contactName,
  contactEmail,
  onNameChange,
  onEmailChange,
}: ContactSectionProps) {
  return (
    <BlockStack gap="500">
      <SettingsHeader
        icon={MailIcon}
        title="Contact person"
        description="We'll send important alerts and updates to this contact."
      />
      <Card>
        <BlockStack gap="300">
          <TextField
            label="Full name"
            value={contactName}
            onChange={onNameChange}
            autoComplete="name"
            placeholder="Jane Merchant"
          />
          <TextField
            label="Email"
            value={contactEmail}
            onChange={onEmailChange}
            autoComplete="email"
            type="email"
            placeholder="you@shop.com"
          />
          <Text tone="subdued" as="p">
            Use a shared inbox if multiple teammates need to receive alerts.
          </Text>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
