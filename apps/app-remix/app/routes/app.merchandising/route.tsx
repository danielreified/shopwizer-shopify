export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";
import { useState, useCallback, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import {
    Box as PolarisBox,
    BlockStack as PolarisBlockStack,
    Button as PolarisButton,
    useIndexResourceState,
} from "@shopify/polaris";
import {
    PlusIcon,
} from "@shopify/polaris-icons";
import { ThreePaneLayout } from "@repo/ui";
import { buildFormData } from "../../lib/form-actions";
import {
    BasketContent,
    BasketHeader,
    MerchandisingSidebar,
    MerchandisingSummaryPane,
} from "./components";
import OnboardingFab from "../../components/OnboardingFab.app";
import MerchandisingModal from "../../components/MerchandisingModal.app";
import ProductPickerModal from "../../components/ProductPickerModal";
import { BASKETS, type BasketKey } from "../../lib/merchandising";
import { usePaneMode } from "../../hooks/use-pane-mode";

const Box = PolarisBox as any;
const BlockStack = PolarisBlockStack as any;
const Button = PolarisButton as any;

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface Product {
    id: string;
    title: string;
    handle: string;
    imageUrl: string;
    price: string;
    vendor: string;
}

import prisma from "../../db.server";
import { authenticate } from "../../shopify.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

// ---------------------------------------------------------------------------
// LOADER & ACTION
// ---------------------------------------------------------------------------

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);

    const products = await prisma.product.findMany({
        where: {
            shopId: session.shop,
            OR: [
                { merchandisingBasket: { not: null } },
                { enabled: false }
            ]
        },
        include: {
            images: { take: 1 },
            variants: { take: 1 },
        }
    });

    const grouped: Record<BasketKey, any[]> = {
        rocket: [],
        ignite: [],
        lift: [],
        sink: [],
        bury: [],
        anchor: [],
        exclude: [],
    };

    products.forEach(p => {
        const product = {
            id: p.id.toString(),
            title: p.title,
            handle: p.handle || "",
            imageUrl: p.images[0]?.url || "",
            price: p.variants[0]?.price ? `R ${p.variants[0].price.toLocaleString()}` : "N/A",
            vendor: p.vendor || "",
        };

        if (!p.enabled) {
            grouped.exclude.push(product);
        } else if (p.merchandisingBasket && grouped[p.merchandisingBasket as BasketKey]) {
            grouped[p.merchandisingBasket as BasketKey].push(product);
        }
    });

    return { products: grouped };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "update-basket") {
        const productId = formData.get("productId") as string;
        const basket = formData.get("basket") as string;

        await prisma.product.update({
            where: { id: BigInt(productId), shopId: session.shop },
            data: {
                merchandisingBasket: basket === "exclude" ? null : basket,
                enabled: basket !== "exclude"
            }
        });

        return { ok: true };
    }

    if (intent === "remove-from-basket") {
        const productId = formData.get("productId") as string;

        await prisma.product.update({
            where: { id: BigInt(productId), shopId: session.shop },
            data: {
                merchandisingBasket: null,
                enabled: true
            }
        });

        return { ok: true };
    }

    if (intent === "add-to-basket") {
        let productIds: string[];
        try {
            productIds = JSON.parse(formData.get("productIds") as string);
        } catch {
            return Response.json({ error: "Invalid productIds JSON" }, { status: 400 });
        }
        if (!Array.isArray(productIds)) {
            return Response.json({ error: "productIds must be an array" }, { status: 400 });
        }
        const basket = formData.get("basket") as string;

        await prisma.product.updateMany({
            where: {
                id: { in: productIds.map((id: string) => BigInt(id)) },
                shopId: session.shop
            },
            data: {
                merchandisingBasket: basket === "exclude" ? null : basket,
                enabled: basket !== "exclude"
            }
        });

        return { ok: true };
    }

    return { ok: false };
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function BoostPage() {
    const navigate = useNavigate();
    const { isCompact, paneMode } = usePaneMode();
    const { products: initialProducts } = useLoaderData<typeof loader>();
    const [activeBasket, setActiveBasket] = useState<BasketKey>("rocket");
    const [products, setProducts] = useState<Record<BasketKey, Product[]>>(
        (initialProducts as any) || {
            rocket: [], ignite: [], lift: [],
            sink: [], bury: [], anchor: [],
            exclude: [],
        }
    );
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const fetcher = useFetcher<any>();
    const actionFetcher = useFetcher<any>();
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [productToMove, setProductToMove] = useState<Product | null>(null);

    // Sync state icons updates from other tabs
    useEffect(() => {
        if (actionFetcher.state === "idle" && actionFetcher.data?.ok) {
            // We could re-fetch or just let the optimist state stay if we did optimist updates.
            // But for now, let's just use the loader data by navigating to the same page or similar.
            // Remix will re-run loaders on action completion.
        }
    }, [actionFetcher.state, actionFetcher.data]);

    useEffect(() => {
        setProducts(initialProducts as any);
    }, [initialProducts]);

    const activeConfig = BASKETS.find((b) => b.key === activeBasket)!;
    const activeProducts = products[activeBasket] || [];

    // Fetch products when modal opens or search changes
    useEffect(() => {
        if (isPickerOpen) {
            fetcher.load(`/api/products?q=${encodeURIComponent(searchValue)}&pageSize=50`);
        }
    }, [isPickerOpen, searchValue]);

    const pickerProducts = fetcher.data?.products || [];
    const isLoading = fetcher.state === "loading";

    const { selectedResources, handleSelectionChange } =
        useIndexResourceState(pickerProducts);

    const handleRemoveProduct = useCallback((productId: string) => {
        // Optimistic update
        setProducts((prev) => ({
            ...prev,
            [activeBasket]: prev[activeBasket].filter((p) => p.id !== productId),
        }));

        actionFetcher.submit(buildFormData("remove-from-basket", { productId }), { method: "post" });
    }, [activeBasket, actionFetcher]);

    const handleMoveProduct = (targetBasket: BasketKey) => {
        if (!productToMove) return;

        const productId = productToMove.id;

        // Optimistic update
        setProducts((prev) => {
            const next = { ...prev };
            // Remove from all baskets first to be safe, or just from active
            Object.keys(next).forEach(key => {
                next[key as BasketKey] = next[key as BasketKey].filter(p => p.id !== productId);
            });

            // Add to target basket
            next[targetBasket] = [...next[targetBasket], productToMove].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

            return next;
        });

        actionFetcher.submit(buildFormData("update-basket", { productId, basket: targetBasket }), { method: "post" });

        setIsMoveModalOpen(false);
        setProductToMove(null);
    };

    const handleAddSelected = () => {
        const selectedProducts = pickerProducts.filter((p: any) => selectedResources.includes(p.id));
        const productIds = selectedProducts.map((p: any) => p.id);

        // Optimistic update
        setProducts((prev) => ({
            ...prev,
            [activeBasket]: [
                ...prev[activeBasket],
                ...selectedProducts.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    handle: p.handle || "",
                    imageUrl: p.thumbnailUrl || "",
                    price: p.priceMin ? `R ${p.priceMin.toLocaleString()}` : "N/A",
                    vendor: p.vendor || "",
                }))
            ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        }));

        actionFetcher.submit(buildFormData("add-to-basket", { productIds: JSON.stringify(productIds), basket: activeBasket }), { method: "post" });

        setIsPickerOpen(false);
        // @ts-ignore
        handleSelectionChange('all', false);
    };

    return (
        <ThreePaneLayout
            header={{
                backButton: {
                    label: "Dashboard",
                    onClick: () => navigate("/app"),
                },
                title: "Merchandising Baskets",
                badge: { text: "Pro", tone: "success" },
                actions: (
                    <Button onClick={() => setIsPickerOpen(true)} icon={PlusIcon} variant="primary">Add Products</Button>
                ),
            }}
            leftPaneTitle="Baskets"
            leftPane={
                <MerchandisingSidebar
                    activeBasket={activeBasket}
                    onSelect={setActiveBasket}
                />
            }
            leftPaneBottom={<OnboardingFab variant="sidebar" />}
            rightPaneTitle="Summary"
            rightPane={
                <MerchandisingSummaryPane
                    products={products}
                    onConfigureRules={() => window.open('/app/onboarding', '_blank')}
                />
            }
            contentHeader={
                <BasketHeader
                    label={activeConfig.label}
                    multiplier={activeConfig.multiplier}
                    badgeTone={activeConfig.badgeTone as any}
                    icon={activeConfig.icon}
                    productCount={activeProducts.length}
                />
            }
            leftPaneMode={paneMode}
            rightPaneMode={paneMode}
            leftPaneCollapsed={isCompact}
            rightPaneCollapsed={isCompact}
        >
            <Box padding="600">
                <BlockStack gap="400">
                    <BasketContent
                        activeBasket={activeBasket}
                        activeLabel={activeConfig.label}
                        products={activeProducts}
                        onAddProducts={() => setIsPickerOpen(true)}
                        onMoveProduct={(product) => {
                            setProductToMove(product);
                            setIsMoveModalOpen(true);
                        }}
                        onRemoveProduct={handleRemoveProduct}
                        badgeTone={activeConfig.badgeTone as any}
                    />
                </BlockStack>
            </Box>

            {/* Product Picker Modal */}
            <ProductPickerModal
                open={isPickerOpen}
                onClose={() => {
                    setIsPickerOpen(false);
                    // @ts-ignore - fixing polaris type issue
                    handleSelectionChange('all', false);
                }}
                title={`Add products to ${activeConfig.label}`}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                products={pickerProducts}
                loading={isLoading}
                onAdd={handleAddSelected}
                selectedIds={selectedResources}
                onSelectionChange={handleSelectionChange}
            />

            {/* Move Product Modal */}
            <MerchandisingModal
                open={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                productTitle={productToMove?.title || ""}
                activeBasket={activeBasket}
                onSelect={(basket) => {
                    handleMoveProduct(basket);
                    setIsMoveModalOpen(false);
                }}
            />
        </ThreePaneLayout>
    );
}
