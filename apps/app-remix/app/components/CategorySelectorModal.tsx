import React, { useState, useEffect, useMemo } from "react";
import { SelectorModal, SelectorModalLayout } from "./SelectorModal";
import { Layers } from "lucide-react";
import type { CategoryNode } from "../types/categories";

export type { CategoryNode };

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (category: CategoryNode) => void;
}

const LucideLayers = Layers as any;
const IconLayers = <LucideLayers size={20} color="var(--p-color-icon)" />;

export default function CategorySelectorModal({ open, onClose, onSelect }: Props) {
    const [stack, setStack] = useState<CategoryNode[]>([]);
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const currentParent = stack.length > 0 ? stack[stack.length - 1] : null;

    useEffect(() => {
        if (!open) return;
        fetchCategories();
    }, [open, currentParent, searchQuery]);

    async function fetchCategories() {
        setLoading(true);
        try {
            let url = "/api/categories";
            if (searchQuery) {
                url += `?q=${encodeURIComponent(searchQuery)}`;
            } else if (currentParent) {
                url += `?parentId=${currentParent.id}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        } finally {
            setLoading(false);
        }
    }

    const handleBack = () => {
        setStack((prev) => prev.slice(0, -1));
        setSearchQuery("");
    };

    const handleCategoryClick = (cat: CategoryNode) => {
        if (cat.isLeaf) {
            onSelect(cat);
            onClose();
        } else {
            setStack((prev) => [...prev, cat]);
            setSearchQuery("");
        }
    };

    const breadcrumbs = useMemo(() => {
        if (searchQuery) return [{ label: "Search results" }];
        const crumbs: Array<{ label: string; onClick?: () => void }> = [{ label: "Categories", onClick: () => setStack([]) }];
        stack.forEach((cat, i) => {
            crumbs.push({
                label: cat.name,
                onClick: i < stack.length - 1 ? () => setStack(stack.slice(0, i + 1)) : undefined
            });
        });
        return crumbs;
    }, [stack, searchQuery]);

    return (
        <SelectorModalLayout
            open={open}
            onClose={onClose}
            title={searchQuery ? "Search Categories" : currentParent ? currentParent.name : "Select Category"}
            loading={loading}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search for a category..."
            breadcrumbs={!searchQuery ? breadcrumbs : []}
            onBack={stack.length > 0 ? handleBack : undefined}
            emptyMessage="No categories found"
            isEmpty={categories.length === 0}
        >
            {categories.map((cat) => (
                <SelectorModal.Row
                    key={cat.id}
                    label={cat.name}
                    description={searchQuery ? cat.fullName : undefined}
                    icon={IconLayers}
                    isLeaf={cat.isLeaf}
                    onClick={() => handleCategoryClick(cat)}
                />
            ))}
        </SelectorModalLayout>
    );
}
