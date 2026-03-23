# ########################################################################
# Bastion Outputs (for db-tunnel.sh script)
# ########################################################################

# output "bastion_instance_id" {
#   description = "Bastion EC2 instance ID for SSM tunnel"
#   value       = module.bastion.instance_id
# }

# output "rds_proxy_endpoint" {
#   description = "RDS Proxy endpoint for database connections"
#   value       = module.aurora.proxy_endpoint
# }

# output "db_tunnel_setup" {
#   description = "Commands to set up the DB tunnel"
#   value       = <<-EOT
#     # Export these environment variables:
#     export BASTION_INSTANCE_ID="${module.bastion.instance_id}"
#     export RDS_PROXY_ENDPOINT="${module.aurora.proxy_endpoint}"

#     # Then run:
#     ./scripts/db-tunnel.sh start
#   EOT
# }
