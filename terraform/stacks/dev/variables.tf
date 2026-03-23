variable "shopify_secret" {
  description = "Shopify app shared secret"
  type        = string
  sensitive   = true
}

variable "secrets_arn" {
  description = "ARN of the AWS Secrets Manager secret"
  type        = string
}

variable "logtail_source_token" {
  description = "BetterStack Logtail source token"
  type        = string
  sensitive   = true
}
