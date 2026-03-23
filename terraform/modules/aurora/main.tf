############################################################
# ░░ DATA ░░
############################################################
# Look up the secret by NAME only.
data "aws_secretsmanager_secret" "creds" {
  name = var.db_credentials_secret_name
}

data "aws_secretsmanager_secret_version" "creds" {
  secret_id = data.aws_secretsmanager_secret.creds.id
}

locals {
  cluster_id        = "${var.name_prefix}-aurora"
  writer_id         = "${local.cluster_id}-writer"
  subnet_group_name = "${var.name_prefix}-rds-subnet-group"

  secret_arn = data.aws_secretsmanager_secret.creds.arn
  db_creds   = jsondecode(data.aws_secretsmanager_secret_version.creds.secret_string)

  allowed_sg_map = {
    for idx, sg in var.allowed_security_group_ids : tostring(idx) => sg
  }

  pg_url = format(
    "postgresql://%s:%s@%s:%d/%s",
    local.db_creds.username,
    local.db_creds.password,
    aws_rds_cluster.aurora.endpoint,
    var.db_port,
    var.db_name
  )

  # If proxy is enabled, compute the proxy connection string (writer endpoint).
  pg_proxy_url = var.enable_db_proxy ? format(
    "postgresql://%s:%s@%s:%d/%s",
    local.db_creds.username,
    local.db_creds.password,
    aws_db_proxy.pg_proxy[0].endpoint,
    var.db_port, # RDS Proxy listens on engine default (5432 for Postgres)
    var.db_name
  ) : null
}

############################################################
# ░░ SECURITY GROUPS ░░
############################################################
# Aurora SG — no inline rules; rules are managed by dedicated resources below.
resource "aws_security_group" "aurora_db" {
  name                   = "${var.name_prefix}-aurora-sg"
  vpc_id                 = var.vpc_id
  description            = "Allow Postgres only from allowed SGs / CIDRs"
  revoke_rules_on_delete = true

  tags = { Name = "${var.name_prefix}-aurora-sg" }
}

# Egress all for Aurora (explicit)
resource "aws_vpc_security_group_egress_rule" "aurora_all" {
  security_group_id = aws_security_group.aurora_db.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "all egress"
}

# Ingress from allowed SGs (known at plan time)
resource "aws_vpc_security_group_ingress_rule" "aurora_from_allowed_sg" {
  for_each                     = local.allowed_sg_map
  security_group_id            = aws_security_group.aurora_db.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = each.value
  description                  = "5432 from allowed SG ${each.value}"
}

# Ingress from PROXY SG (created in this module)
resource "aws_vpc_security_group_ingress_rule" "aurora_from_proxy" {
  count                        = var.enable_db_proxy ? 1 : 0
  security_group_id            = aws_security_group.aurora_db.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.db_proxy[0].id
  description                  = "5432 from RDS Proxy"
}

# Ingress from allowed CIDRs (if provided)
resource "aws_vpc_security_group_ingress_rule" "aurora_from_cidr" {
  for_each          = toset(var.allowed_cidr_blocks)
  security_group_id = aws_security_group.aurora_db.id
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
  cidr_ipv4         = each.value
  description       = "5432 from ${each.value}"
}

# SG for the RDS Proxy (clients connect to this instead of the DB SG)
resource "aws_security_group" "db_proxy" {
  count                  = var.enable_db_proxy ? 1 : 0
  name                   = "${var.name_prefix}-rds-proxy-sg"
  vpc_id                 = var.vpc_id
  description            = "Allow Postgres 5432 to RDS Proxy from allowed SGs/CIDRs"
  revoke_rules_on_delete = true

  tags = { Name = "${var.name_prefix}-rds-proxy-sg" }
}

# Ingress to the proxy from allowed SGs
resource "aws_vpc_security_group_ingress_rule" "proxy_from_allowed_sg" {
  for_each                     = var.enable_db_proxy ? local.allowed_sg_map : {}
  security_group_id            = aws_security_group.db_proxy[0].id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = each.value
  description                  = "5432 to RDS Proxy from allowed SG ${each.value}"
}

# Ingress to the proxy from allowed CIDRs (if provided)
resource "aws_vpc_security_group_ingress_rule" "proxy_from_cidr" {
  for_each          = var.enable_db_proxy ? toset(var.allowed_cidr_blocks) : toset([])
  security_group_id = aws_security_group.db_proxy[0].id
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
  cidr_ipv4         = each.value
  description       = "5432 to RDS Proxy from ${each.value}"
}

# Egress all for Proxy (to talk to DB)
resource "aws_vpc_security_group_egress_rule" "proxy_all" {
  count             = var.enable_db_proxy ? 1 : 0
  security_group_id = aws_security_group.db_proxy[0].id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "all egress from proxy"
}

############################################################
# ░░ NETWORKING ░░
############################################################
resource "aws_db_subnet_group" "this" {
  name       = local.subnet_group_name
  subnet_ids = var.subnet_ids
}

############################################################
# ░░ AURORA SERVERLESS v2 CLUSTER ░░
############################################################
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = local.cluster_id
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = var.engine_version
  database_name           = var.db_name
  master_username         = local.db_creds.username
  master_password         = local.db_creds.password
  storage_encrypted       = true
  backup_retention_period = var.backup_retention_days
  preferred_backup_window = var.preferred_backup_window
  deletion_protection     = var.deletion_protection
  copy_tags_to_snapshot   = true
  skip_final_snapshot     = var.skip_final_snapshot

  db_subnet_group_name = aws_db_subnet_group.this.name

  vpc_security_group_ids = concat(
    [aws_security_group.aurora_db.id],
    var.additional_security_group_ids
  )

  allow_major_version_upgrade = var.allow_major_version_upgrade

  serverlessv2_scaling_configuration {
    min_capacity = var.serverless_min_acu
    max_capacity = var.serverless_max_acu
  }

  timeouts {
    create = "60m"
  }
}

############################################################
# ░░ WRITER INSTANCE ░░
############################################################
resource "aws_rds_cluster_instance" "writer" {
  identifier                 = local.writer_id
  cluster_identifier         = aws_rds_cluster.aurora.id
  instance_class             = "db.serverless"
  engine                     = aws_rds_cluster.aurora.engine
  engine_version             = aws_rds_cluster.aurora.engine_version
  auto_minor_version_upgrade = true
  publicly_accessible        = var.publicly_accessible
}

############################################################
# ░░ RDS PROXY (optional) ░░
############################################################
# IAM role so the proxy can read the DB credentials secret
resource "aws_iam_role" "rds_proxy" {
  count = var.enable_db_proxy ? 1 : 0
  name  = "${var.name_prefix}-rds-proxy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "rds.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

# Inline policy: allow reading the secret (avoid missing managed policy issue)
data "aws_iam_policy_document" "rds_proxy_inline" {
  count = var.enable_db_proxy ? 1 : 0

  statement {
    sid       = "ReadDbSecret"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [local.secret_arn]
  }

  # If your secret uses a CMK (KMS), optionally add a Decrypt statement.
  # See previous message for a template, or keep it minimal if using AWS-managed key.
}

resource "aws_iam_role_policy" "rds_proxy_inline" {
  count  = var.enable_db_proxy ? 1 : 0
  name   = "${var.name_prefix}-rds-proxy-inline"
  role   = aws_iam_role.rds_proxy[0].id
  policy = data.aws_iam_policy_document.rds_proxy_inline[0].json
}

# The proxy itself
resource "aws_db_proxy" "pg_proxy" {
  count               = var.enable_db_proxy ? 1 : 0
  name                = "${var.name_prefix}-pg-proxy"
  debug_logging       = var.proxy_debug_logging
  engine_family       = "POSTGRESQL"
  idle_client_timeout = var.proxy_idle_client_timeout
  require_tls         = var.proxy_require_tls
  role_arn            = aws_iam_role.rds_proxy[0].arn

  vpc_subnet_ids         = coalesce(var.proxy_subnet_ids, var.subnet_ids)
  vpc_security_group_ids = [aws_security_group.db_proxy[0].id]

  auth {
    auth_scheme = "SECRETS"
    secret_arn  = local.secret_arn
    iam_auth    = "DISABLED" # set "REQUIRED" to use IAM auth tokens from clients
  }
}

# Default target group for the proxy
resource "aws_db_proxy_default_target_group" "pg_proxy" {
  count         = var.enable_db_proxy ? 1 : 0
  db_proxy_name = aws_db_proxy.pg_proxy[0].name

  connection_pool_config {
    max_connections_percent      = 90
    max_idle_connections_percent = 50
    connection_borrow_timeout    = 120
  }
}

# Attach the Aurora *cluster* as the target (not the instance)
resource "aws_db_proxy_target" "pg_proxy_cluster" {
  count                 = var.enable_db_proxy ? 1 : 0
  db_proxy_name         = aws_db_proxy.pg_proxy[0].name
  target_group_name     = aws_db_proxy_default_target_group.pg_proxy[0].name
  db_cluster_identifier = aws_rds_cluster.aurora.id
}

# Optional read-only proxy endpoint (targets replicas / reader endpoint role)
resource "aws_db_proxy_endpoint" "read_only" {
  count                  = var.enable_db_proxy && var.create_reader_proxy_endpoint ? 1 : 0
  db_proxy_name          = aws_db_proxy.pg_proxy[0].name
  db_proxy_endpoint_name = "${var.name_prefix}-pg-proxy-ro"
  vpc_subnet_ids         = coalesce(var.proxy_subnet_ids, var.subnet_ids)
  vpc_security_group_ids = [aws_security_group.db_proxy[0].id]
  target_role            = "READ_ONLY"
}
