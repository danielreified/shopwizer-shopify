variable "root_domain" {
  description = "Base domain, e.g. example.com"
  type        = string
}

variable "san_names" {
  description = "Optional SANs; defaults to *.root_domain"
  type        = list(string)
  default     = []
}

variable "validation_record_ttl" {
  description = "TTL for DNS validation records"
  type        = number
  default     = 60
}
