import { Badge, BlockStack, InlineStack, Text, IndexTable } from "@shopify/polaris";
import { Layers, Tag as TagIcon, Trash2 } from "lucide-react";
import { Card } from "@repo/ui/components/Card";

type ExclusionMode = "GLOBAL_EXCLUSION" | "PAGE_SUPPRESSION";

interface ExclusionRule {
  id: string;
  label: string;
  itemValue: string;
  type: "CATEGORY" | "TAG";
  withDesc: boolean;
  mode: ExclusionMode;
}

interface ExclusionsTableProps {
  exclusions: ExclusionRule[];
  onRemove: (id: string) => void;
}

export function ExclusionsTable({ exclusions, onRemove }: ExclusionsTableProps) {
  const IconLayers = Layers as any;
  const IconTrash = Trash2 as any;
  const IconTag = TagIcon as any;

  return (
    <Card>
      <IndexTable
        resourceName={{ singular: "rule", plural: "rules" }}
        itemCount={exclusions.length}
        headings={[
          { title: "Exclusion item" },
          { title: "Rule type" },
          { title: "Mode" },
          { title: "", alignment: "end" },
        ]}
        selectable={false}
      >
        {exclusions.map((rule, idx) => {
          const Row = IndexTable.Row as any;
          const Cell = IndexTable.Cell as any;
          const isCategory = rule.type === "CATEGORY";
          return (
            <Row id={rule.id} key={rule.id} position={idx}>
              <Cell>
                <InlineStack gap="300" blockAlign="center">
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      backgroundColor: isCategory ? "#eff6ff" : "#faf5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isCategory ? "#3b82f6" : "#a855f7",
                      border: "1px solid",
                      borderColor: isCategory ? "#dbeafe" : "#f3e8ff",
                    }}
                  >
                    {isCategory ? (
                      <IconLayers size={16} strokeWidth={1.5} fill="none" stroke="currentColor" />
                    ) : (
                      <IconTag size={16} strokeWidth={1.5} fill="none" stroke="currentColor" />
                    )}
                  </div>
                  <BlockStack gap="0">
                    <Text variant="bodyMd" fontWeight="medium" as="span">
                      {rule.label}
                    </Text>
                    {isCategory && (
                      <Text variant="bodyXs" tone="subdued" as="span">
                        {rule.withDesc ? "Includes subcategories" : "Exact category only"}
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>
              </Cell>
              <Cell>
                <Badge tone={isCategory ? "info" : "attention"}>
                  {isCategory ? "By Category" : "By Tag"}
                </Badge>
              </Cell>
              <Cell>
                <Text variant="bodySm" as="span">
                  {rule.mode === "GLOBAL_EXCLUSION" ? "Content Filter" : "Placement suppression"}
                </Text>
              </Cell>
              <Cell>
                <InlineStack align="end">
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onRemove(rule.id);
                    }}
                    style={{
                      padding: "6px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease-in-out",
                    }}
                    className="hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
                  >
                    <IconTrash size={18} strokeWidth={1.5} fill="none" stroke="currentColor" />
                  </button>
                </InlineStack>
              </Cell>
            </Row>
          );
        })}
      </IndexTable>
    </Card>
  );
}
