provider "aws" {
  region = local.aws_region

  default_tags {
    tags = {
      Owner       = "shopwise"
      Environment = local.env
      ManagedBy   = "Terraform"
    }
  }
}