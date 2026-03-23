variable "name" {
  description = "Name of the ECR repository"
  type        = string
}

variable "image_tag_mutability" {
  description = "Whether image tags can be overwritten (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Enable vulnerability scanning on image push"
  type        = bool
  default     = true
}

variable "enable_lifecycle_policy" {
  description = "Whether to enable lifecycle policy for image cleanup"
  type        = bool
  default     = true
}

variable "retention_count" {
  description = "Number of recent images to retain in the repository"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Extra tags to attach to the repository"
  type        = map(string)
  default     = {}
}
