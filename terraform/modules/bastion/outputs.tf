output "instance_id" {
  description = "EC2 instance ID for start/stop commands"
  value       = aws_instance.bastion.id
}

output "instance_name" {
  description = "EC2 instance name tag"
  value       = "${var.name_prefix}-bastion"
}

output "security_group_id" {
  description = "Security group ID of the bastion"
  value       = aws_security_group.bastion.id
}

output "rds_proxy_endpoint" {
  description = "RDS Proxy endpoint (for convenience in tunnel commands)"
  value       = var.rds_proxy_endpoint
}

output "ssm_start_command" {
  description = "AWS CLI command to start the bastion instance"
  value       = "aws ec2 start-instances --instance-ids ${aws_instance.bastion.id}"
}

output "ssm_stop_command" {
  description = "AWS CLI command to stop the bastion instance"
  value       = "aws ec2 stop-instances --instance-ids ${aws_instance.bastion.id}"
}

output "ssm_tunnel_command" {
  description = "AWS CLI command to start SSM port forwarding to RDS Proxy"
  value       = <<-EOT
    aws ssm start-session \
      --target ${aws_instance.bastion.id} \
      --document-name AWS-StartPortForwardingSessionToRemoteHost \
      --parameters '{"host":["${var.rds_proxy_endpoint}"],"portNumber":["5432"],"localPortNumber":["5432"]}'
  EOT
}
