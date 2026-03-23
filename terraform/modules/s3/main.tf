############################################
# Singular S3 Bucket
############################################

locals {
  merged_tags = merge({ Module = "s3_bucket", Name = var.bucket_name }, var.tags)

  lifecycle_enabled = (
    var.transition_to_ia_days != null ||
    var.transition_to_deep_archive_days != null ||
    var.expire_days != null ||
    (var.versioning_enabled && (
      var.noncurrent_to_ia_days != null ||
      var.noncurrent_to_deep_archive_days != null ||
      var.noncurrent_expire_days != null
    ))
  )
}

resource "aws_s3_bucket" "this" {
  bucket        = var.bucket_name
  force_destroy = var.force_destroy
  tags          = local.merged_tags
}

# Strongly recommended with the AWS provider v5+: disable ACLs
resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id
  rule { object_ownership = var.object_ownership } # "BucketOwnerEnforced" by default
}

# Block public access (defaults to fully blocked)
resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = var.block_public_acls
  block_public_policy     = var.block_public_policy
  ignore_public_acls      = var.ignore_public_acls
  restrict_public_buckets = var.restrict_public_buckets
}

# Versioning
resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  versioning_configuration { status = var.versioning_enabled ? "Enabled" : "Suspended" }
}

# Default encryption (SSE-S3 by default; switch to KMS if kms_key_id is set)
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_id == null ? "AES256" : "aws:kms"
      kms_master_key_id = var.kms_key_id
    }
    bucket_key_enabled = var.kms_key_id != null ? var.bucket_key_enabled : null
  }
}

# (Optional) Server access logging
resource "aws_s3_bucket_logging" "this" {
  count  = var.logging == null ? 0 : 1
  bucket = aws_s3_bucket.this.id

  target_bucket = var.logging.target_bucket
  target_prefix = var.logging.target_prefix
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count  = local.lifecycle_enabled ? 1 : 0
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "standard-transitions-expiration"
    status = "Enabled"

    # NEW: required by provider — apply to all objects
    filter {}

    dynamic "transition" {
      for_each = var.transition_to_ia_days == null ? [] : [var.transition_to_ia_days]
      content {
        days          = transition.value
        storage_class = "STANDARD_IA"
      }
    }

    dynamic "transition" {
      for_each = var.transition_to_deep_archive_days == null ? [] : [var.transition_to_deep_archive_days]
      content {
        days          = transition.value
        storage_class = "DEEP_ARCHIVE"
      }
    }

    dynamic "expiration" {
      for_each = var.expire_days == null ? [] : [var.expire_days]
      content { days = expiration.value }
    }

    dynamic "noncurrent_version_transition" {
      for_each = (var.versioning_enabled && var.noncurrent_to_ia_days != null) ? [var.noncurrent_to_ia_days] : []
      content {
        noncurrent_days = noncurrent_version_transition.value
        storage_class   = "STANDARD_IA"
      }
    }

    dynamic "noncurrent_version_transition" {
      for_each = (var.versioning_enabled && var.noncurrent_to_deep_archive_days != null) ? [var.noncurrent_to_deep_archive_days] : []
      content {
        noncurrent_days = noncurrent_version_transition.value
        storage_class   = "DEEP_ARCHIVE"
      }
    }

    dynamic "noncurrent_version_expiration" {
      for_each = (var.versioning_enabled && var.noncurrent_expire_days != null) ? [var.noncurrent_expire_days] : []
      content { noncurrent_days = noncurrent_version_expiration.value }
    }
  }
}

# (Optional) CORS
resource "aws_s3_bucket_cors_configuration" "this" {
  count  = length(var.cors_rules) == 0 ? 0 : 1
  bucket = aws_s3_bucket.this.id

  dynamic "cors_rule" {
    for_each = var.cors_rules
    content {
      allowed_methods = cors_rule.value.allowed_methods
      allowed_origins = cors_rule.value.allowed_origins
      allowed_headers = try(cors_rule.value.allowed_headers, null)
      expose_headers  = try(cors_rule.value.expose_headers, null)
      max_age_seconds = try(cors_rule.value.max_age_seconds, null)
    }
  }
}

# (Optional) Bucket policy
# If you pass bucket_policy_json, we attach exactly that.
# Else, if enforce_ssl_only = true, attach a "Deny non-SSL" policy.
data "aws_iam_policy_document" "enforce_ssl" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    resources = [
      aws_s3_bucket.this.arn,
      "${aws_s3_bucket.this.arn}/*",
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  count  = (var.bucket_policy_json != null || var.enforce_ssl_only) ? 1 : 0
  bucket = aws_s3_bucket.this.id
  policy = var.bucket_policy_json != null ? var.bucket_policy_json : data.aws_iam_policy_document.enforce_ssl.json
}
