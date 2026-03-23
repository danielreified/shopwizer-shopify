#####################################################################
#  ECS SERVICE — Fargate task, optional ALB, optional autoscaling   #
#####################################################################

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

################################################
# EXECUTION ROLE (created inside this module)  #
################################################

# Trust policy for the execution role
data "aws_iam_policy_document" "ecs_execution_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name                 = "${var.service_prefix}-exec-role"
  assume_role_policy   = data.aws_iam_policy_document.ecs_execution_assume.json
  permissions_boundary = var.execution_permissions_boundary_arn
  tags                 = merge({ Module = "ecs_service" }, var.tags)
}

# Baseline AWS-managed policy (pull images, push logs, etc.)
resource "aws_iam_role_policy_attachment" "execution_aws_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Optional: extra managed policies for the execution role
resource "aws_iam_role_policy_attachment" "execution_attach_managed_list" {
  for_each   = toset(var.execution_managed_policy_arns)
  role       = aws_iam_role.execution.name
  policy_arn = each.value
}

# Allow execution role to read from SSM Parameter Store (for secrets)
data "aws_iam_policy_document" "execution_ssm_read" {
  statement {
    sid    = "SSMGetParameters"
    effect = "Allow"
    actions = [
      "ssm:GetParameters",
      "ssm:GetParameter",
      "ssm:GetParametersByPath"
    ]
    resources = ["*"] # Narrow this down in production if needed
  }

  statement {
    sid       = "KMSDecryptForSSM"
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = ["*"] # Narrow this down to specific KMS key ARNs in production
  }
}

resource "aws_iam_role_policy" "execution_ssm_read" {
  name   = "${var.service_prefix}-exec-ssm-read"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_ssm_read.json
}

# Allow execution role to read from Secrets Manager (for container secrets)
data "aws_iam_policy_document" "execution_secrets_read" {
  count = length(var.secrets_arns) > 0 ? 1 : 0

  statement {
    sid    = "SecretsManagerGetSecretValue"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = var.secrets_arns
  }
}

resource "aws_iam_role_policy" "execution_secrets_read" {
  count  = length(var.secrets_arns) > 0 ? 1 : 0
  name   = "${var.service_prefix}-exec-secrets-read"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets_read[0].json
}

# Optional: inline policy for execution role (e.g., KMS decrypt for logs CMK)
resource "aws_iam_policy" "execution_inline" {
  count  = var.execution_inline_policy_json == null ? 0 : 1
  name   = "${var.service_prefix}-exec-inline"
  policy = var.execution_inline_policy_json
}

resource "aws_iam_role_policy_attachment" "execution_inline_attach" {
  count      = var.execution_inline_policy_json == null ? 0 : 1
  role       = aws_iam_role.execution.name
  policy_arn = aws_iam_policy.execution_inline[0].arn
}

#############################################
# TASK ROLE (created inside, JSON required) #
#############################################

# Trust policy – tasks assume this role
data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task" {
  name                 = "${var.service_prefix}-task-role"
  assume_role_policy   = data.aws_iam_policy_document.ecs_task_assume.json
  permissions_boundary = var.task_permissions_boundary_arn
  tags                 = merge({ Module = "ecs_service" }, var.tags)
}

# REQUIRED inline policy JSON you pass in (per-service permissions)
resource "aws_iam_policy" "task_inline" {
  name   = "${var.service_prefix}-task-policy"
  policy = var.task_inline_policy_json
}

resource "aws_iam_role_policy_attachment" "task_attach_inline" {
  role       = aws_iam_role.task.name
  policy_arn = aws_iam_policy.task_inline.arn
}

# Optional: additional managed policies for the task role
resource "aws_iam_role_policy_attachment" "task_attach_managed_list" {
  count      = length(var.task_managed_policy_arns)
  role       = aws_iam_role.task.name
  policy_arn = var.task_managed_policy_arns[count.index]
}

############################
# Locals for container JSON
############################
locals {
  name_prefix         = var.name_prefix
  main_container_name = "${var.service_prefix}-main"
  _cluster_arn_parts  = split("/", var.cluster_arn)
  cluster_name        = local._cluster_arn_parts[length(local._cluster_arn_parts) - 1]

  base_container_json = jsonencode([
    merge(
      {
        name      = local.main_container_name
        image     = var.container.image
        cpu       = var.container.cpu
        memory    = var.container.memory
        essential = true

        portMappings = [{
          containerPort = var.container.port
          hostPort      = var.container.port
          protocol      = "tcp"
        }]

        logConfiguration = {
          logDriver = "awslogs"
          options = {
            "awslogs-region"        = data.aws_region.current.id
            "awslogs-group"         = var.log_group_name
            "awslogs-stream-prefix" = var.service_prefix
          }
        }

        environment = [
          for k, v in var.container.environment : { name = k, value = v }
        ]

        secrets = var.container.secrets
      },
      {
        command    = var.container.command
        entryPoint = var.container.entrypoint
      }
    )
  ])

  full_container_defs = jsonencode(concat(
    jsondecode(local.base_container_json),
    var.extra_container_definitions
  ))
}

############################
# ECS Task Definition
############################
resource "aws_ecs_task_definition" "this" {
  family                   = "${var.service_prefix}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container.cpu
  memory                   = var.container.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn
  container_definitions    = local.full_container_defs

  dynamic "ephemeral_storage" {
    for_each = var.ephemeral_storage_mb == null ? [] : [1]
    content { size_in_gib = floor(var.ephemeral_storage_mb / 1024) }
  }

  tags = { Name = "${var.service_prefix}-task" }
}

############################
# ECS Service
############################
resource "aws_ecs_service" "this" {
  name             = "${var.service_prefix}-svc"
  cluster          = var.cluster_arn
  task_definition  = aws_ecs_task_definition.this.arn
  desired_count    = var.desired_count
  launch_type      = "FARGATE"
  platform_version = var.platform_version
  propagate_tags   = var.propagate_tags

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = var.assign_public_ip
  }

  # Optional ALB/NLB hookup
  dynamic "load_balancer" {
    for_each = var.load_balancer == null ? [] : [var.load_balancer]
    content {
      target_group_arn = load_balancer.value.target_group_arn
      container_name   = local.main_container_name
      container_port   = load_balancer.value.container_port
    }
  }

  # lifecycle {
  #   ignore_changes = [task_definition] # safe rolling updates via new revision
  # }

  tags = { Name = "${var.service_prefix}-svc" }
}

########################################
# Application Auto-Scaling (optional)
########################################

resource "aws_appautoscaling_target" "this" {
  count              = var.autoscaling == null ? 0 : 1
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${local.cluster_name}/${aws_ecs_service.this.name}"

  min_capacity = var.autoscaling.min_capacity
  max_capacity = var.autoscaling.max_capacity
}

resource "aws_appautoscaling_policy" "this" {
  for_each = var.autoscaling == null ? {} : { for p in var.autoscaling.policies : p.name => p }

  name               = "${var.service_prefix}-${each.key}"
  service_namespace  = "ecs"
  scalable_dimension = aws_appautoscaling_target.this[0].scalable_dimension
  resource_id        = aws_appautoscaling_target.this[0].resource_id
  policy_type        = "TargetTrackingScaling"

  target_tracking_scaling_policy_configuration {
    target_value = each.value.target_value

    # Predefined metrics
    dynamic "predefined_metric_specification" {
      for_each = contains(["CPU", "MEMORY", "ALBReqCountPerTarget"], each.value.metric_type) ? [1] : []
      content {
        predefined_metric_type = lookup({
          CPU                  = "ECSServiceAverageCPUUtilization"
          MEMORY               = "ECSServiceAverageMemoryUtilization"
          ALBReqCountPerTarget = "ALBRequestCountPerTarget"
        }, each.value.metric_type)
      }
    }

    # Custom CloudWatch metric
    dynamic "customized_metric_specification" {
      for_each = each.value.metric_type == "Custom" ? [each.value.custom_metric] : []
      content {
        metric_name = customized_metric_specification.value.metric_name
        namespace   = customized_metric_specification.value.namespace
        statistic   = customized_metric_specification.value.statistic
        unit        = try(customized_metric_specification.value.unit, null)

        dynamic "dimensions" {
          for_each = [
            for k, v in customized_metric_specification.value.dimensions : { name = k, value = v }
          ]
          content {
            name  = dimensions.value.name
            value = dimensions.value.value
          }
        }
      }
    }
  }
}

###########################################################
# Alarm – service has hit max_capacity for >5 minutes
###########################################################
resource "aws_cloudwatch_metric_alarm" "ecs_maxed_out" {
  count = var.autoscaling == null ? 0 : 1

  alarm_name          = "${var.service_prefix}-ecs-max-capacity"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  period              = 300
  threshold           = var.autoscaling.max_capacity
  statistic           = "Maximum"

  metric_name = "DesiredTaskCount"
  namespace   = "AWS/ECS"
  dimensions = {
    ClusterName = local.cluster_name
    ServiceName = aws_ecs_service.this.name
  }

  alarm_description  = "ECS service reached its configured maximum capacity."
  treat_missing_data = "missing"

  alarm_actions = var.max_capacity_alarm_actions
  ok_actions    = var.max_capacity_alarm_actions
}
