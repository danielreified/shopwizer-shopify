output "zone_id" {
  description = "Hosted Zone ID used for DNS validation"
  value       = data.aws_route53_zone.root.zone_id
}

output "regional_cert_arn" {
  description = "Certificate ARN in us-east-1 (use for ALB)"
  value       = aws_acm_certificate_validation.cert.certificate_arn
}

output "cloudfront_cert_arn" {
  description = "Certificate ARN in us-east-1 (use for CloudFront)"
  value       = aws_acm_certificate_validation.cert.certificate_arn
}
