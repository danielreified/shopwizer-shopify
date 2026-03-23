import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index/route.tsx"),

  route("auth/login", "routes/auth.login/route.tsx"),
  route("auth/*", "routes/auth.$.tsx"),

  route("health", "routes/health.tsx"),
  route("webhooks/app/scopes_update", "routes/webhooks.app.scopes_update.tsx"),
  route("webhooks/app/uninstalled", "routes/webhooks.app.uninstalled.tsx"),

  route("api/categories", "routes/api/categories.ts"),
  route("api/products", "routes/api/products.ts"),
  route("api/recs/order", "routes/api/recs.order.ts"),
  route("api/subscribe", "routes/api/subscribe.ts"),
  route("api/tags", "routes/api/tags.ts"),
  route("api/unsubscribe", "routes/api/unsubscribe.ts"),

  route("proxy/integrations/:shop", "routes/proxy/integrations.$shop.ts"),
  route("proxy/styles.css", "routes/proxy/styles[.]css.ts"),
  route("proxy/recs/:shop/arrivals/:productId", "routes/proxy/recs.$shop/arrivals.$productId.ts"),
  route("proxy/recs/:shop/bundles/:productId", "routes/proxy/recs.$shop/bundles.$productId.ts"),
  route("proxy/recs/:shop/cart", "routes/proxy/recs.$shop/cart.ts"),
  route("proxy/recs/:shop/order", "routes/proxy/recs.$shop/order.ts"),
  route("proxy/recs/:shop/sellers/:productId", "routes/proxy/recs.$shop/sellers.$productId.ts"),
  route("proxy/recs/:shop/similar/:productId", "routes/proxy/recs.$shop/similar.$productId.ts"),
  route("proxy/recs/:shop/trending/:productId", "routes/proxy/recs.$shop/trending.$productId.ts"),

  route("app", "routes/app/route.tsx", [
    index("routes/app._index/route.tsx"),
    route("analytics/:metric", "routes/app.analytics.$metric/route.tsx"),
    route("editor", "routes/app.editor/route.tsx"),
    route("integrations", "routes/app.integrations._index/route.tsx"),
    route("merchandising", "routes/app.merchandising/route.tsx"),
    route("onboarding", "routes/app.onboarding._index/route.tsx"),
    route("plans", "routes/app.plans._index/route.tsx"),
    route("products", "routes/app.products._index/route.tsx"),
    route("products/:id", "routes/app.products.$id/route.tsx"),
    route("settings", "routes/app.settings/route.tsx", [
      index("routes/app.settings/_index/route.tsx"),
      route("general", "routes/app.settings/general/route.tsx"),
      route("recommendation", "routes/app.settings/recommendation/route.tsx"),
      route("exclusion", "routes/app.settings/exclusion/route.tsx"),
    ]),
  ]),
];
