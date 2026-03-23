variable "name_prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "betterstack_source_token" {
  type        = string
  description = "BetterStack source token"
  sensitive   = true
}

variable "betterstack_ingesting_host" {
  type        = string
  description = "BetterStack ingesting host (e.g., s1657231.eu-nbg-2.betterstackdata.com)"
}

variable "log_group_names" {
  type        = list(string)
  description = "List of CloudWatch log group names to forward"
}
