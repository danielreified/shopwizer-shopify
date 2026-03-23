import React, { useState, useEffect, useMemo } from "react";
import { SelectorModal, SelectorModalLayout } from "./SelectorModal";
import { Button, Checkbox } from "@shopify/polaris";
import { Tag as TagIcon } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (tag: string) => void;
    selectedTags: string[];
}

const LucideTagIcon = TagIcon as any;
const IconTag = <LucideTagIcon size={20} color="var(--p-color-icon)" />;

export default function TagSelectorModal({ open, onClose, onSelect, selectedTags }: Props) {
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!open) return;
        fetchTags();
    }, [open]);

    async function fetchTags() {
        setLoading(true);
        try {
            const res = await fetch("/api/tags");
            const data = await res.json();
            setAllTags(data.tags || []);
        } catch (err) {
            console.error("Failed to fetch tags", err);
        } finally {
            setLoading(false);
        }
    }

    const filteredTags = useMemo(() => {
        if (!searchQuery) return allTags;
        return allTags.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allTags, searchQuery]);

    return (
        <SelectorModalLayout
            open={open}
            onClose={onClose}
            title="Select Product Tags"
            loading={loading}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search for a tag..."
            emptyMessage="No tags found"
            isEmpty={filteredTags.length === 0}
            footer={(
                <Button variant="primary" onClick={onClose}>
                    Done
                </Button>
            )}
        >
            {filteredTags.map((tag) => (
                <SelectorModal.Row
                    key={tag}
                    label={tag}
                    icon={IconTag}
                    isSelected={selectedTags.includes(tag)}
                    onClick={() => onSelect(tag)}
                    trailing={(
                        <Checkbox
                            label=""
                            checked={selectedTags.includes(tag)}
                            onChange={() => onSelect(tag)}
                        />
                    )}
                />
            ))}
        </SelectorModalLayout>
    );
}
