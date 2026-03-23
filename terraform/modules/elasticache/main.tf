############################################
# Minimal ElastiCache Redis (single node)
############################################

locals {
  rg_id       = coalesce(var.replication_group_id, "${var.name_prefix}-redis")
  merged_tags = merge({ Name = local.rg_id, Module = "redis_lite" }, var.tags)
}

############################################################
# Security Group – allow 6379 from allowed SGs/CIDRs
############################################################
resource "aws_security_group" "this" {
  name        = "${var.name_prefix}-redis-sg"
  description = "Redis access"
  vpc_id      = var.vpc_id
  tags        = merge(local.merged_tags, { Name = "${var.name_prefix}-redis-sg" })

  # From SGs
  dynamic "ingress" {
    for_each = toset(var.allowed_security_group_ids)
    content {
      description     = "6379 from SG ${ingress.value}"
      from_port       = 6379
      to_port         = 6379
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  # From CIDRs (optional)
  dynamic "ingress" {
    for_each = toset(var.allowed_cidr_blocks)
    content {
      description = "6379 from ${ingress.value}"
      from_port   = 6379
      to_port     = 6379
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

############################################################
# Subnet Group (use private subnets)
############################################################
resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name_prefix}-redis-subnets"
  subnet_ids = var.subnet_ids
  tags       = merge(local.merged_tags, { Name = "${var.name_prefix}-redis-subnets" })
}

############################################################
# Single-node ElastiCache Redis
############################################################
resource "aws_elasticache_replication_group" "this" {
  replication_group_id = local.rg_id
  description          = "Lightweight Redis for rate limiting / leaky-bucket"
  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  port                 = 6379

  # Minimal: one primary only
  num_cache_clusters         = 1
  automatic_failover_enabled = false
  multi_az_enabled           = false

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.this.id]

  # Security (NO TLS/AUTH in this simplified module)
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  # NOTE: no auth_token here

  # Optional ops knobs
  apply_immediately    = var.apply_immediately
  maintenance_window   = var.maintenance_window
  parameter_group_name = var.parameter_group_name

  tags = local.merged_tags
}
