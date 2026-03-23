import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Text,
  TextField,
} from "@shopify/polaris";
import { SelectorModalLayout } from "../../../components/SelectorModal";

interface RedeemCodeModalProps {
  open: boolean;
  code: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
}

export function RedeemCodeModal({
  open,
  code,
  loading,
  error,
  onClose,
  onCodeChange,
  onSubmit,
}: RedeemCodeModalProps) {
  return (
    <SelectorModalLayout
      open={open}
      onClose={onClose}
      title="Redeem Code"
      showGradients={false}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onSubmit} loading={loading}>
            Apply Code
          </Button>
        </>
      }
    >
      <BlockStack gap="400">
        {error && (
          <Banner title="Invalid promo code" tone="warning">
            <p>The code you entered is invalid or has expired. Please check and try again.</p>
          </Banner>
        )}
        <BlockStack gap="200">
          <Text variant="headingLg" as="h2">
            Redeem a promotion code
          </Text>
          <Text variant="bodyMd" as="p" tone="subdued">
            Enter your promo or private code below to unlock special plans and pricing.
          </Text>
        </BlockStack>

        <Card>
          <Box padding="500">
            <BlockStack gap="400">
              <TextField
                label="Promotion Code"
                value={code}
                onChange={onCodeChange}
                placeholder="e.g. SAVE20, EARLYBIRD"
                autoComplete="off"
                helpText="Case-sensitive. Codes are applied immediately upon validation."
              />
            </BlockStack>
          </Box>
        </Card>

        <Box padding="400" background="bg-fill-info-secondary" borderRadius="200">
          <InlineStack gap="300" blockAlign="center">
            <Text as="span" variant="bodyMd">
              💡
            </Text>
            <Text as="p" variant="bodySm">
              Private codes are often provided to early adopters or during special marketing events.
            </Text>
          </InlineStack>
        </Box>
      </BlockStack>
    </SelectorModalLayout>
  );
}
