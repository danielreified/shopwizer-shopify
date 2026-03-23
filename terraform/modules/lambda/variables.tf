####################
# Identity / naming
####################
variable "function_name" {
  description = "Lambda function name (unique)."
  type        = string
}

variable "description" {
  description = "Optional description for the Lambda."
  type        = string
  default     = null
}

####################
# Code artifacts (REQUIRED)
####################
variable "artifact_bucket_name" {
  description = "S3 bucket that stores the Lambda code object."
  type        = string
}

variable "code_s3_key" {
  description = "S3 object key for the Lambda code ZIP."
  type        = string
}

####################
# Runtime
####################
variable "runtime" {
  description = "Runtime (e.g., nodejs20.x, python3.12)."
  type        = string
}

variable "handler" {
  description = "Handler entrypoint (e.g., index.handler / handler.handler)."
  type        = string
  default     = "handler.handler"
}

variable "architectures" {
  description = "Lambda CPU architecture."
  type        = list(string)
  default     = ["arm64"] # or ["x86_64"]
}

variable "layers" {
  description = "List of Lambda layer ARNs."
  type        = list(string)
  default     = []
}

variable "memory_mb" {
  description = "Memory size in MB."
  type        = number
  default     = 256
}

variable "timeout_seconds" {
  description = "Timeout in seconds."
  type        = number
  default     = 10
}

variable "ephemeral_storage_mb" {
  description = "Ephemeral storage in MB (512–10240). If null, AWS default (512 MB) is used."
  type        = number
  default     = null
}

variable "publish" {
  description = "Whether to publish a new version on update."
  type        = bool
  default     = true
}

####################
# Environment
####################
variable "environment" {
  description = "Environment variables for the Lambda (values must be strings)."
  type        = map(string)
  default     = {}
}

####################
# VPC (optional)
####################
variable "subnet_ids" {
  description = "Private subnet IDs for VPC attachment (optional)."
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs for VPC ENIs (required if subnet_ids is set)."
  type        = list(string)
  default     = []
}

####################
# IAM (execution role created here)
####################
variable "exec_inline_policy_json" {
  description = "REQUIRED inline policy JSON attached to the created execution role (least privilege per Lambda)."
  type        = string
}

variable "exec_managed_policy_arns" {
  description = "Extra managed policy ARNs to attach to the execution role."
  type        = list(string)
  default     = []
}

variable "exec_permissions_boundary_arn" {
  description = "Optional permissions boundary ARN for the created execution role."
  type        = string
  default     = null
}

####################
# Tags
####################
variable "tags" {
  description = "Tags to apply to the role and function."
  type        = map(string)
  default     = {}
}
