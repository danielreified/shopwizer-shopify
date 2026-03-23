import { BlockStack } from "@shopify/polaris";
import { ThreePaneLayout } from "@repo/ui";
import { BASKETS, type BasketKey } from "../../../lib/merchandising";

interface MerchandisingSidebarProps {
  activeBasket: BasketKey;
  onSelect: (basket: BasketKey) => void;
}

export function MerchandisingSidebar({
  activeBasket,
  onSelect,
}: MerchandisingSidebarProps) {
  const groups: Array<{ title: string; keys: BasketKey[] }> = [
    { title: "BOOST", keys: ["rocket", "ignite", "lift"] },
    { title: "DEMOTE", keys: ["sink", "bury", "anchor"] },
    { title: "HIDE", keys: ["exclude"] },
  ];

  return (
    <BlockStack gap="400">
      {groups.map((group) => (
        <ThreePaneLayout.NavGroup key={group.title} title={group.title}>
          {BASKETS.filter((basket) => group.keys.includes(basket.key)).map(
            (basket) => (
              <ThreePaneLayout.NavItem
                key={basket.key}
                label={basket.label}
                description={basket.description}
                icon={basket.icon}
                active={activeBasket === basket.key}
                onClick={() => onSelect(basket.key)}
              />
            )
          )}
        </ThreePaneLayout.NavGroup>
      ))}
    </BlockStack>
  );
}
