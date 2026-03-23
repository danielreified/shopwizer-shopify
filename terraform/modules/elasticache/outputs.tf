output "primary_endpoint" {
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
  description = "Primary endpoint hostname."
}

output "reader_endpoint" {
  value       = aws_elasticache_replication_group.this.reader_endpoint_address
  description = "Reader endpoint hostname."
}

output "port" {
  value       = 6379
  description = "Redis TCP port."
}

output "security_group_id" {
  value       = aws_security_group.this.id
  description = "Security group ID used by Redis."
}

output "subnet_group_name" {
  value       = aws_elasticache_subnet_group.this.name
  description = "ElastiCache subnet group name."
}

output "replication_group_id" {
  value       = aws_elasticache_replication_group.this.id
  description = "Replication group identifier."
}
