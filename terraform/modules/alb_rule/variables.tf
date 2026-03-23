variable "name_prefix" {
  type = string
}

variable "listener_arn" {
  type = string
}

variable "target_group_arn" {
  type = string
}

variable "priority" {
  type = number
}

variable "hostnames" {
  type    = list(string)
  default = []
}

variable "paths" {
  type    = list(string)
  default = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
