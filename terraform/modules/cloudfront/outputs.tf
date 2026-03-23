output "distribution_id" { value = aws_cloudfront_distribution.this.id }
output "distribution_arn" { value = aws_cloudfront_distribution.this.arn }
output "distribution_domain_name" { value = aws_cloudfront_distribution.this.domain_name }
output "hosted_zone_id" { value = aws_cloudfront_distribution.this.hosted_zone_id }
output "cache_policy_id" { value = local.effective_cache_policy_id }
