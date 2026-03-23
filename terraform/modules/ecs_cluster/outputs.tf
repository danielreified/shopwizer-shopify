output "cluster_id" {
  value       = aws_ecs_cluster.this.id
  description = "ECS cluster ID"
}

output "cluster_arn" {
  value       = aws_ecs_cluster.this.arn
  description = "ECS cluster ARN"
}

output "cluster_name" {
  value       = aws_ecs_cluster.this.name
  description = "ECS cluster name"
}

output "container_insights_enabled" {
  value       = var.enable_container_insights
  description = "Whether Container Insights is enabled"
}

output "exec_enabled" {
  value       = var.enable_exec
  description = "Whether ECS Exec is configured"
}

output "attached_capacity_providers" {
  value       = try(aws_ecs_cluster_capacity_providers.this[0].capacity_providers, [])
  description = "Capacity providers attached at cluster level (if any)"
}

output "default_capacity_provider_strategy" {
  value       = var.default_capacity_provider_strategy
  description = "Cluster-level default capacity provider strategy (echoed input)"
}
