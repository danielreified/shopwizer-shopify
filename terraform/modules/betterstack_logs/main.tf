# BetterStack CloudWatch Log Forwarder
# This module creates a Lambda function that forwards CloudWatch logs to BetterStack

# Lambda execution role
resource "aws_iam_role" "lambda" {
  name = "${var.name_prefix}-betterstack-forwarder"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function
resource "aws_lambda_function" "forwarder" {
  function_name = "${var.name_prefix}-betterstack-forwarder"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 128

  # Use the BetterStack provided code - we'll download and upload it
  filename         = "${path.module}/logtail-aws-lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/logtail-aws-lambda.zip")

  environment {
    variables = {
      BETTER_STACK_ENTRYPOINT   = "https://${var.betterstack_ingesting_host}"
      BETTER_STACK_SOURCE_TOKEN = var.betterstack_source_token
    }
  }

  tags = {
    Name = "${var.name_prefix}-betterstack-forwarder"
  }
}

# Allow CloudWatch to invoke the Lambda
resource "aws_lambda_permission" "cloudwatch" {
  for_each = toset(var.log_group_names)

  statement_id  = "AllowCloudWatch-${replace(each.value, "/", "-")}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.forwarder.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:${each.value}:*"
}

# Subscription filters for each log group
resource "aws_cloudwatch_log_subscription_filter" "betterstack" {
  for_each = toset(var.log_group_names)

  name            = "betterstack-forwarder"
  log_group_name  = each.value
  filter_pattern  = "" # Empty = all logs
  destination_arn = aws_lambda_function.forwarder.arn

  depends_on = [aws_lambda_permission.cloudwatch]
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

output "lambda_function_name" {
  value = aws_lambda_function.forwarder.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.forwarder.arn
}
