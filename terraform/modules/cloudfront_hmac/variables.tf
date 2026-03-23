###########
# Naming
###########
variable "name_prefix" {
  description = "Prefix used if 'name' is not provided."
  type        = string
  default     = null
}

variable "name" {
  description = "Exact CloudFront Function name (overrides name_prefix)."
  type        = string
  default     = null
}

###########
# Secret - Option 1: Direct value (will be in TF state!)
###########
variable "shopify_shared_secret" {
  description = "Shopify shared secret used for HMAC verification. Use secrets_arn instead to keep out of state."
  type        = string
  default     = null
  sensitive   = true
}

###########
# Secret - Option 2: Secrets Manager ARN (recommended - keeps secret out of state)
###########
variable "secrets_arn" {
  description = "ARN of Secrets Manager secret containing the shared secret as JSON."
  type        = string
  default     = null
}

variable "secrets_key" {
  description = "Key within the Secrets Manager JSON to use for the shared secret."
  type        = string
  default     = "SHOPIFY_API_SECRET"
}

###########
# Publish & meta
###########
variable "publish" {
  description = "Publish the function to LIVE (required to attach to a distribution)."
  type        = bool
  default     = true
}

variable "comment" {
  description = "Optional description for the function."
  type        = string
  default     = "CloudFront Function: Shopify HMAC verification"
}
