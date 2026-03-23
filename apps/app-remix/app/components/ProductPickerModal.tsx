import React from "react";
import {
    BlockStack,
    Text,
    IndexTable,
    Thumbnail,
    Button,
} from "@shopify/polaris";
import { SelectorModalLayout } from "./SelectorModal";

interface ProductPickerModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    products: any[];
    loading: boolean;
    onAdd: (selectedIds: string[]) => void;
    selectedIds: string[];
    onSelectionChange: (selectionType: any, isSelected: boolean, id?: string) => void;
    singleSelect?: boolean;
}

export default function ProductPickerModal({
    open,
    onClose,
    title,
    searchValue,
    onSearchChange,
    products,
    loading,
    onAdd,
    selectedIds,
    onSelectionChange,
    singleSelect = false,
}: ProductPickerModalProps) {
    const resourceName = {
        singular: 'product',
        plural: 'products',
    };

    const handleTableSelectionChange = (selectionType: any, isSelected: boolean, id?: string) => {
        if (!singleSelect) {
            onSelectionChange(selectionType, isSelected, id);
            return;
        }

        if (!isSelected) {
            onSelectionChange(selectionType, isSelected, id);
            return;
        }

        // In single-select mode we always clear previous selection first.
        onSelectionChange("all", false);

        // Ignore "select all" and only allow one concrete row to be selected.
        if (selectionType === "all") {
            return;
        }

        onSelectionChange("single", true, id);
    };

    return (
        <SelectorModalLayout
            open={open}
            onClose={onClose}
            title={title}
            loading={loading}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by title, SKU, or vendor..."
            showGradients={false}
            emptyMessage="No products found. Try searching by title, SKU, or vendor."
            isEmpty={!loading && products.length === 0}
            footer={(
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={() => onAdd(selectedIds)}
                        disabled={selectedIds.length === 0}
                    >
                        Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}Selected
                    </Button>
                </>
            )}
        >
            <div style={{ border: '1px solid var(--p-color-border-subdued)', borderRadius: '8px' }}>
                <IndexTable
                    resourceName={resourceName}
                    itemCount={products.length}
                    selectedItemsCount={
                        singleSelect ? selectedIds.length : (selectedIds.length === products.length && products.length > 0 ? 'All' : selectedIds.length)
                    }
                    onSelectionChange={handleTableSelectionChange}
                    headings={[
                        { title: '' },
                        { title: 'Product' },
                        { title: 'Vendor' },
                    ]}
                    selectable
                >
                    {products.map((p, index) => (
                        <IndexTable.Row
                            id={p.id}
                            key={p.id}
                            selected={selectedIds.includes(p.id)}
                            position={index}
                        >
                            <IndexTable.Cell>
                                <Thumbnail
                                    source={p.thumbnailUrl || ""}
                                    alt={p.title}
                                    size="small"
                                />
                            </IndexTable.Cell>
                            <IndexTable.Cell>
                                <BlockStack gap="0">
                                    <Text variant="bodySm" as="p" fontWeight="bold" truncate>
                                        {p.title}
                                    </Text>
                                    <Text variant="bodyXs" as="p" tone="subdued">
                                        {p.handle}
                                    </Text>
                                </BlockStack>
                            </IndexTable.Cell>
                            <IndexTable.Cell>
                                <Text variant="bodySm" as="p" tone="subdued">
                                    {p.vendor}
                                </Text>
                            </IndexTable.Cell>
                        </IndexTable.Row>
                    ))}
                </IndexTable>
            </div>
        </SelectorModalLayout>
    );
}
