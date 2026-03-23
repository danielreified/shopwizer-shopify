variable "name_prefix" {
  type = string
}
variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "allowed_ingress_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "enable_deletion_protection" {
  type    = bool
  default = true
}

variable "idle_timeout" {
  type    = number
  default = 60
}

variable "ssl_policy" {
  type    = string
  default = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "certificate_arn" {
  type = string
}

variable "default_forward_target_group_arn" {
  type    = string
  default = null
}

variable "internal" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
