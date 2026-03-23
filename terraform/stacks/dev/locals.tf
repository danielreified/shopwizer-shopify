locals {
  aws_region  = "us-east-1"
  name_prefix = "dev-ue1-shopwizer"
  root_domain = "shopwizer.co.za"
  env         = "dev"
  subdomains  = ["app"]

  shopify_partner_source_name  = "aws.partner/shopify.com/291043016705/dev-shopwise-recommender"
  shopify_app_url              = "https://app.${local.root_domain}"
  shopify_partner_event_source = "arn:aws:events:us-east-1::event-source/aws.partner/shopify.com/291043016705/dev-shopwise-recommender"
  shopify_scopes               = "read_products,read_checkouts,write_products,read_orders,read_metaobjects,write_pixels,read_customer_events,read_themes"
  shopify_secret               = var.shopify_secret

  db_credentials_secret_name = "${local.name_prefix}/app/db_credentials"

  secrets_arn = var.secrets_arn

  # Logging config (BetterStack - used by CloudWatch forwarder Lambda)
  logtail_source_token = var.logtail_source_token
}
