resource "aws_lb_target_group" "this" {
  name        = "${var.name_prefix}-${var.service_name}-tg"
  port        = var.port
  protocol    = var.protocol
  vpc_id      = var.vpc_id
  target_type = var.target_type

  health_check {
    path                = var.health_check_path
    port                = var.health_check_port != null ? var.health_check_port : tostring(var.port)
    matcher             = var.health_check_matcher
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy
    unhealthy_threshold = var.health_check_unhealthy
  }

  deregistration_delay = var.deregistration_delay
  slow_start           = var.slow_start

  stickiness {
    enabled         = var.stickiness_enabled
    type            = "lb_cookie"
    cookie_duration = var.stickiness_cookie_duration
  }
}
