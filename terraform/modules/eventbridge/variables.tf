variable "name_prefix" {
  type        = string
  description = "Prefix for naming all resources (e.g., dev-ue1-shopwizer)"
}

variable "enable_archive" {
  type        = bool
  default     = false
  description = "Whether to create an event archive for replay capabilities"
}

variable "archive_retention_days" {
  type        = number
  default     = 7
  description = "Number of days to retain archived events"
}

variable "rules" {
  type = list(object({
    name_suffix      = string
    event_pattern    = any
    queue_arn        = string
    message_group_id = optional(string)
  }))
  default     = []
  description = "List of rules to create. Each rule routes matching events to an SQS queue."
}
