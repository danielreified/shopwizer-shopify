############################################
# CloudFront (S3 origin + OAC)
############################################

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

locals {
  effective_cache_policy_id = coalesce(
    var.cache_policy_id,
    data.aws_cloudfront_cache_policy.caching_optimized.id
  )
}

# ---------- OAC ----------
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.name_prefix}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------- Bucket Policy (fixed) ----------
data "aws_iam_policy_document" "allow_cf_oac" {
  statement {
    sid     = "AllowCloudFrontAccessViaOAC"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    resources = ["${var.s3_bucket_arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values = [
        "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.this.id}"
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "allow_cf_oac" {
  bucket = var.s3_bucket_id
  policy = data.aws_iam_policy_document.allow_cf_oac.json
}

# ---------- Distribution ----------
resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  price_class     = var.price_class
  aliases         = var.aliases

  default_root_object = var.default_root_object

  origin {
    origin_id                = "s3-site"
    domain_name              = var.s3_bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id

    connection_attempts = 3
    connection_timeout  = 10

    # Explicitly set to 0 to stop Terraform drift (AWS API returns 0)
    # response_completion_timeout = 0 # Invalid for S3, checking if ignore_changes is better

    # s3_origin_config {
    #   origin_access_identity = ""
    # }
  }



  default_cache_behavior {
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = local.effective_cache_policy_id
  }

  # SPA fallback (optional)
  dynamic "custom_error_response" {
    for_each = var.enable_spa_fallback ? [404, 403] : []
    content {
      error_code            = custom_error_response.value
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 0
    }
  }

  # Access logging (optional)
  dynamic "logging_config" {
    for_each = var.logging_bucket_domain_name == null ? [] : [1]
    content {
      bucket          = var.logging_bucket_domain_name
      include_cookies = var.logging_include_cookies
      prefix          = var.logging_prefix
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
