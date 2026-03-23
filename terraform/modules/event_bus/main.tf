locals {
  bus_name = var.event_source_name != null ? var.event_source_name : var.name
}

# Simple validation: we must know what to look for/create
locals {
  _validate_inputs = (
    (var.event_source_name != null || var.name != null)
    ? true
    : throw("event_bus: you must set either event_source_name (partner) or name (custom).")
  )
}

resource "aws_cloudwatch_event_bus" "this" {
  count             = var.create ? 1 : 0
  name              = local.bus_name
  event_source_name = var.event_source_name
}

data "aws_cloudwatch_event_bus" "this" {
  name = local.bus_name
}
