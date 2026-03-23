output "cluster_id" {
  value = aws_rds_cluster.aurora.id
}

output "cluster_arn" {
  value = aws_rds_cluster.aurora.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint (cluster endpoint)"
  value       = aws_rds_cluster.aurora.endpoint
}

output "reader_endpoint" {
  description = "Read-only endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "port" {
  value = aws_rds_cluster.aurora.port
}

output "security_group_id" {
  value = aws_security_group.aurora_db.id
}

output "db_subnet_group_name" {
  value = aws_db_subnet_group.this.name
}

output "writer_instance_id" {
  value = aws_rds_cluster_instance.writer.id
}

# ── Proxy outputs ─────────────────────────────────────────────────────────────
output "proxy_enabled" {
  value = var.enable_db_proxy
}

output "proxy_security_group_id" {
  value       = var.enable_db_proxy ? aws_security_group.db_proxy[0].id : null
  description = "SG that clients should connect to when using the proxy"
}

output "proxy_endpoint" {
  value       = var.enable_db_proxy ? aws_db_proxy.pg_proxy[0].endpoint : null
  description = "Writer (default) proxy endpoint (read/write)"
}

output "proxy_reader_endpoint" {
  value       = (var.enable_db_proxy && var.create_reader_proxy_endpoint) ? aws_db_proxy_endpoint.read_only[0].endpoint : null
  description = "Optional read-only proxy endpoint (if created)"
}

output "proxy_port" {
  value       = var.enable_db_proxy ? var.db_port : null
  description = "Port for the proxy endpoint (PostgreSQL defaults to 5432)"
}

output "pg_url_direct" {
  value       = local.pg_url
  sensitive   = true
  description = "Direct cluster connection string"
}

output "pg_url_via_proxy" {
  value       = local.pg_proxy_url
  sensitive   = true
  description = "Connection string via RDS Proxy (writer endpoint)"
}
