variable "name_prefix" { type = string }
variable "service_name" { type = string }
variable "vpc_id" { type = string }
variable "port" { type = number }
variable "protocol" { type = string }
variable "target_type" {
  type    = string
  default = "ip"
}

# Health check
variable "health_check_path" { type = string }
variable "health_check_port" {
  type    = string
  default = null
}
variable "health_check_matcher" {
  type    = string
  default = "200"
}
variable "health_check_interval" {
  type    = number
  default = 30
}
variable "health_check_timeout" {
  type    = number
  default = 5
}
variable "health_check_healthy" {
  type    = number
  default = 2
}
variable "health_check_unhealthy" {
  type    = number
  default = 2
}

# TG attrs
variable "deregistration_delay" {
  type    = number
  default = 15
}
variable "slow_start" {
  type    = number
  default = 0
}
variable "stickiness_enabled" {
  type    = bool
  default = false
}

variable "stickiness_cookie_duration" {
  type    = number
  default = 86400
}

variable "tags" {
  type    = map(string)
  default = {}
}
