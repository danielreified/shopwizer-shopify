variable "root_domain" {
  description = "Base domain, e.g. example.com"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for root_domain"
  type        = string
}

# --- ALB aliases ---
variable "create_alb_records" {
  description = "Create ALIAS records pointing to an ALB"
  type        = bool
  default     = false
}

variable "alb_dns_name" {
  description = "ALB DNS name (e.g. my-alb-123.us-east-1.elb.amazonaws.com)"
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "ALB hosted zone ID (from the ALB module output)"
  type        = string
  default     = ""
}

variable "alb_subdomains" {
  description = "Subdomains to alias to the ALB, e.g. [\"api\",\"app\"]"
  type        = list(string)
  default     = []
}

variable "alb_point_apex" {
  description = "If true, apex (root) points to the ALB"
  type        = bool
  default     = false
}

# --- CloudFront aliases ---
variable "create_cf_records" {
  description = "Create ALIAS records pointing to a CloudFront distribution"
  type        = bool
  default     = false
}

variable "cf_domain_name" {
  description = "CloudFront domain name (e.g. d123abcd.cloudfront.net)"
  type        = string
  default     = ""
}

variable "cf_zone_id" {
  description = "CloudFront hosted zone ID (output from your CF module)"
  type        = string
  default     = ""
}

variable "cf_subdomains" {
  description = "Subdomains to alias to CloudFront, e.g. [\"www\",\"site\"]"
  type        = list(string)
  default     = []
}

variable "cf_point_apex" {
  description = "If true, apex (root) points to CloudFront"
  type        = bool
  default     = false
}
