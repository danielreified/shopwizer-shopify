import {
  extension,
  BlockStack,
  InlineLayout,
  Image,
  Text,
  Button,
  Heading,
  Divider,
  SkeletonImage,
  SkeletonText,
} from "@shopify/ui-extensions/checkout";

// Checkout Upsells Extension
// Shows product recommendations during checkout to increase AOV
export default extension("purchase.checkout.block.render", (root, api) => {
  const { lines, shop, settings, applyCartLinesChange, analytics } = api;

  // Settings with defaults
  const headingTitle = settings.heading_title?.current || "Complete your order";
  const productsToShow = Math.min(Math.max(settings.products_to_show?.current || 3, 2), 4);
  const showAddToCart = settings.show_add_to_cart?.current !== false;

  // Create main container
  const container = root.createComponent(BlockStack, { spacing: "base" });
  root.appendChild(container);

  // Add heading
  const heading = root.createComponent(Heading, { level: 2 }, headingTitle);
  container.appendChild(heading);

  // Add divider
  const divider = root.createComponent(Divider);
  container.appendChild(divider);

  // Create loading skeleton
  const loadingContainer = root.createComponent(BlockStack, { spacing: "base" });
  container.appendChild(loadingContainer);

  for (let i = 0; i < productsToShow; i++) {
    const skeletonRow = root.createComponent(
      InlineLayout,
      { 
        spacing: "base", 
        columns: ["auto", "fill", "auto"], 
        blockAlignment: "center"
      },
      [
        root.createComponent(SkeletonImage, { aspectRatio: 1 }),
        root.createComponent(SkeletonText, { size: "base" }),
        root.createComponent(SkeletonText, { size: "base" }),
      ]
    );
    loadingContainer.appendChild(skeletonRow);
  }

  // Fetch recommendations
  fetchRecommendations(root, api, container, loadingContainer, productsToShow, showAddToCart);
});

async function fetchRecommendations(root, api, container, loadingContainer, productsToShow, showAddToCart) {
  const { lines, shop, analytics, applyCartLinesChange } = api;

  try {
    // Extract product IDs from cart lines
    const productIds = lines.current
      .map((line) => {
        const match = line.merchandise?.product?.id?.match(/\/(\d+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (productIds.length === 0) {
      container.removeChild(loadingContainer);
      return;
    }

    // Get unique product IDs
    const uniqueIds = [...new Set(productIds)];

    // Call our recommendations API (cart-based recs)
    const shopDomain = shop.myshopifyDomain;
    const url = `https://${shopDomain}/apps/sw/recs/${shopDomain}/cart?ids=${uniqueIds.join(",")}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const products = (data.results || []).slice(0, productsToShow);

    // Remove loading skeleton
    container.removeChild(loadingContainer);

    if (products.length === 0) {
      return;
    }

    // Track view event
    if (data.slate_id && analytics?.publish) {
      analytics.publish("sw_reco_view", {
        rail: "checkout_upsells",
        slate_id: data.slate_id,
        count: products.length,
      });
    }

    // Create products container
    const productsContainer = root.createComponent(BlockStack, { spacing: "base" });
    container.appendChild(productsContainer);

    // Render each product
    for (const product of products) {
      const productUrl = `https://${shopDomain}/products/${product.handle}`;
      const formattedPrice = formatMoney(product.price);

      const productRow = root.createComponent(
        InlineLayout,
        { 
          spacing: "base", 
          columns: ["auto", "fill", "auto"], 
          blockAlignment: "center"
        },
        [
          // Product image
          product.imageUrl
            ? root.createComponent(Image, {
                source: `${product.imageUrl}&width=128`,
                accessibilityDescription: product.title,
                aspectRatio: 1,
                fit: "cover",
                cornerRadius: "base",
              })
            : root.createComponent(SkeletonImage, { aspectRatio: 1 }),
          
          // Product info
          root.createComponent(
            BlockStack,
            { spacing: "extraTight" },
            [
              root.createComponent(Text, { emphasis: "bold", size: "base" }, product.title),
              root.createComponent(Text, { size: "base" }, formattedPrice),
            ]
          ),
          
          // Add to cart button
          showAddToCart && product.variant_id
            ? root.createComponent(
                Button,
                {
                  kind: "secondary",
                  onPress: async () => {
                    try {
                      await applyCartLinesChange({
                        type: "addCartLine",
                        merchandiseId: `gid://shopify/ProductVariant/${product.variant_id}`,
                        quantity: 1,
                      });
                      
                      // Track add to cart
                      if (data.slate_id && analytics?.publish) {
                        analytics.publish("sw_reco_click", {
                          rail: "checkout_upsells",
                          slate_id: data.slate_id,
                          product_id: product.id,
                          action: "add_to_cart",
                        });
                      }
                    } catch (err) {
                      console.error("[Checkout Upsells] Add to cart error:", err);
                    }
                  },
                },
                "Add"
              )
            : root.createComponent(Text, { size: "small" }, ""),
        ]
      );
      productsContainer.appendChild(productRow);
    }
  } catch (err) {
    console.error("[Checkout Upsells] Error:", err);
    container.removeChild(loadingContainer);
  }
}

function formatMoney(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
