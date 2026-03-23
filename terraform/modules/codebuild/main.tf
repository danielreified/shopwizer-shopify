############################################
# CodeBuild Project - Database Migrations
############################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# IAM Role for CodeBuild
data "aws_iam_policy_document" "codebuild_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codebuild" {
  name               = "${var.name_prefix}-codebuild-role"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume.json
  tags               = var.tags
}

# CodeBuild permissions
data "aws_iam_policy_document" "codebuild_policy" {
  # CloudWatch Logs
  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  # VPC networking (for private subnet access)
  statement {
    sid = "VPCNetworking"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeDhcpOptions",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeSubnets",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeVpcs"
    ]
    resources = ["*"]
  }

  statement {
    sid       = "VPCNetworkInterfacePermissions"
    actions   = ["ec2:CreateNetworkInterfacePermission"]
    resources = ["arn:aws:ec2:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:network-interface/*"]
    condition {
      test     = "StringEquals"
      variable = "ec2:AuthorizedService"
      values   = ["codebuild.amazonaws.com"]
    }
  }

  # Secrets Manager access
  statement {
    sid       = "SecretsManagerRead"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = var.secrets_arns
  }

  # ECR access (to pull migration image)
  statement {
    sid = "ECRAuth"
    actions = [
      "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
  }

  statement {
    sid = "ECRPull"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage"
    ]
    resources = var.ecr_arns
  }

  # S3 source bucket access (if configured)
  dynamic "statement" {
    for_each = var.source_s3_bucket != null ? [1] : []
    content {
      sid = "S3SourceRead"
      actions = [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ]
      resources = ["arn:aws:s3:::${var.source_s3_bucket}/*"]
    }
  }
}

resource "aws_iam_role_policy" "codebuild" {
  name   = "${var.name_prefix}-codebuild-policy"
  role   = aws_iam_role.codebuild.id
  policy = data.aws_iam_policy_document.codebuild_policy.json
}

# Security Group for CodeBuild
resource "aws_security_group" "codebuild" {
  name        = "${var.name_prefix}-codebuild-sg"
  description = "Security group for CodeBuild migrations"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-codebuild-sg" })
}

# CodeBuild Project
resource "aws_codebuild_project" "migrations" {
  name          = "${var.name_prefix}-db-migrations"
  description   = "Runs Prisma database migrations"
  build_timeout = var.build_timeout
  service_role  = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = var.compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = var.use_ecr_image ? "SERVICE_ROLE" : "CODEBUILD"
    privileged_mode             = false

    # Environment variables from Secrets Manager
    dynamic "environment_variable" {
      for_each = var.secrets_env_vars
      content {
        name  = environment_variable.value.name
        value = environment_variable.value.value_from
        type  = "SECRETS_MANAGER"
      }
    }

    # Plain environment variables
    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
        type  = "PLAINTEXT"
      }
    }
  }

  # Run in VPC to access RDS
  vpc_config {
    vpc_id             = var.vpc_id
    subnets            = var.subnet_ids
    security_group_ids = [aws_security_group.codebuild.id]
  }

  source {
    type      = var.source_s3_bucket != null ? "S3" : "NO_SOURCE"
    location  = var.source_s3_bucket != null ? "${var.source_s3_bucket}/${var.source_s3_key}" : null
    buildspec = var.buildspec
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/${var.name_prefix}-db-migrations"
      stream_name = "migrations"
    }
  }

  tags = var.tags
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${var.name_prefix}-db-migrations"
  retention_in_days = 14
  tags              = var.tags
}
