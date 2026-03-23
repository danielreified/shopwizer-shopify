// src/product/index.ts

export function getShopifyProductMeta(settings: any) {
    try {
      if (settings.productId || settings.productHandle) {
        return {
          id: settings.productId || null,
          handle: settings.productHandle || null,
        };
      }
  
      if ((window as any).meta?.product?.id) return (window as any).meta.product;
  
      if ((window as any).ShopifyAnalytics?.meta?.product)
        return (window as any).ShopifyAnalytics.meta.product;
  
      const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
      if (match) return { id: null, handle: match[1] };
  
      return null;
    } catch {
      return null;
    }
  }
  