# Shopwise Infrastructure (Terraform)

Infrastructure-as-code for the Shopwise platform, deployed to AWS `us-east-1`. Managed with Terraform (>= 1.7) and orchestrated via Terramate.

## Architecture Overview

The platform runs on ECS Fargate behind an Application Load Balancer, with CloudFront distributions for the storefront API, marketing site, and tracking pixel. Event-driven processing flows through EventBridge and SQS queues into specialized worker services.

```
                    ┌─────────────────┐
                    │    Route 53     │
                    │ shopwizer.co.za │
                    └───────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
     ┌────────▼────┐  ┌────▼──────┐  ┌───▼───────────┐
     │ CloudFront  │  │CloudFront │  │  CloudFront   │
     │ (API/HMAC)  │  │ (Site)    │  │  (Pixel)      │
     │             │  │ S3 OAC    │  │  S3 logs→SQS  │
     └──────┬──────┘  └───────────┘  └───────────────┘
            │
     ┌──────▼──────┐
     │     ALB     │  app.shopwizer.co.za
     │   (HTTPS)   │  shopify.shopwizer.co.za
     └──────┬──────┘
            │
     ┌──────▼─────────────────────────────────┐
     │          ECS Cluster (Fargate)          │
     │                                         │
     │  app-remix        service-events        │
     │  service-enrich   service-analytics     │
     │  service-px       service-jobs-worker   │
     └─────────────────────────────────────────┘
            │              │
    ┌───────▼────┐  ┌──────▼──────┐
    │ PostgreSQL │  │  DynamoDB   │
    │  (Prisma)  │  │  (state)    │
    └────────────┘  └─────────────┘
```

### Key Data Flows

- **Shopify webhooks** arrive via EventBridge Partner Event Source, are routed to SQS queues (products, orders, checkouts), and consumed by `service-events`.
- **Internal events** flow through a dedicated EventBridge bus with rules routing to SQS queues for enrichment, analytics, email, jobs, and bulk processing.
- **Pixel tracking** uses a dedicated CloudFront distribution that writes access logs to S3. S3 notifications push to SQS, consumed by `service-px` which writes Parquet files queried via Athena.
- **Bulk product sync** triggers a Lambda (`fn-bulk-products`) on S3 object creation, which fans out to SQS and EventBridge.

## Naming Convention

All resources follow the pattern: `{env}-ue1-shopwizer-{resource}`

| Environment | Prefix              | Domain           |
| ----------- | ------------------- | ---------------- |
| dev         | `dev-ue1-shopwizer` | shopwizer.co.za  |
| prod        | `dev-ue1-shopwise`  | aluu.io          |

## Modules

| Module                | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `acm_certs`           | ACM certificates with DNS validation (regional + CloudFront)                |
| `alb`                 | Application Load Balancer with HTTPS listener                               |
| `alb_rule`            | ALB listener rule for host-based routing                                    |
| `alb_target`          | ALB target group with health check configuration                            |
| `aurora`              | Aurora PostgreSQL Serverless v2 cluster with RDS Proxy                      |
| `bastion`             | EC2 bastion host for SSM-based database tunneling                           |
| `betterstack_logs`    | CloudWatch log subscription to BetterStack (Logtail) via Lambda forwarder   |
| `cloudfront`          | CloudFront distribution for API/Shopify proxy with HMAC auth and caching    |
| `cloudfront_hmac`     | Lambda@Edge function for HMAC request signing on CloudFront                 |
| `cloudfront_px`       | CloudFront distribution for pixel tracking with S3 logging and archiving    |
| `cloudfront_s3_oac`   | CloudFront distribution with S3 Origin Access Control (marketing site)      |
| `cloudwatch_log`      | CloudWatch log group with configurable retention                            |
| `codebuild`           | CodeBuild project for CI/CD tasks (e.g., Prisma migrations)                 |
| `dns`                 | Route 53 hosted zone management                                             |
| `dns_records`         | Route 53 record sets (ALB aliases, CloudFront aliases, apex records)        |
| `dynamodb`            | DynamoDB table with configurable keys, TTL, and point-in-time recovery      |
| `ecr`                 | ECR repository for container images                                         |
| `ecs_cluster`         | ECS cluster with Container Insights and ECS Exec                            |
| `ecs_service`         | ECS Fargate service with task/execution roles, optional ALB and autoscaling |
| `elasticache`         | ElastiCache Redis cluster                                                   |
| `event_bus`           | EventBridge partner event bus (Shopify)                                     |
| `event_rule`          | EventBridge rule with SQS target (pattern-match or schedule-based)          |
| `eventbridge`         | Internal EventBridge bus with multiple rules and SQS targets                |
| `lambda`              | Lambda function from S3 artifact with IAM, optional VPC placement           |
| `s3`                  | S3 bucket with optional SSL enforcement                                     |
| `sqs`                 | SQS queue (standard or FIFO) with optional DLQ and EventBridge permissions  |
| `vpc`                 | VPC with 2 AZs, public/private subnets, optional NAT and gateway endpoints  |

## Stack Configurations

### `stacks/dev`

Development environment on `shopwizer.co.za`.

- **VPC**: `10.10.0.0/16`, 2 AZs (`us-east-1a/b`), NAT gateway enabled
- **ECS services**: `app-remix`, `service-events`, `service-enrich`, `service-analytics`, `service-px`, `service-jobs-worker` -- all 256 CPU / 512 MB
- **Autoscaling**: Events and enrich scale 1-10 based on SQS queue depth; PX worker scales 1-2
- **Lambdas**: `fn-bulk-products` (Node.js 20, S3-triggered), `fn-email` (SES delivery), `fn-job-scheduler`
- **Data stores**: DynamoDB (product state, PAY_PER_REQUEST), S3 (bulk products, pixel logs, Athena results, feature snapshots)
- **Analytics**: Athena + Glue catalog tables with partition projection over Parquet data
- **Scheduled jobs**: Hourly feature aggregation, daily validation, hourly rail metrics, daily graph weights, hourly bundle metrics
- **Logging**: CloudWatch with BetterStack forwarding
- **CI/CD**: CodeBuild project for Prisma migrations
- **State backend**: S3 (`dev-tf-locks-shopwise`) + DynamoDB lock table

### `stacks/prod`

Production environment on `aluu.io`.

- **VPC**: Same CIDR layout, NAT gateway disabled (cost optimization)
- **ALB subdomains**: Includes `api` subdomain in addition to `app`
- **State backend**: S3 (`tf-locks-shopwise`) + DynamoDB lock table
- Otherwise mirrors the dev stack structure

## Prerequisites

- Terraform >= 1.7.0
- AWS CLI configured with appropriate credentials
- [Terramate](https://terramate.io/) CLI (for orchestration)
- S3 backend bucket and DynamoDB lock table pre-created for each environment
- Secrets pre-populated in AWS Secrets Manager

## Usage

### Direct Terraform

```bash
# Navigate to a stack
cd terraform/stacks/dev

# Copy and populate variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values

# Initialize
terraform init

# Preview changes
terraform plan -out=tfplan

# Apply
terraform apply tfplan
```

### Terramate Orchestration

Terramate is configured for the `shopwise` cloud organization and orchestrates runs across stacks.

```bash
# From the terraform/ directory
cd terraform

# List all stacks
terramate list

# Run plan across all stacks
terramate run terraform plan

# Run apply across all stacks
terramate run terraform apply

# Target a specific stack
terramate run --filter=stacks/dev terraform plan
```

## Required Variables

Each stack requires a `terraform.tfvars` file (gitignored). See `terraform.tfvars.example` for the template.

| Variable              | Description                        | Sensitive |
| --------------------- | ---------------------------------- | --------- |
| `shopify_secret`      | Shopify app shared secret          | Yes       |
| `secrets_arn`         | AWS Secrets Manager secret ARN     | No        |
| `logtail_source_token`| BetterStack Logtail source token   | Yes       |

## Key Design Decisions

1. **Flat module composition over nested stacks.** Each stack file directly composes modules rather than layering stacks. This keeps the dependency graph visible in a single `main.tf` and avoids cross-stack output wiring.

2. **SQS-driven autoscaling.** Worker services (events, enrich, px) scale based on SQS `ApproximateNumberOfMessagesVisible` with step scaling policies. This provides cost-proportional scaling tied to actual workload rather than CPU alone.

3. **Least-privilege IAM per service.** Each ECS service gets its own task role with an inline policy scoped to only the resources it needs (specific S3 buckets, DynamoDB tables, SQS queues). A shared managed policy covers the common SQS + EventBridge access pattern.

4. **Partition projection for Athena.** Glue catalog tables use Athena partition projection instead of `MSCK REPAIR TABLE` or Glue crawlers. This eliminates partition management overhead while keeping query costs low with time-based pruning.

5. **CloudFront HMAC signing.** The API CloudFront distribution uses a Lambda@Edge function to sign requests with HMAC, verifying that traffic to the ALB origin comes through CloudFront and carries valid Shopify signatures.

6. **S3-based Lambda deployment.** Lambda functions deploy from S3 artifacts rather than inline zips. Terraform seeds a starter zip on first apply, and CI/CD overwrites the artifact on subsequent deploys. `lifecycle { ignore_changes }` prevents Terraform from reverting CI-deployed code.

7. **EventBridge for fan-out.** A dedicated internal EventBridge bus decouples services. Producers emit events with a source and detail-type; rules route to the appropriate SQS queues. Adding new consumers requires only a new rule, not producer changes.

8. **Separate CloudFront distributions by concern.** Three CloudFront distributions serve distinct purposes: API proxy (with per-path caching and HMAC), marketing site (S3 OAC), and pixel tracking (access log capture). This isolates caching, security, and logging policies.

## Provider Configuration

All resources are tagged automatically via the AWS provider:

```hcl
default_tags {
  tags = {
    Owner       = "shopwise"
    Environment = "dev"  # or the stack's env value
    ManagedBy   = "Terraform"
  }
}
```
