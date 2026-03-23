locals {
  name_prefix                 = "dev-ue1-shopwise"
  shopify_partner_source_name = "aws.partner/shopify.com/291043016705/dev-shopwise-recommender"
  shopify_shared_secret       = var.shopify_secret
  env                         = "dev"
  root_domain                 = "aluu.io"
  aws_region                  = "us-east-1"
  subdomains                  = ["app"]
}