###############################################################################
# ECS Cluster (with optional Insights, Exec, and default capacity strategy)
###############################################################################

locals {
  cluster_name = coalesce(var.cluster_name, "${var.name_prefix}-ecs")
}

resource "aws_ecs_cluster" "this" {
  name = local.cluster_name

  dynamic "setting" {
    for_each = var.enable_container_insights ? [1] : []
    content {
      name  = "containerInsights"
      value = "enabled"
    }
  }

  dynamic "configuration" {
    for_each = var.enable_exec ? [1] : []
    content {
      execute_command_configuration {
        kms_key_id = var.exec_kms_key_id
        logging    = var.exec_logging
      }
    }
  }
}

###############################################################################
# Optional: attach capacity providers + set a cluster-level default strategy
###############################################################################
resource "aws_ecs_cluster_capacity_providers" "this" {
  count        = length(var.default_capacity_provider_strategy) == 0 ? 0 : 1
  cluster_name = aws_ecs_cluster.this.name

  capacity_providers = distinct([
    for s in var.default_capacity_provider_strategy : s.capacity_provider
  ])

  dynamic "default_capacity_provider_strategy" {
    for_each = var.default_capacity_provider_strategy
    content {
      capacity_provider = default_capacity_provider_strategy.value.capacity_provider
      weight            = try(default_capacity_provider_strategy.value.weight, null)
      base              = try(default_capacity_provider_strategy.value.base, null)
    }
  }
}
