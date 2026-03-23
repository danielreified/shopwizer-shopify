variable "rule_name" {
  type        = string
  description = "Name of the EventBridge rule"
}

variable "description" {
  type    = string
  default = null
}

variable "queue_arn" {
  type        = string
  description = "ARN of the target SQS queue"
}

variable "fifo_message_group_id" {
  type    = string
  default = null
}

variable "role_name" {
  type        = string
  default     = null
  description = "Optional custom name for the EventBridge→SQS IAM role; defaults to <rule_name>-evb-to-sqs"
}

variable "permissions_boundary_arn" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "schedule" {
  description = "Optional schedule expression (e.g. rate(1 day))"
  type        = string
  default     = null
}

variable "message_body" {
  description = "Optional JSON message body to send to the SQS target"
  type        = string
  default     = null
}

variable "event_pattern_json" {
  description = "Optional event pattern JSON for partner or custom events"
  type        = string
  default     = null
}

variable "event_bus_name" {
  description = "Optional EventBridge bus name (defaults to the account's default bus)"
  type        = string
  default     = null
}
