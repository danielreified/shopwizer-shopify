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
} from "@shopify/ui-extensions/customer-account";

// Order Status Page Extension
export default extension("customer-account.order-status.block.render", (root, api) => {
  const { shop, settings } = api;
  
  // Debug: Log entire API object keys
  console.log("[Order Status Recs] API keys:", Object.keys(api));
  console.log("[Order Status Recs] API:", JSON.stringify(api, (key, value) => {
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
    const orderStatus = api.orderStatus;
    const lines = api.lines;
    
    console.log("[Order Status Recs] order:", order);
    console.log("[Order Status Recs] orderStatus:", orderStatus);
    console.log("[Order Status Recs] lines:", lines);
    
    // Try to get order data from various sources
    let lineItems = [];
    
    // Method 1: api.order.lineItems
    if (order?.lineItems) {
      lineItems = order.lineItems;
      console.log("[Order Status Recs] Found lineItems in order.lineItems");
    }
    // Method 2: api.orderStatus.current.order.lineItems
    else if (orderStatus?.current?.order?.lineItems) {
      lineItems = orderStatus.current.order.lineItems;
      console.log("[Order Status Recs] Found lineItems in orderStatus");
    }
    // Method 3: api.lines.current
    else if (lines?.current) {
      lineItems = lines.current;
      console.log("[Order Status Recs] Found lineItems in lines.current");
    }
    
    console.log("[Order Status Recs] lineItems count:", lineItems?.length);
    console.log("[Order Status Recs] lineItems:", JSON.stringify(lineItems));
    
    if (!lineItems || lineItems.length === 0) {
      console.log("[Order Status Recs] No line items found - removing skeleton");
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
        
        console.log("[Order Status Recs] Item:", JSON.stringify(item));
        console.log("[Order Status Recs] Extracted productId:", productId);
        
        if (!productId) {
          return null;
        }
        
        // Extract numeric ID from GID format if needed
        const match = String(productId).match(/(\d+)$/);
        return match ? match[1] : String(productId);
      })
      .filter(Boolean);
    
    console.log("[Order Status Recs] Final product IDs:", productIds);
    
    if (productIds.length === 0) {
      console.log("[Order Status Recs] No product IDs extracted");
      container.removeChild(loadingContainer);
      return;
    }
    
    // Get unique IDs
    const uniqueIds = [...new Set(productIds)];
    
    // Call our recommendations API
    const shopDomain = shop.myshopifyDomain;
    
    // Detect dev mode by checking if extension version starts with "dev-"
    const isDevMode = api.extension?.version?.startsWith("dev-");
    
    // Production API URL
    const prodUrl = `https://app.shopwizer.co.za/api/recs/order?shop=${shopDomain}&ids=${uniqueIds.join(",")}`;
    
    // For dev mode: checkout extensions can't use Shopify proxy, so we need direct URL
    // TODO: In production, use prodUrl. For local dev testing, temporarily hardcode your tunnel URL.
    const url = prodUrl;
    
    console.log("[Order Status Recs] isDevMode:", isDevMode);
    console.log("[Order Status Recs] Fetching:", url);
    
    const response = await fetch(url);
    console.log("[Order Status Recs] Response status:", response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.error("[Order Status Recs] API error:", response.status, text);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[Order Status Recs] API response:", JSON.stringify(data));
    
    const products = (data.results || []).slice(0, productsToShow);
    
    // Remove loading skeleton
    container.removeChild(loadingContainer);
    
    if (products.length === 0) {
      console.log("[Order Status Recs] No products returned");
      return;
    }
    
    // Track view event
    if (data.slate_id && analytics?.publish) {
      analytics.publish("sw_reco_view", {
        rail: "order_status_recs",
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
    
    console.log("[Order Status Recs] Rendered", products.length, "products");
  } catch (err) {
    console.error("[Order Status Recs] Error:", err);
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
