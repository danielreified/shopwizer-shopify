import {
  extension,
  BlockStack,
  InlineLayout,
  Image,
  Text,
  Link,
  Heading,
  Divider,
  SkeletonImage,
  SkeletonText,
} from "@shopify/ui-extensions/checkout";

// Thank You Page Extension
export default extension("purchase.thank-you.block.render", (root, api) => {
  const { shop, settings } = api;
  
  // Debug: Log entire API object keys
  console.log("[Thank You Recs] API keys:", Object.keys(api));
  console.log("[Thank You Recs] API:", JSON.stringify(api, (key, value) => {
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'object' && value !== null) {
      if (value.current !== undefined) return { current: value.current };
    }
    return value;
  }, 2));
  
  // Settings with defaults
  const headingTitle = settings.heading_title?.current || "You might also like";
  const productsToShow = Math.min(Math.max(settings.products_to_show?.current || 4, 2), 6);
  
  // Create container
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
      { spacing: "base", columns: ["auto", "fill", "auto"], blockAlignment: "center" },
      [
        root.createComponent(SkeletonImage, { aspectRatio: 1 }),
        root.createComponent(SkeletonText, { size: "base" }),
        root.createComponent(SkeletonText, { size: "base" }),
      ]
    );
    loadingContainer.appendChild(skeletonRow);
  }
  
  // Fetch recommendations
  fetchRecommendations(root, api, container, loadingContainer, headingTitle, productsToShow);
});

async function fetchRecommendations(root, api, container, loadingContainer, headingTitle, productsToShow) {
  const { shop, analytics } = api;
  
  try {
    // Try different ways to access order data
    const order = api.order;
    const orderConfirmation = api.orderConfirmation;
    const lines = api.lines;
    
    console.log("[Thank You Recs] order:", order);
    console.log("[Thank You Recs] orderConfirmation:", orderConfirmation);
    console.log("[Thank You Recs] lines:", lines);
    
    // Try to get order data from various sources
    let lineItems = [];
    
    // Method 1: api.order.lineItems
    if (order?.lineItems) {
      lineItems = order.lineItems;
      console.log("[Thank You Recs] Found lineItems in order.lineItems");
    }
    // Method 2: api.orderConfirmation.current.order.lineItems
    else if (orderConfirmation?.current?.order?.lineItems) {
      lineItems = orderConfirmation.current.order.lineItems;
      console.log("[Thank You Recs] Found lineItems in orderConfirmation");
    }
    // Method 3: api.lines.current
    else if (lines?.current) {
      lineItems = lines.current;
      console.log("[Thank You Recs] Found lineItems in lines.current");
    }
    
    console.log("[Thank You Recs] lineItems count:", lineItems?.length);
    console.log("[Thank You Recs] lineItems:", JSON.stringify(lineItems));
    
    if (!lineItems || lineItems.length === 0) {
      console.log("[Thank You Recs] No line items found - removing skeleton");
      container.removeChild(loadingContainer);
      return;
    }
    
    // Extract product IDs - try multiple formats
    const productIds = lineItems
      .map((item) => {
        // Try various ID formats
        const productId = item.merchandise?.product?.id || 
                          item.product?.id ||
                          item.productId ||
                          item.product_id;
        
        console.log("[Thank You Recs] Item:", JSON.stringify(item));
        console.log("[Thank You Recs] Extracted productId:", productId);
        
        if (!productId) {
          return null;
        }
        
        // Extract numeric ID from GID format if needed
        const match = String(productId).match(/(\d+)$/);
        return match ? match[1] : String(productId);
      })
      .filter(Boolean);
    
    console.log("[Thank You Recs] Final product IDs:", productIds);
    
    if (productIds.length === 0) {
      console.log("[Thank You Recs] No product IDs extracted");
      container.removeChild(loadingContainer);
      return;
    }
    
    // Get unique IDs
    const uniqueIds = [...new Set(productIds)];
    
    // Call our recommendations API
    const shopDomain = shop.myshopifyDomain;
    
    // Detect dev mode by checking if extension version starts with "dev-"
    const isDevMode = api.extension?.version?.startsWith("dev-");
    
    // In dev mode, use Shopify proxy (which routes through Cloudflare tunnel)
    // In production, use direct API URL
    const url = isDevMode
      ? `https://${shopDomain}/apps/sw/recs/${shopDomain}/order?ids=${uniqueIds.join(",")}`
      : `https://app.shopwizer.co.za/api/recs/order?shop=${shopDomain}&ids=${uniqueIds.join(",")}`;
    
    console.log("[Thank You Recs] isDevMode:", isDevMode);
    console.log("[Thank You Recs] Fetching:", url);
    
    const response = await fetch(url);
    console.log("[Thank You Recs] Response status:", response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.error("[Thank You Recs] API error:", response.status, text);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[Thank You Recs] API response:", JSON.stringify(data));
    
    const products = (data.results || []).slice(0, productsToShow);
    
    // Remove loading skeleton
    container.removeChild(loadingContainer);
    
    if (products.length === 0) {
      console.log("[Thank You Recs] No products returned");
      return;
    }
    
    // Track view event
    if (data.slate_id && analytics?.publish) {
      analytics.publish("sw_reco_view", {
        rail: "thank_you_recs",
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
        Link,
        { to: productUrl },
        root.createComponent(
          InlineLayout,
          { spacing: "base", columns: ["auto", "fill", "auto"], blockAlignment: "center" },
          [
            product.imageUrl
              ? root.createComponent(Image, {
                  source: product.imageUrl,
                  accessibilityDescription: product.title,
                  aspectRatio: 1,
                  fit: "cover",
                  cornerRadius: "base",
                })
              : root.createComponent(SkeletonImage, { aspectRatio: 1 }),
            root.createComponent(
              BlockStack,
              { spacing: "extraTight" },
              root.createComponent(Text, { emphasis: "bold", size: "base" }, product.title)
            ),
            root.createComponent(Text, { emphasis: "bold", size: "base" }, formattedPrice),
          ]
        )
      );
      productsContainer.appendChild(productRow);
    }
    
    console.log("[Thank You Recs] Rendered", products.length, "products");
  } catch (err) {
    console.error("[Thank You Recs] Error:", err);
    try {
      container.removeChild(loadingContainer);
    } catch (e) {
      // Already removed
    }
  }
}

function formatMoney(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
