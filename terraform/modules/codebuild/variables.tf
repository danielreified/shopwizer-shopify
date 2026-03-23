############################################
# Variables
############################################

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for CodeBuild to run in"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for CodeBuild"
  type        = list(string)
}

variable "source_s3_bucket" {
  description = "S3 bucket name for source code (optional, uses NO_SOURCE if not set)"
  type        = string
  default     = null
}

variable "source_s3_key" {
  description = "S3 object key for source code archive (e.g., source.zip)"
  type        = string
  default     = "source.zip"
}

variable "secrets_arns" {
  description = "List of Secrets Manager ARNs CodeBuild can access"
  type        = list(string)
}

variable "ecr_arns" {
  description = "List of ECR repository ARNs CodeBuild can pull from"
  type        = list(string)
  default     = []
}

variable "build_image" {
  description = "Docker image for the build environment"
  type        = string
  default     = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
}

variable "use_ecr_image" {
  description = "Whether the build image is from ECR (requires SERVICE_ROLE credentials)"
  type        = bool
  default     = false
}

variable "compute_type" {
  description = "CodeBuild compute type"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "build_timeout" {
  description = "Build timeout in minutes"
  type        = number
  default     = 10
}

variable "secrets_env_vars" {
  description = "Environment variables from Secrets Manager"
  type = list(object({
    name       = string
    value_from = string # Format: secret-id:json-key:version-stage:version-id
  }))
  default = []
}

variable "environment_variables" {
  description = "Plain text environment variables"
  type        = map(string)
  default     = {}
}

variable "buildspec" {
  description = "Inline buildspec YAML"
  type        = string
  default     = <<-EOF
    version: 0.2
    phases:
      install:
        runtime-versions:
          nodejs: 20
      build:
        commands:
          - echo "Running Prisma migrations..."
          - npx prisma migrate deploy
    EOF
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
