variable "name_prefix" {
  description = "Name prefix for all resources (e.g., chhat-prod)"
  type        = string
}

variable "vpc_cidr_block" {
  description = "CIDR for the VPC (e.g., 10.0.0.0/16)"
  type        = string
  validation {
    condition     = can(cidrnetmask(var.vpc_cidr_block))
    error_message = "vpc_cidr_block must be a valid CIDR."
  }
}

variable "az_a" {
  description = "AZ for A"
  type        = string
}

variable "az_b" {
  description = "AZ for B"
  type        = string
}

variable "public_subnet_a_cidr" {
  description = "CIDR for public subnet A"
  type        = string
}

variable "public_subnet_b_cidr" {
  description = "CIDR for public subnet B"
  type        = string
}

variable "private_subnet_a_cidr" {
  description = "CIDR for private subnet A"
  type        = string
}

variable "private_subnet_b_cidr" {
  description = "CIDR for private subnet B"
  type        = string
}

variable "create_nat_gateway" {
  description = "Create a single NAT in public_a and route private subnets through it"
  type        = bool
  default     = true
}

variable "create_s3_gateway_endpoint" {
  description = "Create S3 Gateway Endpoint on private route table"
  type        = bool
  default     = true
}

variable "create_dynamodb_gateway_endpoint" {
  description = "Create DynamoDB Gateway Endpoint on private route table"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  type    = bool
  default = true
}

variable "enable_dns_hostnames" {
  type    = bool
  default = true
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
