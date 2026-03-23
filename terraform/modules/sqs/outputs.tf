output "queue_name" {
  value = aws_sqs_queue.main.name
}

output "queue_url" {
  value = aws_sqs_queue.main.url
}

output "queue_arn" {
  value = aws_sqs_queue.main.arn
}

output "dlq_name" {
  value = try(aws_sqs_queue.dlq[0].name, null)
}

output "dlq_arn" {
  value = try(aws_sqs_queue.dlq[0].arn, null)
}
