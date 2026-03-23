variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the bastion will be created"
  type        = string
}

variable "subnet_id" {
  description = "Private subnet ID for the bastion instance"
  type        = string
}

variable "rds_proxy_endpoint" {
  description = "RDS Proxy endpoint for SSM port forwarding"
  type        = string
}

variable "rds_proxy_security_group_id" {
  description = "Security group ID of the RDS Proxy to allow connections"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type (ARM-based recommended for cost)"
  type        = string
  default     = "t4g.nano"
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

variable "idle_stop_minutes" {
  description = "Minutes of idle CPU before auto-stopping the instance (must be multiple of 5)"
  type        = number
  default     = 15
}
