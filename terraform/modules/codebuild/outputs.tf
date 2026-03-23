############################################
# Outputs
############################################

output "project_name" {
  description = "CodeBuild project name (use this to trigger builds)"
  value       = aws_codebuild_project.migrations.name
}

output "project_arn" {
  description = "CodeBuild project ARN"
  value       = aws_codebuild_project.migrations.arn
}

output "role_arn" {
  description = "CodeBuild IAM role ARN"
  value       = aws_iam_role.codebuild.arn
}

output "security_group_id" {
  description = "CodeBuild security group ID"
  value       = aws_security_group.codebuild.id
}
