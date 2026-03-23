terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket         = "dev-tf-locks-shopwise"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "dev-tf-locks-shopwise"
    encrypt        = true
  }
}