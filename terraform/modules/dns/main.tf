########################
# Locals
########################
locals {
  vpn_fqdn = "vpn-${var.name_prefix}.${var.root_domain}"
}

########################
# Hosted zone lookup
########################
data "aws_route53_zone" "root" {
  name         = var.root_domain
  private_zone = false
}

########################
# 1) Root + wildcard cert (regional)
########################
resource "aws_acm_certificate" "root" {
  domain_name               = var.root_domain
  subject_alternative_names = ["*.${var.root_domain}"]
  validation_method         = "DNS"
}

resource "aws_route53_record" "root_validation" {
  for_each = {
    for dvo in aws_acm_certificate.root.domain_validation_options :
    dvo.domain_name => dvo
  }

  zone_id         = data.aws_route53_zone.root.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  ttl             = var.validation_record_ttl
  records         = [each.value.resource_record_value]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "root" {
  certificate_arn         = aws_acm_certificate.root.arn
  validation_record_fqdns = [for r in aws_route53_record.root_validation : r.fqdn]
}

########################
# 2) VPN leaf cert (optional)
########################
resource "aws_acm_certificate" "vpn" {
  count             = var.create_vpn_cert ? 1 : 0
  domain_name       = local.vpn_fqdn
  validation_method = "DNS"
}

resource "aws_route53_record" "vpn_validation" {
  for_each = var.create_vpn_cert ? {
    for dvo in aws_acm_certificate.vpn[0].domain_validation_options :
    dvo.domain_name => dvo
  } : {}

  zone_id         = data.aws_route53_zone.root.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  ttl             = var.validation_record_ttl
  records         = [each.value.resource_record_value]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "vpn" {
  count = var.create_vpn_cert ? 1 : 0

  certificate_arn         = aws_acm_certificate.vpn[0].arn
  validation_record_fqdns = [for r in aws_route53_record.vpn_validation : r.fqdn]
}

########################
# 3) A-record ALIAS(es) → ALB (always created)
########################

# Apex/root -> ALB
resource "aws_route53_record" "root_alias" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = var.root_domain
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# subdomain -> ALB (A records)
resource "aws_route53_record" "subdomain_aliases" {
  for_each = toset(var.subdomain_aliases)

  zone_id = data.aws_route53_zone.root.zone_id
  name    = "${each.value}.${var.root_domain}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}
