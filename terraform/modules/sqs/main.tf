locals {
  base_name = var.base_name
  main_name = var.is_fifo ? "${local.base_name}-queue.fifo" : "${local.base_name}-queue"
  dlq_name  = var.is_fifo ? "${local.base_name}-dlq.fifo" : "${local.base_name}-dlq"

  # Auto-detect eventbridge integration
  auto_attach_eventbridge = var.is_fifo && var.allow_eventbridge
  auto_eventbridge_rule   = "${local.base_name}-rule"
}

##################################################
# Dead-letter queue (optional)
##################################################
resource "aws_sqs_queue" "dlq" {
  count = var.create_dlq ? 1 : 0

  name              = local.dlq_name
  kms_master_key_id = var.kms_master_key_id

  message_retention_seconds  = var.dlq_message_retention_seconds
  visibility_timeout_seconds = var.dlq_visibility_timeout_seconds
  receive_wait_time_seconds  = var.dlq_receive_wait_time_seconds
  delay_seconds              = var.dlq_delay_seconds
  max_message_size           = var.dlq_max_message_size

  fifo_queue                  = var.is_fifo
  content_based_deduplication = var.is_fifo && var.content_based_deduplication
  deduplication_scope         = var.is_fifo && var.deduplication_scope != null ? var.deduplication_scope : null
  fifo_throughput_limit       = var.is_fifo && var.fifo_throughput_limit != null ? var.fifo_throughput_limit : null
}

##################################################
# Main queue
##################################################
resource "aws_sqs_queue" "main" {
  name              = local.main_name
  kms_master_key_id = var.kms_master_key_id

  redrive_policy = var.create_dlq ? jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[0].arn
    maxReceiveCount     = var.max_receive_count
  }) : null

  message_retention_seconds  = var.message_retention_seconds
  visibility_timeout_seconds = var.visibility_timeout_seconds
  receive_wait_time_seconds  = var.receive_wait_time_seconds
  delay_seconds              = var.delay_seconds
  max_message_size           = var.max_message_size

  fifo_queue                  = var.is_fifo
  content_based_deduplication = var.is_fifo && var.content_based_deduplication
  deduplication_scope         = var.is_fifo && var.deduplication_scope != null ? var.deduplication_scope : null
  fifo_throughput_limit       = var.is_fifo && var.fifo_throughput_limit != null ? var.fifo_throughput_limit : null
}

##################################################
# Allow EventBridge -> SQS
##################################################
data "aws_iam_policy_document" "eventbridge_to_sqs" {
  count = var.allow_eventbridge ? 1 : 0

  statement {
    sid    = "AllowEventBridgeSendMessage"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.main.arn]
  }
}

resource "aws_sqs_queue_policy" "eventbridge_allow" {
  count     = var.allow_eventbridge ? 1 : 0
  queue_url = aws_sqs_queue.main.url
  policy    = data.aws_iam_policy_document.eventbridge_to_sqs[0].json
}

##################################################
# Automatic EventBridge Rule + Target (FIFO safe)
##################################################
resource "aws_cloudwatch_event_rule" "auto" {
  count = local.auto_attach_eventbridge ? 1 : 0

  name        = local.auto_eventbridge_rule
  description = "Auto rule to forward partner/product events to ${local.base_name}"
  event_pattern = jsonencode({
    "source" : ["aws.partner/shopify.com/123456789"],
    "detail-type" : ["Shopify Product Event"]
  })
}

resource "aws_iam_role" "eventbridge_to_sqs" {
  count = local.auto_attach_eventbridge ? 1 : 0

  name = "${local.base_name}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "eventbridge_to_sqs" {
  count = local.auto_attach_eventbridge ? 1 : 0

  name = "${local.base_name}-eventbridge-policy"
  role = aws_iam_role.eventbridge_to_sqs[0].id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.main.arn
    }]
  })
}

resource "aws_cloudwatch_event_target" "fifo_default_group" {
  count = local.auto_attach_eventbridge ? 1 : 0

  rule     = aws_cloudwatch_event_rule.auto[0].name
  arn      = aws_sqs_queue.main.arn
  role_arn = aws_iam_role.eventbridge_to_sqs[0].arn

  sqs_target {
    message_group_id = "default"
  }
}
