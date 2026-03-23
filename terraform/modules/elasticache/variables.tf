variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

# Who can reach Redis (by SG or CIDR)
variable "allowed_security_group_ids" {
  type    = list(string)
  default = []
}

variable "allowed_cidr_blocks" {
  type    = list(string)
  default = []
}

# Sizing / engine
variable "node_type" {
  type = string # e.g., "cache.t4g.micro"
}

variable "engine_version" {
  type    = string
  default = null
}

# Encryption settings (NO TLS/AUTH supported in this simplified module)
variable "at_rest_encryption_enabled" {
  type    = bool
  default = false
}

variable "transit_encryption_enabled" {
  type    = bool
  default = false
  validation {
    condition     = var.transit_encryption_enabled == false
    error_message = "This simplified module removes AUTH and TLS. Set transit_encryption_enabled=false."
  }
}

# Ops knobs
variable "apply_immediately" {
  type    = bool
  default = true
}

variable "maintenance_window" {
  type    = string
  default = null
}

variable "parameter_group_name" {
  type    = string
  default = null
}

# Optional id and tags
variable "replication_group_id" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
