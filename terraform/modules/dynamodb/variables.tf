variable "table_name" { type = string }

variable "partition_key_name" {
  description = "Partition key (PK)"
  type        = string
  default     = "pk"
}
variable "sort_key_name" {
  description = "Sort key (SK)"
  type        = string
  default     = "hash"
}

variable "billing_mode" {
  description = "PAY_PER_REQUEST or PROVISIONED"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "billing_mode must be PAY_PER_REQUEST or PROVISIONED."
  }
}
variable "read_capacity" {
  type    = number
  default = 5
}
variable "write_capacity" {
  type    = number
  default = 5
}

variable "ttl_enabled" {
  type    = bool
  default = true
}
variable "ttl_attribute_name" {
  type    = string
  default = "ttl_expires_at"
}

variable "pitr_enabled" {
  type    = bool
  default = true
}
