variable "bucket_name" {
  description = "Exact S3 bucket name (must be globally unique)."
  type        = string
}

variable "force_destroy" {
  description = "Allow Terraform to delete non-empty bucket (use with care)."
  type        = bool
  default     = false
}

variable "object_ownership" {
  description = "Ownership mode; 'BucketOwnerEnforced' disables ACLs."
  type        = string
  default     = "BucketOwnerEnforced"
  validation {
    condition     = contains(["BucketOwnerEnforced", "BucketOwnerPreferred", "ObjectWriter"], var.object_ownership)
    error_message = "object_ownership must be one of BucketOwnerEnforced, BucketOwnerPreferred, ObjectWriter."
  }
}

# Public access blocks
variable "block_public_acls" {
  type    = bool
  default = true
}

variable "block_public_policy" {
  type    = bool
  default = true
}

variable "ignore_public_acls" {
  type    = bool
  default = true
}

variable "restrict_public_buckets" {
  type    = bool
  default = true
}

variable "versioning_enabled" {
  description = "Enable object versioning."
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ARN or alias for SSE-KMS (if null, use SSE-S3 AES256)."
  type        = string
  default     = null
}

variable "bucket_key_enabled" {
  description = "Enable S3 Bucket Keys (reduces KMS costs for SSE-KMS)."
  type        = bool
  default     = true
}

variable "logging" {
  description = "Server access logging config; target bucket must allow writes from this bucket."
  type = object({
    target_bucket = string
    target_prefix = string
  })
  default = null
}

variable "transition_to_ia_days" {
  type    = number
  default = null
}

variable "transition_to_deep_archive_days" {
  type    = number
  default = null
}

variable "expire_days" {
  type    = number
  default = null
}

variable "noncurrent_to_ia_days" {
  type    = number
  default = null
}

variable "noncurrent_to_deep_archive_days" {
  type    = number
  default = null
}

variable "noncurrent_expire_days" {
  type    = number
  default = null
}

variable "cors_rules" {
  description = "List of CORS rules."
  type = list(object({
    allowed_methods = list(string)
    allowed_origins = list(string)
    allowed_headers = optional(list(string))
    expose_headers  = optional(list(string))
    max_age_seconds = optional(number)
  }))
  default = []
}

variable "bucket_policy_json" {
  description = "Optional full bucket policy JSON to attach. If set, overrides enforce_ssl_only."
  type        = string
  default     = null
}

variable "enforce_ssl_only" {
  description = "Attach a default policy that denies non-SSL requests if no bucket_policy_json is provided."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources."
  type        = map(string)
  default     = {}
}
