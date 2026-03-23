variable "name_prefix" {
  type        = string
  description = "Short system prefix (org/app/env)."
}

variable "origin_domain_name" { type = string }
variable "origin_http_port" {
  type    = number
  default = 80
}
variable "origin_https_port" {
  type    = number
  default = 443
}
variable "origin_protocol_policy" {
  type    = string
  default = "https-only"
}
variable "origin_ssl_protocols" {
  type    = list(string)
  default = ["TLSv1.2"]
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM cert in us-east-1."
}
variable "aliases" {
  type    = list(string)
  default = []
}

variable "path_pattern" {
  type        = string
  default     = null
  description = "Optional ordered behavior path (e.g., '/recommend*')."
}

variable "cache_policy_id" {
  type    = string
  default = null
}
variable "cache_ttl_seconds" {
  type    = number
  default = 60
}

variable "cache_behaviors" {
  description = "List of ordered cache behaviors with path patterns and TTLs"
  type = list(object({
    path_pattern    = string
    ttl_seconds     = number
    allowed_methods = optional(list(string), ["GET", "HEAD"])
    cached_methods  = optional(list(string), ["GET", "HEAD"])
    cache_policy_id = optional(string, null)
    enable_function = optional(bool, true)
  }))
  default = []
}

variable "viewer_request_function_arn" {
  type        = string
  default     = null
  description = "CloudFront Function ARN for viewer-request (e.g., HMAC)."
}

variable "logging_bucket_domain_name" {
  type        = string
  default     = null
  description = "e.g., 'my-logs.s3.amazonaws.com'."
}
variable "logging_include_cookies" {
  type    = bool
  default = false
}
variable "logging_prefix" {
  type    = string
  default = ""
}

variable "web_acl_arn" {
  type    = string
  default = null
}

variable "geo_restriction_type" {
  type    = string
  default = "none"
}

variable "geo_restriction_locations" {
  type    = list(string)
  default = []
}

variable "price_class" {
  type    = string
  default = "PriceClass_All"
}

variable "viewer_min_tls" {
  type    = string
  default = "TLSv1.2_2019"
}

variable "comment" {
  type    = string
  default = "CloudFront distribution"
}

variable "tags" {
  type    = map(string)
  default = {}
}
