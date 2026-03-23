variable "name_prefix" {
  description = "Prefix for all RDS resources (e.g., chhat-prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the DB will live"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for DB subnet group (min 2 across AZs)"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "SG IDs allowed to connect to Postgres 5432 (e.g., ECS tasks SGs)"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "Optional CIDRs allowed to connect to 5432 (discouraged; use SGs)"
  type        = list(string)
  default     = []
}

variable "additional_security_group_ids" {
  description = "Extra SGs to attach on the cluster besides the module-created SG"
  type        = list(string)
  default     = []
}

variable "db_credentials_secret_name" {
  description = "Secrets Manager secret name/ARN containing {\"username\":\"...\",\"password\":\"...\"}"
  type        = string
}

variable "db_name" {
  description = "Initial database name to create in the cluster"
  type        = string
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version (compatible with Serverless v2)"
  type        = string
}

variable "serverless_min_acu" {
  description = "Aurora Serverless v2 minimum ACUs"
  type        = number
  default     = 0.5
}

variable "serverless_max_acu" {
  description = "Aurora Serverless v2 maximum ACUs"
  type        = number
  default     = 8
}

variable "backup_retention_days" {
  description = "Automated backups retention (days)"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window (UTC), e.g., 03:00-04:00"
  type        = string
  default     = "03:00-04:00"
}

variable "deletion_protection" {
  description = "Prevent accidental deletion of the cluster"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on destroy (true = skip)"
  type        = bool
  default     = true
}

variable "allow_major_version_upgrade" {
  description = "Allow major version upgrade on cluster"
  type        = bool
  default     = true
}

variable "publicly_accessible" {
  description = "Whether the writer instance is publicly accessible"
  type        = bool
  default     = false
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

# ── Proxy controls ────────────────────────────────────────────────────────────
variable "enable_db_proxy" {
  description = "Create an RDS Proxy in front of the cluster"
  type        = bool
  default     = true
}

variable "proxy_subnet_ids" {
  description = "Subnets for the proxy endpoints (defaults to DB subnets)"
  type        = list(string)
  default     = null
}

variable "proxy_require_tls" {
  description = "Enforce TLS for proxy clients"
  type        = bool
  default     = true
}

variable "proxy_idle_client_timeout" {
  description = "Seconds to wait before closing idle client connections"
  type        = number
  default     = 1800
}

variable "proxy_debug_logging" {
  description = "Enable RDS Proxy debug logging"
  type        = bool
  default     = false
}

variable "create_reader_proxy_endpoint" {
  description = "Create a READ_ONLY endpoint for the proxy (for read traffic)"
  type        = bool
  default     = true
}
