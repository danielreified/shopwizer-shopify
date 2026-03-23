####################
# Identity & names #
####################
variable "name_prefix" {
  description = "Global prefix used for tags/names."
  type        = string
}
variable "service_prefix" {
  description = "Prefix for resources of this service (e.g., prod-app)."
  type        = string
}

########################
# Cluster & networking #
########################
variable "cluster_arn" {
  description = "ECS cluster ARN."
  type        = string
}
variable "subnet_ids" {
  description = "Private subnet IDs for awsvpc."
  type        = list(string)
}
variable "security_group_ids" {
  description = "Security group IDs for task ENIs."
  type        = list(string)
}

###################
# EXECUTION ROLE  #
###################
variable "execution_managed_policy_arns" {
  description = "Extra managed policies to attach to the execution role."
  type        = list(string)
  default     = []
}

variable "execution_inline_policy_json" {
  description = "Optional inline policy JSON for execution role (e.g., KMS decrypt for logs)."
  type        = string
  default     = null
}

variable "execution_permissions_boundary_arn" {
  description = "Optional permissions boundary ARN for the execution role."
  type        = string
  default     = null
}

variable "secrets_arns" {
  description = "List of Secrets Manager secret ARNs that the execution role can read (for container secrets)."
  type        = list(string)
  default     = []
}


############
# TASK ROLE#
############
variable "task_inline_policy_json" {
  description = "REQUIRED inline policy JSON for the task role (per-service permissions)."
  type        = string
}

variable "task_managed_policy_arns" {
  description = "Optional managed policies to attach to the task role."
  type        = list(string)
  default     = []
}

variable "task_permissions_boundary_arn" {
  description = "Optional permissions boundary ARN for the task role."
  type        = string
  default     = null
}

#############################
# Container-level variables #
#############################
variable "container" {
  description = "Main container definition."
  type = object({
    image       = string
    port        = number
    cpu         = number
    memory      = number
    environment = optional(map(string), {})
    secrets = optional(list(object({
      name      = string
      valueFrom = string
    })), [])
    command    = optional(list(string))
    entrypoint = optional(list(string))
  })
}

variable "extra_container_definitions" {
  description = "Sidecar container definitions (decoded objects)."
  type        = list(any)
  default     = []
}

variable "log_group_name" {
  description = "Existing CloudWatch Logs group name."
  type        = string
}

variable "desired_count" {
  description = "Initial desired count (ignored when autoscaling enabled)."
  type        = number
  default     = 1
}

##############################
# Optional load-balancer hook
##############################
variable "load_balancer" {
  description = "Attach to an existing target group."
  type = object({
    target_group_arn = string
    container_port   = number
  })
  default = null
}

############################
# Autoscaling (multi-rule) #
############################
variable "autoscaling" {
  description = <<EOF
Optional Application Auto Scaling config. If null, no scaling resources are created.

metric_type values:
  - "CPU"
  - "MEMORY"
  - "ALBReqCountPerTarget"
  - "Custom" (provide 'custom_metric')
EOF
  type = object({
    min_capacity = number
    max_capacity = number
    policies = list(object({
      name         = string
      metric_type  = string
      target_value = number
      custom_metric = optional(object({
        namespace   = string
        metric_name = string
        statistic   = string
        dimensions  = map(string)
        unit        = optional(string)
      }))
    }))
  })
  default = null
}

###############################
# Max-capacity alarm actions  #
###############################
variable "max_capacity_alarm_actions" {
  description = "SNS topic ARNs (etc.) for the 'maxed out' alarm."
  type        = list(string)
  default     = []
}

#################################
# Execution/runtime refinements #
#################################
variable "platform_version" {
  description = "Fargate platform version (null = latest)."
  type        = string
  default     = null
}

variable "ephemeral_storage_mb" {
  description = "Ephemeral storage in MB (>= 1024 if set)."
  type        = number
  default     = null
}

######################
# Service-level opts #
######################
variable "propagate_tags" {
  description = "Propagate tags from SERVICE or TASK_DEFINITION (or null)."
  type        = string
  default     = null
  validation {
    condition     = var.propagate_tags == null || contains(["SERVICE", "TASK_DEFINITION"], var.propagate_tags)
    error_message = "propagate_tags must be null, SERVICE, or TASK_DEFINITION."
  }
}

variable "assign_public_ip" {
  description = "Set true only when deploying into public subnets."
  type        = bool
  default     = false
}

###################
# Generic tagging #
###################
variable "tags" {
  description = "Tags merged onto created resources."
  type        = map(string)
  default     = {}
}
