#########################################
# Singular CloudWatch Log Group
#########################################

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/${var.name_prefix}/${var.name}"
  retention_in_days = var.retention_in_days
  kms_key_id        = var.kms_key_id
  log_group_class   = var.log_group_class # STANDARD | INFREQUENT_ACCESS (optional)

  lifecycle {
    prevent_destroy = var.prevent_destroy
  }
}
