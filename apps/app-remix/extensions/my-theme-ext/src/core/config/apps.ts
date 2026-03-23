// src/core/config/apps.ts

export interface AppConfig {
  wishlist: {
    enabled: boolean;
    app: "swym" | "growave" | "wishlist-king" | "hulk" | "wishlist-hero" | null;
  };
  reviews: {
    enabled: boolean;
    app:
      | "judge-me"
      | "okendo"
      | "yotpo"
      | "stamped"
      | "growave"
      | "loox"
      | null;
  };
}

// Hardcoded for now - later this function will call your API
export async function fetchAppConfig(): Promise<AppConfig> {
  return {
    wishlist: {
      enabled: true,
      app: "growave",
    },
    reviews: {
      enabled: true,
      app: "growave",
    },
  };
}
