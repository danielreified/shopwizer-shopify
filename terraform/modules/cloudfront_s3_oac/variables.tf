############################################
# Inputs
############################################

variable "name_prefix" {
  type        = string
  description = "Prefix for named resources"
}

variable "s3_bucket_regional_domain_name" {
  type        = string
  description = "S3 bucket regional domain name for the origin (e.g. my-bucket.s3.us-east-1.amazonaws.com)"
}

# ✅ New: provide these instead of referencing aws_s3_bucket.this
variable "s3_bucket_id" {
  type        = string
  description = "S3 bucket ID (name) used for attaching CloudFront OAC policy"
}

variable "s3_bucket_arn" {
  type        = string
  description = "S3 bucket ARN used for CloudFront OAC policy"
}

variable "aliases" {
  type        = list(string)
  description = "Alternate domain names (CNAMEs) for the distribution"
  default     = []
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1"
}

variable "price_class" {
  type        = string
  description = "CloudFront price class"
  default     = "PriceClass_100"
}

variable "enable_spa_fallback" {
  type        = bool
  description = "If true, map 403/404 to /index.html for SPAs"
  default     = false
}

# Optional cache policy (e.g. disable caching for analytics)
variable "cache_policy_id" {
  type        = string
  description = "Optional cache policy ID. If null, defaults to Managed-CachingOptimized."
  default     = null
}

# Optional access logging
variable "logging_bucket_domain_name" {
  type        = string
  description = "S3 bucket REGIONAL domain name for access logs (e.g. logs-bucket.s3.us-east-1.amazonaws.com). If null, logging disabled."
  default     = null
}

variable "logging_include_cookies" {
  type        = bool
  description = "Whether to include cookies in access logs"
  default     = false
}

variable "logging_prefix" {
  type        = string
  description = "Prefix for access logs"
  default     = null
}

variable "default_root_object" {
  type        = string
  default     = "index.html"
  description = "Default root object (e.g., index.html)."
}
