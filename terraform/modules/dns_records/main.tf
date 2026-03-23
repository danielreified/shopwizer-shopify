locals {
  alb_fqdns = [for s in var.alb_subdomains : "${s}.${var.root_domain}"]
  cf_fqdns  = [for s in var.cf_subdomains : "${s}.${var.root_domain}"]
}

# ===================== ALB records =====================

# Subdomains -> ALB (A/AAAA)
resource "aws_route53_record" "alb_sub_a" {
  for_each = var.create_alb_records ? toset(local.alb_fqdns) : toset([])
  zone_id  = var.hosted_zone_id
  name     = each.value
  type     = "A"
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "alb_sub_aaaa" {
  for_each = aws_route53_record.alb_sub_a
  zone_id  = var.hosted_zone_id
  name     = each.value.name
  type     = "AAAA"
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# Apex -> ALB (A/AAAA)
resource "aws_route53_record" "alb_apex_a" {
  count   = var.create_alb_records && var.alb_point_apex ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.root_domain
  type    = "A"
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "alb_apex_aaaa" {
  count   = length(aws_route53_record.alb_apex_a) > 0 ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.root_domain
  type    = "AAAA"
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# ===================== CloudFront records =====================

# Subdomains -> CloudFront (A/AAAA)
resource "aws_route53_record" "cf_sub_a" {
  for_each = var.create_cf_records ? toset(local.cf_fqdns) : toset([])
  zone_id  = var.hosted_zone_id
  name     = each.value
  type     = "A"
  alias {
    name                   = var.cf_domain_name
    zone_id                = var.cf_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cf_sub_aaaa" {
  for_each = aws_route53_record.cf_sub_a
  zone_id  = var.hosted_zone_id
  name     = each.value.name
  type     = "AAAA"
  alias {
    name                   = var.cf_domain_name
    zone_id                = var.cf_zone_id
    evaluate_target_health = false
  }
}

# Apex -> CloudFront (A/AAAA)
resource "aws_route53_record" "cf_apex_a" {
  count   = var.create_cf_records && var.cf_point_apex ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.root_domain
  type    = "A"
  alias {
    name                   = var.cf_domain_name
    zone_id                = var.cf_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cf_apex_aaaa" {
  count   = length(aws_route53_record.cf_apex_a) > 0 ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.root_domain
  type    = "AAAA"
  alias {
    name                   = var.cf_domain_name
    zone_id                = var.cf_zone_id
    evaluate_target_health = false
  }
}
