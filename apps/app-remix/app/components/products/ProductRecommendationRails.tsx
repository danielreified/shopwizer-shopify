// app/components/products/ProductRecommendationRails.tsx

import { BlockStack } from "@shopify/polaris";
import { CollapsibleCard } from "@repo/ui/components/CollapsibleCard";
import { ProductsGrid } from "@repo/ui/components/ProductsGrid";
import { TrendingUp, Copy, Star, Zap } from "lucide-react";
import { BASKETS, type BasketKey } from "../../lib/merchandising";

interface ProductRecommendationRailsProps {
    similarProducts: any[];
    sellersProducts: any[];
    trendingProducts: any[];
    arrivalsProducts: any[];
    onProductClick: (id: string | number) => void;
    onMerchandise?: (product: { id: string; title: string, basket: BasketKey }) => void;
}

export function ProductRecommendationRails({
    similarProducts,
    sellersProducts,
    trendingProducts,
    arrivalsProducts,
    onProductClick,
    onMerchandise,
}: ProductRecommendationRailsProps) {

    const mapProducts = (products: any[]) => {
        return products.map(p => {
            const currentBasket = !p.enabled
                ? "exclude"
                : p.merchandisingBasket || "none";
            const config = BASKETS.find((b: any) => b.key === currentBasket) || BASKETS[0];
            return {
                ...p,
                badge: {
                    label: config.label,
                    tone: config.badgeTone,
                    onClick: () => onMerchandise?.({
                        id: p.id,
                        title: p.title,
                        basket: currentBasket as BasketKey
                    })
                }
            };
        });
    };

    return (
        <BlockStack gap="400">
            <CollapsibleCard
                id="similar"
                title="Similar Products"
                icon={Copy}
                description="Products visually or semantically similar to this item."
                storageKey="recs-viz-similar"
                iconGradient={{ from: "#6366f1", to: "#8b5cf6" }}
            >
                <ProductsGrid
                    products={mapProducts(similarProducts)}
                    columns={5}
                    currency="R"
                    onProductClick={(p) => onProductClick(p.id)}
                />
            </CollapsibleCard>


            <CollapsibleCard
                id="sellers"
                title="Best Sellers"
                icon={Star}
                description="Top performing products based on sales data."
                storageKey="recs-viz-sellers"
                iconGradient={{ from: "#f59e0b", to: "#f97316" }}
            >
                <ProductsGrid
                    products={mapProducts(sellersProducts)}
                    columns={5}
                    currency="R"
                    onProductClick={(p) => onProductClick(p.id)}
                />
            </CollapsibleCard>

            <CollapsibleCard
                id="trending"
                title="Trending"
                icon={TrendingUp}
                description="Items currently trending based on engagement data."
                storageKey="recs-viz-trending"
                iconGradient={{ from: "#10b981", to: "#14b8a6" }}
            >
                <ProductsGrid
                    products={mapProducts(trendingProducts)}
                    columns={5}
                    currency="R"
                    onProductClick={(p) => onProductClick(p.id)}
                />
            </CollapsibleCard>

            <CollapsibleCard
                id="new-arrivals"
                title="New Arrivals"
                icon={Zap}
                description="Newest products relevant to this item's category."
                storageKey="recs-viz-arrivals"
                iconGradient={{ from: "#3b82f6", to: "#06b6d4" }}
            >
                <ProductsGrid
                    products={mapProducts(arrivalsProducts)}
                    columns={5}
                    currency="R"
                    onProductClick={(p) => onProductClick(p.id)}
                />
            </CollapsibleCard>
        </BlockStack>
    );
}
