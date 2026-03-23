import { Badge, BlockStack, Box, Button, Divider, Text } from "@shopify/polaris";
import { SidebarGroup, SidebarCard } from "../../../components/SidebarMenu";
import { Rocket, TrendingDown, Ban } from "lucide-react";
import { BASKETS, type BasketKey } from "../../../lib/merchandising";

interface MerchandisingSummaryPaneProps {
  products: Record<BasketKey, { id: string }[]>;
  onConfigureRules: () => void;
}

export function MerchandisingSummaryPane({
  products,
  onConfigureRules,
}: MerchandisingSummaryPaneProps) {
  return (
    <BlockStack gap="0">
      <SidebarGroup title="How it works" variant="bold" uppercase noDivider>
        <Box paddingBlockEnd="200">
          <Text variant="bodyXs" tone="subdued" as="p">
            Baskets apply a <strong>score multiplier</strong> to products. Items in
            higher multiplier baskets appear more often.
          </Text>
        </Box>
        <BlockStack gap="200">
          <SidebarCard>
            <BlockStack gap="150">
              <Text variant="bodyXs" fontWeight="bold" tone="subdued" as="p">
                DEFAULT
              </Text>
              {BASKETS.filter((b) => b.key === "none").map((basket) => (
                <div
                  key={basket.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text variant="bodyXs" as="span">
                    {basket.label}
                  </Text>
                  <Badge tone={basket.badgeTone as any} size="small">
                    {basket.multiplier}
                  </Badge>
                </div>
              ))}
            </BlockStack>
          </SidebarCard>

          <SidebarCard>
            <BlockStack gap="150">
              <Text variant="bodyXs" fontWeight="bold" tone="subdued" as="p">
                BOOST
              </Text>
              {BASKETS.filter((b) => ["rocket", "ignite", "lift"].includes(b.key)).map(
                (basket) => (
                  <div
                    key={basket.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Text variant="bodyXs" as="span">
                      {basket.label}
                    </Text>
                    <Badge tone={basket.badgeTone as any} size="small">
                      {basket.multiplier}
                    </Badge>
                  </div>
                )
              )}
            </BlockStack>
          </SidebarCard>

          <SidebarCard>
            <BlockStack gap="150">
              <Text variant="bodyXs" fontWeight="bold" tone="subdued" as="p">
                DEMOTE
              </Text>
              {BASKETS.filter((b) => ["sink", "bury", "anchor"].includes(b.key)).map(
                (basket) => (
                  <div
                    key={basket.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Text variant="bodyXs" as="span">
                      {basket.label}
                    </Text>
                    <Badge tone={basket.badgeTone as any} size="small">
                      {basket.multiplier}
                    </Badge>
                  </div>
                )
              )}
            </BlockStack>
          </SidebarCard>
        </BlockStack>
      </SidebarGroup>

      <Box paddingBlock="200">
        <Divider />
      </Box>

      <SidebarGroup title="Quick Stats" variant="bold" uppercase noDivider>
        <BlockStack gap="200">
          <SidebarCard
            icon={Rocket}
            iconTone="success"
            title="Total Boosted"
            value={(
              products.rocket.length +
              products.ignite.length +
              products.lift.length
            ).toString()}
          />
          <SidebarCard
            icon={TrendingDown}
            iconTone="info"
            title="Total Demoted"
            value={(
              products.sink.length +
              products.bury.length +
              products.anchor.length
            ).toString()}
          />
          <SidebarCard
            icon={Ban}
            iconTone="subdued"
            title="Total Hidden"
            value={products.exclude.length.toString()}
          />
        </BlockStack>
      </SidebarGroup>

      <Box paddingBlock="200">
        <Divider />
      </Box>

      <SidebarGroup title="Recommendations" variant="bold" uppercase noDivider>
        <Box padding="300" background="bg-surface-secondary" borderRadius="300">
          <BlockStack gap="200">
            <Text variant="bodyXs" tone="subdued" as="p">
              Changes take effect immediately on your storefront.
            </Text>
            <Button fullWidth variant="plain" onClick={onConfigureRules}>
              Configure global rules
            </Button>
          </BlockStack>
        </Box>
      </SidebarGroup>
    </BlockStack>
  );
}
