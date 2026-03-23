############################################
# CloudFront Pixel — outputs
############################################

output "distribution_id" {
  value = aws_cloudfront_distribution.this.id
}

output "distribution_domain_name" {
  value = aws_cloudfront_distribution.this.domain_name
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.this.arn
}

output "hosted_zone_id" {
  value = aws_cloudfront_distribution.this.hosted_zone_id
}

output "logs_bucket_arn" {
  value = aws_s3_bucket.logs.arn
}

output "logs_bucket_id" {
  description = "S3 bucket name for CF access logs"
  value       = aws_s3_bucket.logs.id
}

output "processed_bucket_id" {
  description = "S3 bucket name for processed analytics data"
  value       = aws_s3_bucket.processed.id
}

output "archived_bucket_id" {
  description = "S3 bucket name for archived data"
  value       = aws_s3_bucket.archived.id
}
output "processed_bucket_arn" {
  description = "S3 bucket ARN for processed analytics data"
  value       = aws_s3_bucket.processed.arn
}

output "archived_bucket_arn" {
  description = "S3 bucket ARN for archived data"
  value       = aws_s3_bucket.archived.arn
}
