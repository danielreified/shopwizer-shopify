resource "aws_lb_listener_rule" "this" {
  listener_arn = var.listener_arn
  priority     = var.priority

  action {
    type             = "forward"
    target_group_arn = var.target_group_arn
  }

  dynamic "condition" {
    for_each = length(var.hostnames) > 0 ? [1] : []
    content {
      host_header { values = var.hostnames }
    }
  }

  dynamic "condition" {
    for_each = length(var.paths) > 0 ? [1] : []
    content {
      path_pattern { values = var.paths }
    }
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-rule-${var.priority}" })
}
