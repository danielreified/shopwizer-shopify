import { BlockStack, Card } from "@shopify/polaris";
import { Sparkles } from "lucide-react";
import { ProductRecommendationRails } from "../../../components/products";
import { SectionHeader } from "@repo/ui";

interface RecommendationsSectionProps {
  similarProducts: any[];
  sellersProducts: any[];
  trendingProducts: any[];
  arrivalsProducts: any[];
  onProductClick: (id: string | number) => void;
  onMerchandise: (target: any) => void;
}

export function RecommendationsSection({
  similarProducts,
  sellersProducts,
  trendingProducts,
  arrivalsProducts,
  onProductClick,
  onMerchandise,
}: RecommendationsSectionProps) {
  return (
    <BlockStack gap="500" id="recommendations-section">
      {/* Section header - matching bundles style */}
      <SectionHeader
        title="Recommendations"
        description="AI-powered product recommendations for this item"
        icon={Sparkles}
        iconGradient={{ from: "#10b981", to: "#14b8a6" }}
      />

      {/* Recommendation rails */}
      <Card>
        <ProductRecommendationRails
          similarProducts={similarProducts}
          sellersProducts={sellersProducts}
          trendingProducts={trendingProducts}
          arrivalsProducts={arrivalsProducts}
          onProductClick={onProductClick}
          onMerchandise={onMerchandise}
        />
      </Card>
    </BlockStack>
  );
}
