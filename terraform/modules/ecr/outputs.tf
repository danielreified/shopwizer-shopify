output "repository_name" {
  description = "The name of the ECR repository"
  value       = aws_ecr_repository.this.name
}

output "repository_arn" {
  description = "The ARN of the ECR repository"
  value       = aws_ecr_repository.this.arn
}

output "repository_url" {
  description = "The repository URI (for ECS container images)"
  value       = aws_ecr_repository.this.repository_url
}
