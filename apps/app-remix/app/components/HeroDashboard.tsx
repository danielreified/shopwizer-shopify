import { HeroCard } from "@repo/ui/components/HeroCard";
import { SimpleCard } from "@repo/ui/components/SimpleCard";
import { ValueCard } from "@repo/ui/components/ValueCard";
import { useNavigate } from "react-router";

// -----------------------------------------------
// 🔶 Inline-typed Hero Component
// -----------------------------------------------
export default function Hero({
  attributedRevenue,
}: {
  attributedRevenue: number;
}) {
  const navigate = useNavigate();

  return (
    <div style={{ width: '100%' }}>
      <HeroCard
        imageUrl="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop"
        imageHeight={220}
        leftSlot={
          <SimpleCard
            title="Learn how to use Checkout Links"
            description="Learn how to use Checkout Links to its fullest potential with our documentation"
            href="https://example.com/docs"
          />
        }
        overlay={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ValueCard
              title="Total Attributed Revenue"
              unit="ZAR"
              value={attributedRevenue}
            />
          </div>
        }
      />
    </div>
  );
}
