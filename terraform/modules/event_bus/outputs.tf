output "event_bus_name" {
  value       = var.create ? aws_cloudwatch_event_bus.this[0].name : data.aws_cloudwatch_event_bus.this.name
  description = "Event bus name."
}

output "event_bus_arn" {
  value       = var.create ? aws_cloudwatch_event_bus.this[0].arn : data.aws_cloudwatch_event_bus.this.arn
  description = "Event bus ARN."
}
