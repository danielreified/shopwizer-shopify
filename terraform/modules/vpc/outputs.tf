output "vpc_id" { value = aws_vpc.this.id }
output "internet_gateway_id" { value = aws_internet_gateway.this.id }

output "public_subnet_ids" {
  value = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "private_subnet_ids" {
  value = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "public_route_table_id" { value = aws_route_table.public.id }
output "private_route_table_id" { value = aws_route_table.private.id }

output "nat_gateway_id" { value = try(aws_nat_gateway.this[0].id, null) }
output "nat_eip_allocation_id" { value = try(aws_eip.nat[0].id, null) }

output "s3_gateway_endpoint_id" { value = try(aws_vpc_endpoint.s3[0].id, null) }
output "dynamodb_gateway_endpoint_id" { value = try(aws_vpc_endpoint.dynamodb[0].id, null) }
