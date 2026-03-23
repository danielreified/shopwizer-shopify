############################################
# CloudFront Function: HMAC verification
############################################

# Fetch secret from Secrets Manager if ARN is provided
data "aws_secretsmanager_secret_version" "this" {
  count     = var.secrets_arn != null ? 1 : 0
  secret_id = var.secrets_arn
}

locals {
  # Get secret value from Secrets Manager or use direct value
  secret_json = var.secrets_arn != null ? jsondecode(data.aws_secretsmanager_secret_version.this[0].secret_string) : null

  # Priority: secrets_arn > direct value
  shared_secret = var.secrets_arn != null ? local.secret_json[var.secrets_key] : var.shopify_shared_secret

  rendered_code = templatefile("${path.module}/hmac-viewer-request.js.tftpl", {
    shared_secret_json = jsonencode(local.shared_secret)
  })
}

resource "aws_cloudfront_function" "this" {
  name    = "${var.name_prefix}-hmac-check"
  comment = var.comment
  runtime = "cloudfront-js-2.0"
  publish = var.publish
  code    = local.rendered_code
}

