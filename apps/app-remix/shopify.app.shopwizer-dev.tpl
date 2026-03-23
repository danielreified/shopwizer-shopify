# Learn more about configuring your app at https://shopify.dev/docs/apps/tools/cli/configuration

client_id = "7f19d661856a21beca6cdd000c2c1435"
name = "dev-recommend"
application_url = "https://app.shopwizer.co.za"
embedded = true

[build]
automatically_update_urls_on_dev = true

[webhooks]
api_version = "2026-01"

  [[webhooks.subscriptions]]
  topics = [
  "checkouts/update",
  "products/create",
  "products/update",
  "products/delete",
  "orders/create",
  "checkouts/create"
]
  uri = "arn:aws:events:us-east-1::event-source/aws.partner/shopify.com/291043016705/dev-shopwise-recommender"

  [[webhooks.subscriptions]]
  topics = [ "app/uninstalled" ]
  uri = "https://app.shopwizer.co.za/webhooks/app/uninstalled"

  [[webhooks.subscriptions]]
  topics = [ "app/scopes_update" ]
  uri = "https://app.shopwizer.co.za/webhooks/app/scopes_update"

[access_scopes]
scopes = "read_customer_events,read_checkouts,read_metaobjects,read_orders,write_pixels,read_products,write_products,read_themes"
optional_scopes = [ ]
use_legacy_install_flow = false

[auth]
redirect_urls = [
  "https://app.shopwizer.co.za/auth/callback",
  "https://app.shopwizer.co.za/auth/shopify/callback",
  "https://app.shopwizer.co.za/api/auth/callback"
]

[app_proxy]
url = "https://shopify.shopwizer.co.za/proxy"
subpath = "sw"
prefix = "apps"
