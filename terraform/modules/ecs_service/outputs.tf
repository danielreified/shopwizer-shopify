output "service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.this.name
}

output "service_arn" {
  description = "ECS service ARN."
  value       = aws_ecs_service.this.arn
}

output "task_definition_arn" {
  description = "Latest task definition revision ARN."
  value       = aws_ecs_task_definition.this.arn
}

output "task_role_arn" {
  description = "IAM task role ARN used by the task."
  value       = aws_iam_role.task.arn
}

output "execution_role_arn" {
  description = "IAM execution role ARN used by the task."
  value       = aws_iam_role.execution.arn
}

output "autoscaling_target_id" {
  description = "App Auto Scaling resource-id (null if autoscaling disabled)."
  value       = try(aws_appautoscaling_target.this[0].resource_id, null)
}
