output "zone_id" {
  value       = data.aws_route53_zone.root.zone_id
  description = "Hosted zone ID for the root domain."
}

output "root_certificate_arn" {
  value       = aws_acm_certificate.root.arn
  description = "ARN of the root+wildcard ACM certificate (regional)."
}

output "vpn_certificate_arn" {
  value       = try(aws_acm_certificate.vpn[0].arn, null)
  description = "ARN of the VPN leaf certificate (regional), if created."
}

output "root_alias_fqdn" {
  value       = aws_route53_record.root_alias.fqdn
  description = "Apex A-ALIAS FQDN pointing to ALB."
}

output "subdomain_alias_fqdns" {
  value       = [for r in values(aws_route53_record.subdomain_aliases) : r.fqdn]
  description = "List of subdomain A-ALIAS FQDNs pointing to ALB."
}
