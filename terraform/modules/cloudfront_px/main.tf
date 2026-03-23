############################################
# CloudFront Pixel — main
############################################

# Constants / opinions
locals {
  subdomain      = "px"
  fqdn           = "${local.subdomain}.${var.root_domain}"
  logging_prefix = "px/"
  price_class    = "PriceClass_100"
}

# Cache policy
data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

############################################
# 1) Asset bucket (hosts the 1x1 GIF)
############################################

resource "aws_s3_bucket" "asset" {
  bucket = "${var.name_prefix}-px-assets"
}

resource "aws_s3_bucket_ownership_controls" "asset" {
  bucket = aws_s3_bucket.asset.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

# 1x1 transparent GIF (embedded)
resource "aws_s3_object" "pixel_gif" {
  bucket         = aws_s3_bucket.asset.id
  key            = "i.gif"
  content_base64 = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
  content_type   = "image/gif"
}

############################################
# 2) Logs bucket (for CloudFront access logs)
############################################

resource "aws_s3_bucket" "logs" {
  bucket = "${var.name_prefix}-cf-logs-px"
}

resource "aws_s3_bucket" "processed" {
  bucket = "${var.name_prefix}-cf-logs-px-processed"
}

resource "aws_s3_bucket" "archived" {
  bucket = "${var.name_prefix}-cf-logs-px-archived"
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    # For CF standard logging we must allow ACLs
    object_ownership = "BucketOwnerPreferred"
  }
}

# Required for CF standard logs (sets WRITE + READ_ACP to the log-delivery group)
resource "aws_s3_bucket_acl" "logs" {
  bucket = aws_s3_bucket.logs.id
  acl    = "log-delivery-write"
}

# Do NOT block ACL usage on this bucket
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = false # must be false for ACL-based writes
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

############################################
# 3) CloudFront (S3 origin + OAC, TTL=0, logging enabled)
############################################

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.name_prefix}-px-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Asset bucket regional domain (for CF origin)
data "aws_s3_bucket" "asset_lookup" {
  bucket = aws_s3_bucket.asset.bucket
}

locals {
  asset_regional_domain = data.aws_s3_bucket.asset_lookup.bucket_regional_domain_name
}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  price_class     = local.price_class
  aliases         = [local.fqdn]

  origin {
    origin_id                = "s3-px"
    domain_name              = local.asset_regional_domain
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id

    connection_attempts = 3
    connection_timeout  = 10

    # s3_origin_config { origin_access_identity = "" } # Removed to prevent drift with OAC
  }



  default_root_object = "i.gif"

  default_cache_behavior {
    target_origin_id       = "s3-px"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
  }

  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_regional_domain_name
    include_cookies = false
    prefix          = local.logging_prefix
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  # make sure ACL + ownership controls exist before CF tries to write logs
  depends_on = [
    aws_s3_bucket_ownership_controls.logs,
    aws_s3_bucket_acl.logs,
    aws_s3_bucket_public_access_block.logs
  ]
}

############################################
# 4) Bucket policy (OAC read of asset bucket)
############################################

# Allow CF (OAC) to READ the gif from asset bucket (scoped by SourceArn)
data "aws_iam_policy_document" "asset_read" {
  statement {
    sid = "AllowCloudFrontAccessViaOAC"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.asset.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "asset_read" {
  bucket = aws_s3_bucket.asset.id
  policy = data.aws_iam_policy_document.asset_read.json
}

############################################
# 5) DNS (Route53 alias)
############################################

resource "aws_route53_record" "alias" {
  zone_id = var.hosted_zone_id
  name    = local.fqdn
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

# NOTE:
# - No logs bucket policy here (CloudFront standard logging doesn't need one and
#   adding a principal causes "Invalid principal in policy").
# - Do S3 -> SQS notifications in the ROOT stack so you can depend_on the queue policy.
