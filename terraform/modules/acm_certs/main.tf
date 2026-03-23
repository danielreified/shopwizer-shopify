# Hosted zone for DNS validation
data "aws_route53_zone" "root" {
  name         = var.root_domain
  private_zone = false
}

locals {
  san_list = length(var.san_names) > 0 ? var.san_names : ["*.${var.root_domain}"]
}

# One regional cert (we're in us-east-1 already)
resource "aws_acm_certificate" "cert" {
  domain_name               = var.root_domain
  subject_alternative_names = local.san_list
  validation_method         = "DNS"
}

resource "aws_route53_record" "validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.domain_name => dvo
  }
  zone_id         = data.aws_route53_zone.root.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  ttl             = var.validation_record_ttl
  records         = [each.value.resource_record_value]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]
}

# Optional safety: enforce running this module only in us-east-1
# (Uncomment if helpful)
# data "aws_region" "current" {}
# resource "null_resource" "guard" {
#   lifecycle {
#     precondition {
#       condition     = data.aws_region.current.name == "us-east-1"
#       error_message = "acm_certs module is intended for us-east-1 only."
#     }
#   }
# }
