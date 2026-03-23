variable "base_name" {
  type = string
}

variable "kms_master_key_id" {
  type    = string
  default = "alias/aws/sqs"
}

variable "create_dlq" {
  type    = bool
  default = true
}

variable "max_receive_count" {
  type    = number
  default = 5
}

variable "allow_eventbridge" {
  type    = bool
  default = false
}

variable "eventbridge_source_arns" {
  type    = list(string)
  default = []
}

variable "eventbridge_source_accounts" {
  type    = list(string)
  default = []
}

variable "is_fifo" {
  type    = bool
  default = false
}

variable "content_based_deduplication" {
  type    = bool
  default = false
}

variable "deduplication_scope" {
  type    = string
  default = null
}

variable "fifo_throughput_limit" {
  type    = string
  default = null
}

variable "message_retention_seconds" {
  type    = number
  default = 345600
}

variable "visibility_timeout_seconds" {
  type    = number
  default = 30
}

variable "receive_wait_time_seconds" {
  type    = number
  default = 0
}

variable "delay_seconds" {
  type    = number
  default = 0
}
variable "max_message_size" {
  type    = number
  default = 262144
}

variable "dlq_message_retention_seconds" {
  type    = number
  default = 1209600
}
variable "dlq_visibility_timeout_seconds" {
  type    = number
  default = 30
}

variable "dlq_receive_wait_time_seconds" {
  type    = number
  default = 0
}

variable "dlq_delay_seconds" {
  type    = number
  default = 0
}

variable "dlq_max_message_size" {
  type    = number
  default = 262144
}
