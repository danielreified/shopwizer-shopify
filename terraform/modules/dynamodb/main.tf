resource "aws_dynamodb_table" "this" {
  name         = var.table_name
  billing_mode = var.billing_mode

  hash_key  = var.partition_key_name
  range_key = var.sort_key_name

  attribute {
    name = var.partition_key_name
    type = "S"
  }

  attribute {
    name = var.sort_key_name
    type = "S"
  }

  # New style: capacity at top level (only when PROVISIONED)
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  ttl {
    attribute_name = var.ttl_attribute_name
    enabled        = var.ttl_enabled
  }

  point_in_time_recovery {
    enabled = var.pitr_enabled
  }
}
