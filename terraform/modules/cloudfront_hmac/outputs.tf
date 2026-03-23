output "function_name" {
  description = "CloudFront Function name."
  value       = aws_cloudfront_function.this.name
}

output "function_arn" {
  description = "CloudFront Function ARN (use in distribution function_association)."
  value       = aws_cloudfront_function.this.arn
}

output "status" {
  description = "Function status (e.g., LIVE)."
  value       = aws_cloudfront_function.this.status
}
