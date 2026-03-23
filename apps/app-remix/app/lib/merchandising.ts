import {
    StarFilledIcon,
    StarIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    MinusIcon,
    XCircleIcon,
    RefreshIcon,
    ChevronUpIcon,
    ChevronDownIcon,
} from "@shopify/polaris-icons";

export type BasketKey = "none" | "rocket" | "ignite" | "lift" | "sink" | "bury" | "anchor" | "exclude";

export interface BasketConfig {
    key: BasketKey;
    label: string;
    description: string;
    icon: any;
    color: string;
    badgeTone: "success" | "info" | "warning" | "critical" | "attention" | "subdued" | "neutral";
    multiplier: string;
}

export const BASKETS: BasketConfig[] = [
    {
        key: "none",
        label: "Standard",
        description: "Standard visibility. No boost or demotion applied.",
        icon: RefreshIcon,
        color: "#637381", // Polaris subdued gray
        badgeTone: "neutral",
        multiplier: "×1",
    },
    {
        key: "rocket",
        label: "Rocket",
        description: "Always show first. Best for clearance or high-priority items.",
        icon: StarFilledIcon,
        color: "#10b981", // Green
        badgeTone: "success",
        multiplier: "×5",
    },
    {
        key: "ignite",
        label: "Ignite",
        description: "Significant boost. Perfect for new collections or seasonal hits.",
        icon: StarIcon,
        color: "#3b82f6", // Blue
        badgeTone: "attention",
        multiplier: "×3",
    },
    {
        key: "lift",
        label: "Lift",
        description: "Boost visibility slightly. Great for high-margin products.",
        icon: ChevronUpIcon,
        color: "#0ea5e9", // Sky
        badgeTone: "info",
        multiplier: "×2",
    },
    {
        key: "sink",
        label: "Sink",
        description: "Lower priority. Only show when no better options exist.",
        icon: ChevronDownIcon,
        color: "#eab308", // Yellow
        badgeTone: "warning",
        multiplier: "×0.7",
    },
    {
        key: "bury",
        label: "Bury",
        description: "Hard demote. Only show if absolutely nothing else fits.",
        icon: MinusIcon,
        color: "#f97316", // Orange
        badgeTone: "subdued",
        multiplier: "×0.4",
    },
    {
        key: "anchor",
        label: "Anchor",
        description: "Maximum demotion. Keep at the absolute bottom of results.",
        icon: ChevronDownIcon,
        color: "#ef4444", // Red
        badgeTone: "critical",
        multiplier: "×0.1",
    },
    {
        key: "exclude",
        label: "Exclude",
        description: "Never show in any recommendations.",
        icon: XCircleIcon,
        color: "#919eab",
        badgeTone: "subdued",
        multiplier: "×0",
    },
];
