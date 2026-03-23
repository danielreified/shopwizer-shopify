# Learn more about configuring your app at https://shopify.dev/docs/apps/tools/cli/configuration

client_id = "9555e53a7fd2d4bb573854c8eceb155e"
name = "shopwizer"
application_url = "https://app.shopwizer.ai"
embedded = true

[build]
automatically_update_urls_on_dev = true

[webhooks]
api_version = "2026-01"

  [[webhooks.subscriptions]]
  topics = [ "app/scopes_update" ]
  uri = "/webhooks/app/scopes_update"

  [[webhooks.subscriptions]]
  topics = [
  "products/delete",
  "checkouts/update",
  "products/update",
  "checkouts/create",
  "orders/create",
  "products/create"
]
  uri = "arn:aws:events:us-east-1::event-source/aws.partner/shopify.com/291043016705/dev-shopwise-recommender"

  [[webhooks.subscriptions]]
  topics = [ "app/uninstalled" ]
  uri = "/webhooks/app/uninstalled"

[access_scopes]
# Learn more at https://shopify.dev/docs/apps/tools/cli/configuration#access_scopes
scopes = "read_checkouts,read_customer_events,read_metaobjects,read_orders,read_products,read_themes,write_pixels,write_products"

[auth]
redirect_urls = [
  "https://app.shopwizer.ai/auth/callback",
  "https://app.shopwizer.ai/auth/shopify/callback",
  "https://app.shopwizer.ai/api/auth/callback"
]

[app_proxy]
url = "https://app.shopwizer.ai/proxy"
subpath = "sw"
prefix = "apps"
