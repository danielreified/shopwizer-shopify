############################################
# CloudFront Pixel — variables
############################################

variable "name_prefix" {
  type        = string
  description = "Prefix for named resources (env/app)."
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM cert ARN in us-east-1 for CloudFront."
}

variable "root_domain" {
  type        = string
  description = "Root domain (e.g., example.com)."
}

variable "hosted_zone_id" {
  type        = string
  description = "Route53 hosted zone ID for root_domain."
}

variable "enable_s3_to_sqs" {
  type        = bool
  default     = false
  description = "If true, create S3->SQS notification for new log objects"
}

variable "logs_queue_arn" {
  type        = string
  default     = null
  description = "SQS ARN to notify (required if enable_s3_to_sqs=true)"
}
