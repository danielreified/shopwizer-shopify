############################################
# EventBridge Rule → SQS Target (with role)
############################################

resource "aws_cloudwatch_event_rule" "this" {
  name        = var.rule_name
  description = var.description
  tags        = var.tags

  # Allow either an event pattern or a schedule expression (one or the other)
  event_bus_name      = var.event_bus_name
  event_pattern       = var.event_pattern_json
  schedule_expression = var.schedule
}

# IAM role EventBridge will assume to send to SQS
data "aws_iam_policy_document" "evb_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "evb_to_sqs" {
  name               = coalesce(var.role_name, "${var.rule_name}-evb-to-sqs")
  assume_role_policy = data.aws_iam_policy_document.evb_assume.json
  tags               = var.tags
}

# Allow SendMessage to the SQS target
data "aws_iam_policy_document" "evb_to_sqs_policy" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [var.queue_arn]
  }
}

resource "aws_iam_role_policy" "evb_to_sqs_inline" {
  role   = aws_iam_role.evb_to_sqs.id
  policy = data.aws_iam_policy_document.evb_to_sqs_policy.json
}

resource "aws_cloudwatch_event_target" "sqs" {
  rule           = aws_cloudwatch_event_rule.this.name
  event_bus_name = var.event_bus_name
  arn            = var.queue_arn
  role_arn       = aws_iam_role.evb_to_sqs.arn

  # Optional JSON payload for SQS messages
  input = var.message_body

  # Automatically attach SqsParameters only for FIFO queues
  dynamic "sqs_target" {
    for_each = endswith(var.queue_arn, ".fifo") ? [1] : []
    content {
      message_group_id = "default"
    }
  }
}
