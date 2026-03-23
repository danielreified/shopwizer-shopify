variable "name_prefix" {
  description = "Prefix for naming the ECS cluster if cluster_name is not provided (e.g., chhat-prod)"
  type        = string
}

variable "cluster_name" {
  description = "Explicit ECS cluster name (overrides name_prefix if set)"
  type        = string
  default     = null
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights on the cluster"
  type        = bool
  default     = false
}

variable "enable_exec" {
  description = "Enable ECS Exec (execute-command) configuration on the cluster"
  type        = bool
  default     = true
}

variable "exec_kms_key_id" {
  description = "KMS key ARN/alias for ECS Exec encryption (null = AWS-managed CMK)"
  type        = string
  default     = null
}

variable "exec_logging" {
  description = "ECS Exec logging mode: DEFAULT or OVERRIDE"
  type        = string
  default     = "DEFAULT"
  validation {
    condition     = contains(["DEFAULT", "OVERRIDE"], var.exec_logging)
    error_message = "exec_logging must be DEFAULT or OVERRIDE."
  }
}

variable "default_capacity_provider_strategy" {
  description = <<EOT
Cluster-level default capacity provider strategy. Used when services or RunTask calls
do not specify their own strategy. Example ~50/50 with 1 on-demand floor:

[
  { capacity_provider = "FARGATE",       base = 1, weight = 1 },
  { capacity_provider = "FARGATE_SPOT",               weight = 1 }
]
EOT
  type = list(object({
    capacity_provider = string
    weight            = optional(number)
    base              = optional(number)
  }))
  default = []
}