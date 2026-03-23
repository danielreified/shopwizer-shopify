output "alb_record_names" {
  description = "All ALB-backed record names created"
  value = concat(
    [for r in aws_route53_record.alb_sub_a : r.name],
    length(aws_route53_record.alb_apex_a) > 0 ? [aws_route53_record.alb_apex_a[0].name] : []
  )
}

output "cf_record_names" {
  description = "All CloudFront-backed record names created"
  value = concat(
    [for r in aws_route53_record.cf_sub_a : r.name],
    length(aws_route53_record.cf_apex_a) > 0 ? [aws_route53_record.cf_apex_a[0].name] : []
  )
}
