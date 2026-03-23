variable "name_prefix" {
  description = "Full log group name (e.g., /aws/chhat-prod-api)"
  type        = string
}

variable "name" {
  description = "Full log group name (e.g., /aws/chhat-prod-api)"
  type        = string
}

variable "retention_in_days" {
  description = "Retention in days (e.g., 7, 14, 30, 90, 365, etc.)"
  type        = number
  default     = 30
}

variable "kms_key_id" {
  description = "KMS key ARN or alias for encrypting logs (optional)"
  type        = string
  default     = null
}

variable "log_group_class" {
  description = "Log group class: STANDARD or INFREQUENT_ACCESS (optional)"
  type        = string
  default     = null
  validation {
    condition     = var.log_group_class == null || contains(["STANDARD", "INFREQUENT_ACCESS"], var.log_group_class)
    error_message = "log_group_class must be null, STANDARD, or INFREQUENT_ACCESS."
  }
}

variable "prevent_destroy" {
  description = "If true, protect the log group from accidental destroy"
  type        = bool
  default     = false
}
