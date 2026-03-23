variable "name" {
  type        = string
  default     = null
  description = "Name for a *custom* bus (ignored if event_source_name is set)."
}

variable "event_source_name" {
  type        = string
  default     = null
  description = "Partner source name (e.g. aws.partner/shopify.com/<account>/<bus>). If set, this is used as the bus name."
}

variable "create" {
  type        = bool
  default     = true
  description = "If false, do NOT create; only look up an existing bus by name (adopt mode)."
}
