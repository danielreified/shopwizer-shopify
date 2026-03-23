import React from "react";
import { Badge, Icon } from "@shopify/polaris";
import { SelectorModal, SelectorModalLayout } from "./SelectorModal";
import { BASKETS, type BasketKey } from "../lib/merchandising";

interface MerchandisingModalProps {
    open: boolean;
    onClose: () => void;
    productTitle: string;
    activeBasket?: BasketKey;
    onSelect: (basket: BasketKey) => void;
}

export default function MerchandisingModal({
    open,
    onClose,
    productTitle,
    activeBasket,
    onSelect
}: MerchandisingModalProps) {
    return (
        <SelectorModalLayout
            open={open}
            onClose={onClose}
            title={`Move "${productTitle}"`}
        >
            <div className="pb-4 text-gray-600">
                Select which basket you want to move this product to:
            </div>

            {[
                { title: null, keys: ["none"] },
                { title: "BOOST", keys: ["rocket", "ignite", "lift"] },
                { title: "DEMOTE", keys: ["sink", "bury", "anchor"] },
                { title: "HIDE", keys: ["exclude"] }
            ].map((group, i) => (
                <div key={i} className="mb-4">
                    {group.title && (
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">
                            {group.title}
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        {group.keys.map((key) => {
                            const basket = BASKETS.find((b) => b.key === key);
                            if (!basket) return null;
                            const isActive = basket.key === activeBasket;

                            return (
                                <SelectorModal.Row
                                    key={basket.key}
                                    label={basket.label}
                                    description={basket.description}
                                    icon={
                                        <div>
                                            <Icon source={basket.icon} />
                                        </div>
                                    }
                                    isSelected={isActive}
                                    disabled={isActive}
                                    onClick={() => onSelect(basket.key as BasketKey)}
                                    trailing={
                                        <Badge tone={basket.badgeTone as any} size="small">
                                            {basket.multiplier}
                                        </Badge>
                                    }
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </SelectorModalLayout>
    );
}
