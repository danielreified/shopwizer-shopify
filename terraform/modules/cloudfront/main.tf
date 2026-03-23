############################################
# CloudFront Distribution (API)
############################################

locals {
  # If you pass a cache_policy_id we use it; otherwise we create one here.
  effective_cache_policy_id = coalesce(
    var.cache_policy_id,
    try(aws_cloudfront_cache_policy.this[0].id, null)
  )
}

# Optional Cache Policy (created only if you didn't pass one)
resource "aws_cloudfront_cache_policy" "this" {
  count   = var.cache_policy_id == null ? 1 : 0
  name    = "${var.name_prefix}-cache"
  comment = "Cache policy for ${var.name_prefix}"

  default_ttl = var.cache_ttl_seconds
  max_ttl     = var.cache_ttl_seconds
  min_ttl     = var.cache_ttl_seconds

  parameters_in_cache_key_and_forwarded_to_origin {
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Host"]
      }
    }
    cookies_config { cookie_behavior = "none" }
    query_strings_config { query_string_behavior = "none" }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Cache policies for each behavior (created only when no custom policy_id is provided)
resource "aws_cloudfront_cache_policy" "behaviors" {
  for_each = { for idx, b in var.cache_behaviors : idx => b if b.cache_policy_id == null }

  name    = "${var.name_prefix}-cache-${each.key}"
  comment = "Cache policy for ${each.value.path_pattern}"

  default_ttl = each.value.ttl_seconds
  max_ttl     = each.value.ttl_seconds
  min_ttl     = each.value.ttl_seconds

  parameters_in_cache_key_and_forwarded_to_origin {
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Host"]
      }
    }
    cookies_config { cookie_behavior = "none" }
    query_strings_config { query_string_behavior = "none" }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = var.comment
  aliases         = var.aliases

  origin {
    domain_name = var.origin_domain_name
    origin_id   = "${var.name_prefix}-origin"

    custom_origin_config {
      http_port              = var.origin_http_port
      https_port             = var.origin_https_port
      origin_protocol_policy = var.origin_protocol_policy # https-only
      origin_ssl_protocols   = var.origin_ssl_protocols   # ["TLSv1.2"]
    }
  }

  default_root_object = ""

  default_cache_behavior {
    target_origin_id       = "${var.name_prefix}-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = local.effective_cache_policy_id

    dynamic "function_association" {
      for_each = var.viewer_request_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = var.viewer_request_function_arn
      }
    }
  }

  # Multiple ordered cache behaviors for per-route TTLs
  dynamic "ordered_cache_behavior" {
    for_each = var.cache_behaviors
    content {
      path_pattern           = ordered_cache_behavior.value.path_pattern
      target_origin_id       = "${var.name_prefix}-origin"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ordered_cache_behavior.value.allowed_methods
      cached_methods         = ordered_cache_behavior.value.cached_methods
      cache_policy_id = (
        ordered_cache_behavior.value.cache_policy_id != null
        ? ordered_cache_behavior.value.cache_policy_id
        : aws_cloudfront_cache_policy.behaviors[ordered_cache_behavior.key].id
      )

      dynamic "function_association" {
        for_each = (
          var.viewer_request_function_arn != null && ordered_cache_behavior.value.enable_function
        ) ? [1] : []
        content {
          event_type   = "viewer-request"
          function_arn = var.viewer_request_function_arn
        }
      }
    }
  }

  # Legacy single path_pattern behavior (backwards compatibility)
  dynamic "ordered_cache_behavior" {
    for_each = var.path_pattern != null && length(var.cache_behaviors) == 0 ? [var.path_pattern] : []
    content {
      path_pattern           = ordered_cache_behavior.value
      target_origin_id       = "${var.name_prefix}-origin"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD"]
      cached_methods         = ["GET", "HEAD"]
      cache_policy_id        = local.effective_cache_policy_id

      dynamic "function_association" {
        for_each = var.viewer_request_function_arn == null ? [] : [1]
        content {
          event_type   = "viewer-request"
          function_arn = var.viewer_request_function_arn
        }
      }
    }
  }

  # Logging (bucket must exist + have proper bucket policy)
  dynamic "logging_config" {
    for_each = var.logging_bucket_domain_name == null ? [] : [1]
    content {
      bucket          = var.logging_bucket_domain_name
      include_cookies = var.logging_include_cookies
      prefix          = var.logging_prefix
    }
  }

  price_class = var.price_class

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type # none | whitelist | blacklist
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn # must be us-east-1
    ssl_support_method       = "sni-only"
    minimum_protocol_version = var.viewer_min_tls
  }

  web_acl_id = var.web_acl_arn

  tags = var.tags
}
