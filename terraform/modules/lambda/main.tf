############################################
# Singular Lambda function (no loops)
############################################

locals {
  vpc_enabled = length(var.subnet_ids) > 0
}

############################################
# Execution role (always created here)
############################################
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "exec" {
  name                 = "${var.function_name}-exec-role"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume.json
  permissions_boundary = var.exec_permissions_boundary_arn
  tags                 = var.tags
}

# Baseline logging
resource "aws_iam_role_policy_attachment" "exec_basic" {
  role       = aws_iam_role.exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC access (only if VPC is enabled)
resource "aws_iam_role_policy_attachment" "exec_vpc" {
  count      = local.vpc_enabled ? 1 : 0
  role       = aws_iam_role.exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# REQUIRED: per-Lambda inline policy (least privilege)
resource "aws_iam_policy" "exec_inline" {
  name   = "${var.function_name}-exec-inline"
  policy = var.exec_inline_policy_json
}

resource "aws_iam_role_policy_attachment" "exec_inline_attach" {
  role       = aws_iam_role.exec.name
  policy_arn = aws_iam_policy.exec_inline.arn
}

# Optional: extra managed policies
resource "aws_iam_role_policy_attachment" "exec_managed_attach" {
  for_each   = toset(var.exec_managed_policy_arns)
  role       = aws_iam_role.exec.name
  policy_arn = each.value
}

############################################
# Lambda function (uses your S3 code object)
############################################
resource "aws_lambda_function" "this" {
  function_name = var.function_name
  description   = var.description

  runtime       = var.runtime
  handler       = var.handler
  role          = aws_iam_role.exec.arn
  architectures = var.architectures
  layers        = var.layers
  memory_size   = var.memory_mb
  timeout       = var.timeout_seconds
  publish       = var.publish

  # Code location you provide (module does not upload)
  s3_bucket = var.artifact_bucket_name
  s3_key    = var.code_s3_key

  # Optional VPC config (created only if subnet_ids is non-empty)
  dynamic "vpc_config" {
    for_each = local.vpc_enabled ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }

  # Optional extra ephemeral storage (MB, 512–10240)
  dynamic "ephemeral_storage" {
    for_each = var.ephemeral_storage_mb == null ? [] : [1]
    content { size = var.ephemeral_storage_mb }
  }

  # Use environment variables exactly as passed in
  environment { variables = var.environment }

  tags = var.tags

  # Guardrail: if VPC is enabled, at least one SG is required
  lifecycle {
    precondition {
      condition     = !local.vpc_enabled || length(var.security_group_ids) > 0
      error_message = "When subnet_ids are provided, you must also provide security_group_ids."
    }

    # Prevent Terraform from reverting Lambda version changes made by CI/CD
    ignore_changes = [
      version
    ]
  }
}
