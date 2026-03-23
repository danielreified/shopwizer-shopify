output "event_bus_name" {
  value       = aws_cloudwatch_event_bus.this.name
  description = "Name of the event bus"
}

output "event_bus_arn" {
  value       = aws_cloudwatch_event_bus.this.arn
  description = "ARN of the event bus"
}

output "rule_arns" {
  value = {
    for k, r in aws_cloudwatch_event_rule.rules : k => r.arn
  }
  description = "Map of rule name suffixes to their ARNs"
}
