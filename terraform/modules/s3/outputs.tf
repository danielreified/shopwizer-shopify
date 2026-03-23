output "bucket_id" { value = aws_s3_bucket.this.id }
output "bucket_arn" { value = aws_s3_bucket.this.arn }
output "bucket_domain_name" { value = aws_s3_bucket.this.bucket_domain_name }
output "bucket_regional_domain_name" { value = aws_s3_bucket.this.bucket_regional_domain_name }
output "versioning_enabled" { value = var.versioning_enabled }
output "kms_key_id" { value = var.kms_key_id }
