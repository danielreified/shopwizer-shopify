output "function_name" {
  description = "Lambda function name."
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "Lambda function ARN."
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "Lambda invoke ARN."
  value       = aws_lambda_function.this.invoke_arn
}

output "version" {
  description = "Published version (if publish=true)."
  value       = aws_lambda_function.this.version
}

output "qualified_arn" {
  description = "Qualified ARN pointing to the published version."
  value       = aws_lambda_function.this.qualified_arn
}

output "execution_role_arn" {
  description = "Execution role ARN created by this module."
  value       = aws_iam_role.exec.arn
}
