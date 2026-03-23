############################################################
# ░░ DATA ░░
############################################################

# Get the latest Amazon Linux 2 ARM64 AMI (SSM agent pre-installed, smaller 8GB root)
data "aws_ami" "amazon_linux_2_arm" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-arm64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

############################################################
# ░░ IAM ░░
############################################################

# IAM role for the bastion EC2 instance
resource "aws_iam_role" "bastion" {
  name = "${var.name_prefix}-bastion-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# Attach the SSM managed policy so SSM Session Manager works
resource "aws_iam_role_policy_attachment" "bastion_ssm" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile to attach the role to EC2
resource "aws_iam_instance_profile" "bastion" {
  name = "${var.name_prefix}-bastion-profile"
  role = aws_iam_role.bastion.name

  tags = var.tags
}

############################################################
# ░░ SECURITY GROUP ░░
############################################################

resource "aws_security_group" "bastion" {
  name        = "${var.name_prefix}-bastion-sg"
  description = "Security group for SSM bastion - egress only to RDS Proxy"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, { Name = "${var.name_prefix}-bastion-sg" })
}

# Allow egress to RDS Proxy on port 5432
resource "aws_vpc_security_group_egress_rule" "bastion_to_rds_proxy" {
  security_group_id            = aws_security_group.bastion.id
  description                  = "PostgreSQL to RDS Proxy"
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = var.rds_proxy_security_group_id
}

# Allow HTTPS egress for SSM Session Manager communication
resource "aws_vpc_security_group_egress_rule" "bastion_https" {
  security_group_id = aws_security_group.bastion.id
  description       = "HTTPS for SSM Session Manager"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}

############################################################
# ░░ EC2 INSTANCE ░░
############################################################

resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux_2_arm.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  iam_instance_profile   = aws_iam_instance_profile.bastion.name
  vpc_security_group_ids = [aws_security_group.bastion.id]

  # No public IP - access via SSM only
  associate_public_ip_address = false

  # Minimal root volume (AL2 uses 8GB)
  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # Enable detailed monitoring (optional, small cost)
  monitoring = false

  # Metadata options for security
  metadata_options {
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
    http_endpoint               = "enabled"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-bastion"
  })

  lifecycle {
    ignore_changes = [ami] # Don't replace on AMI updates
  }
}

############################################################
# ░░ AUTO-STOP WHEN IDLE ░░
############################################################

# CloudWatch alarm to auto-stop instance after idle period
resource "aws_cloudwatch_metric_alarm" "bastion_idle_stop" {
  alarm_name          = "${var.name_prefix}-bastion-idle-stop"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.idle_stop_minutes / 5 # 5-min periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 1 # CPU < 1% = idle
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = aws_instance.bastion.id
  }

  alarm_description = "Stop bastion instance when idle for ${var.idle_stop_minutes} minutes"

  # EC2 action to stop the instance
  alarm_actions = ["arn:aws:automate:${data.aws_region.current.id}:ec2:stop"]
}

data "aws_region" "current" {}
