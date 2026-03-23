export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../../shopify.server";
import { listProductsTable } from "../../services/products.service.server";
import {
  Footer as FooterUI,
  ThreePaneLayout as ThreePaneLayoutUI,
  Table as TableUI,
} from "@repo/ui";

import { useState } from "react";
import {
  Badge as PolarisBadge,
  Text as PolarisText,
  Button as PolarisButton,
  InlineStack as PolarisInlineStack,
  BlockStack as PolarisBlockStack,
} from "@shopify/polaris";
import { useAppStore } from "../../store/app-store";
import { ProductDetailsPane, ProductsEmptyPane } from "./components";
import { usePaneMode } from "../../hooks/use-pane-mode";

const Footer = FooterUI as any;
const ThreePaneLayout = ThreePaneLayoutUI as any;
const Table = TableUI as any;

const Badge = PolarisBadge as any;
const Text = PolarisText as any;
const Button = PolarisButton as any;
const InlineStack = PolarisInlineStack as any;
const BlockStack = PolarisBlockStack as any;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Math.min(10000, parseInt(url.searchParams.get("page") || "1") || 1));
  const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "20") || 20));
  const q = url.searchParams.get("q") || "";

  const { rows, total } = await listProductsTable({
    shopId: session.shop,
    q,
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  return {
    products: rows,
    total,
    page,
    pageSize,
    q,
  };
};

export default function Products() {
  const navigate = useNavigate();
  const data = useLoaderData<typeof loader>() as any;
  const { products, total, page, pageSize, q } = data;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { isCompact, paneMode } = usePaneMode();

  const sync = useAppStore((s) => s.sync);
  const isSyncComplete = useAppStore((s) => s.isSyncComplete());

  const selectedProduct = (products || []).find((p: any) => p.id === selectedProductId);

  return (
    <ThreePaneLayout
      leftPaneWidth={280}
      rightPaneWidth={320}
      header={{ title: "Products" }}
      hideLeftPane={true}
      hideRightPane={false}
      rightPaneTitle={selectedProduct ? "Product Content" : "Quick Actions"}
      rightPane={
        selectedProduct ? (
          <ProductDetailsPane
            product={selectedProduct}
            onOpenProduct={(id) => navigate(`/app/products/${id}`)}
          />
        ) : (
          <ProductsEmptyPane />
        )
      }
      rightPaneBottom={null}
      rightPaneMode={paneMode}
      rightPaneCollapsed={isCompact}
    >
      <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        <BlockStack gap="600">
          <Table
            products={products}
            page={page}
            total={total}
            pageSize={pageSize}
            q={q}
            selectedId={selectedProductId || undefined}
            onRowClick={(id: string) => setSelectedProductId(String(id))}
          />

          <Footer
            text="Learn more about"
            linkLabel="fulfilling orders"
            linkUrl="https://help.shopify.com/manual/orders/fulfill-orders"
          />
        </BlockStack>
      </div>
    </ThreePaneLayout>
  );
}
