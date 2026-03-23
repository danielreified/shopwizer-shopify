locals {
  # Convert the list into a map[name_suffix → rule_obj] for for_each
  rules_map = {
    for r in var.rules :
    r.name_suffix => r
  }
}

##################################
# 1) Event bus (always)
##################################
resource "aws_cloudwatch_event_bus" "this" {
  name = "${var.name_prefix}-event-bus"

  tags = {
    Name = "${var.name_prefix}-event-bus"
  }
}

##################################
# 2) Optional archive
##################################
resource "aws_cloudwatch_event_archive" "this" {
  count            = var.enable_archive ? 1 : 0
  name             = "${var.name_prefix}-archive"
  event_source_arn = aws_cloudwatch_event_bus.this.arn
  retention_days   = var.archive_retention_days
  description      = "Archive for ${var.name_prefix} Event Bus"
}

##################################
# 3) Rules & targets (all entries)
##################################
resource "aws_cloudwatch_event_rule" "rules" {
  for_each       = local.rules_map
  name           = "${var.name_prefix}-${each.key}-rule"
  event_bus_name = aws_cloudwatch_event_bus.this.name
  event_pattern  = jsonencode(each.value.event_pattern)

  tags = {
    Name = "${var.name_prefix}-${each.key}-rule"
  }
}

# IAM role for EventBridge to send to SQS
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
  for_each           = local.rules_map
  name               = "${var.name_prefix}-${each.key}-evb-to-sqs"
  assume_role_policy = data.aws_iam_policy_document.evb_assume.json

  tags = {
    Name = "${var.name_prefix}-${each.key}-evb-to-sqs"
  }
}

data "aws_iam_policy_document" "evb_to_sqs_policy" {
  for_each = local.rules_map

  statement {
    actions   = ["sqs:SendMessage"]
    resources = [each.value.queue_arn]
  }
}

resource "aws_iam_role_policy" "evb_to_sqs_inline" {
  for_each = local.rules_map
  role     = aws_iam_role.evb_to_sqs[each.key].id
  policy   = data.aws_iam_policy_document.evb_to_sqs_policy[each.key].json
}

resource "aws_cloudwatch_event_target" "targets" {
  for_each       = local.rules_map
  rule           = aws_cloudwatch_event_rule.rules[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.this.name
  arn            = each.value.queue_arn
  target_id      = "${each.key}-sqs-target"
  role_arn       = aws_iam_role.evb_to_sqs[each.key].arn

  # Automatically attach SqsParameters only for FIFO queues
  dynamic "sqs_target" {
    for_each = endswith(each.value.queue_arn, ".fifo") ? [1] : []
    content {
      message_group_id = coalesce(lookup(each.value, "message_group_id", null), "default")
    }
  }
}
