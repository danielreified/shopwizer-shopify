import {
  BlockStack,
  Box,
  Button,
  Checkbox,
  ChoiceList,
  Divider,
  InlineStack,
  Tag,
  Text,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";

type ExclusionMode = "GLOBAL_EXCLUSION" | "PAGE_SUPPRESSION";

interface SelectedItem {
  id: string;
  label: string;
}

interface ExclusionFormPaneProps {
  exclusionType: "CATEGORY" | "TAG";
  selectedItems: SelectedItem[];
  withDesc: boolean;
  mode: ExclusionMode;
  onTypeChange: (value: "CATEGORY" | "TAG") => void;
  onOpenCategoryModal: () => void;
  onOpenTagModal: () => void;
  onRemoveSelected: (id: string) => void;
  onWithDescChange: (next: boolean) => void;
  onModeChange: (next: ExclusionMode) => void;
  onSave: () => void;
}

export function ExclusionFormPane({
  exclusionType,
  selectedItems,
  withDesc,
  mode,
  onTypeChange,
  onOpenCategoryModal,
  onOpenTagModal,
  onRemoveSelected,
  onWithDescChange,
  onModeChange,
  onSave,
}: ExclusionFormPaneProps) {
  return (
    <Box padding="400">
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text variant="headingMd" as="h2">
            Add Exclusion Rule
          </Text>
          <Text variant="bodySm" tone="subdued">
            Prevent products from appearing in recommendations based on their category or tags.
          </Text>
        </BlockStack>

        <Divider />

        <BlockStack gap="300">
          <ChoiceList
            title="Exclusion Type"
            choices={[
              { label: "By Category", value: "CATEGORY" },
              { label: "By Product Tag", value: "TAG" },
            ]}
            selected={[exclusionType]}
            onChange={(val: string[]) => onTypeChange(val[0] as "CATEGORY" | "TAG")}
          />

          <Divider />

          {exclusionType === "CATEGORY" ? (
            <BlockStack gap="100">
              <Text variant="bodySm" fontWeight="medium">
                Select Category
              </Text>
              <Button fullWidth textAlign="left" icon={PlusIcon} onClick={onOpenCategoryModal}>
                {selectedItems.length > 0 ? "Add another category" : "Select a category"}
              </Button>
            </BlockStack>
          ) : (
            <BlockStack gap="100">
              <Text variant="bodySm" fontWeight="medium">
                Select Product Tags
              </Text>
              <Button fullWidth textAlign="left" icon={PlusIcon} onClick={onOpenTagModal}>
                {selectedItems.length > 0 ? "Add another tag" : "Select product tags"}
              </Button>
            </BlockStack>
          )}

          {selectedItems.length > 0 && (
            <InlineStack gap="100" wrap>
              {selectedItems.map((item) => (
                <Tag key={item.id} onRemove={() => onRemoveSelected(item.id)}>
                  {item.label}
                </Tag>
              ))}
            </InlineStack>
          )}

          {exclusionType === "CATEGORY" && (
            <Checkbox
              label="Include subcategories"
              checked={withDesc}
              onChange={onWithDescChange}
            />
          )}

          <Divider />

          <ChoiceList
            title="Exclusion Rule Type"
            selected={[mode]}
            onChange={(v: string[]) => onModeChange(v[0] as ExclusionMode)}
            choices={[
              {
                label: "Content Filtering",
                helpText: "Products matching this rule won't be recommended anywhere.",
                value: "GLOBAL_EXCLUSION",
              },
              {
                label: "Placement Suppression",
                helpText: `Hide recommendations on product pages matching this ${exclusionType.toLowerCase()}.`,
                value: "PAGE_SUPPRESSION",
              },
            ]}
          />
        </BlockStack>

        <Box paddingBlockStart="200">
          <Button
            variant="primary"
            fullWidth
            disabled={selectedItems.length === 0}
            onClick={onSave}
          >
            Add Exclusion Rule
          </Button>
        </Box>
      </BlockStack>
    </Box>
  );
}
