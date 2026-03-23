variable "name_prefix" {
  type        = string
  description = "Short environment/app prefix (e.g., chhat-dev). Used for the VPN leaf FQDN."
}

variable "root_domain" {
  type        = string
  description = "Public hosted zone domain managed in Route 53 (e.g., example.com)."
}

variable "validation_record_ttl" {
  type        = number
  default     = 60
  description = "TTL for ACM validation CNAME records."
}

variable "create_vpn_cert" {
  type        = bool
  default     = true
  description = "Whether to issue/validate vpn."
}

variable "alb_dns_name" {
  type        = string
  default     = ""
  description = "ALB DNS name (e.g., app-123456.us-east-1.elb.amazonaws.com). Leave empty to skip ALIAS records."
}

variable "alb_zone_id" {
  type        = string
  default     = ""
  description = "ALB hosted zone ID. Leave empty to skip ALIAS records."
}

variable "subdomain_aliases" {
  type        = list(string)
  default     = []
  description = "Subdomains (without root) to ALIAS to the ALB, e.g., [\"api\", \"portal\", \"auth\"]."
}
