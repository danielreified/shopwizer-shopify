data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

module "vpc" {
  source      = "../../modules/vpc"
  name_prefix = local.name_prefix

  vpc_cidr_block       = "10.10.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  create_nat_gateway   = false

  az_a = "us-east-1a"
  az_b = "us-east-1b"

  public_subnet_a_cidr  = "10.10.0.0/20"
  public_subnet_b_cidr  = "10.10.16.0/20"
  private_subnet_a_cidr = "10.10.128.0/20"
  private_subnet_b_cidr = "10.10.144.0/20"
}

module "acm_certs" {
  source      = "../../modules/acm_certs"
  root_domain = local.root_domain
  san_names   = ["*.${local.root_domain}"]
}

module "dns_cf_shopify" {
  source         = "../../modules/dns_records"
  root_domain    = local.root_domain
  hosted_zone_id = module.acm_certs.zone_id

  create_cf_records = true
  cf_subdomains     = ["shopify"]

  cf_domain_name = module.cloudfront.distribution_domain_name
  cf_zone_id     = module.cloudfront.hosted_zone_id
}

module "dns_cf_apex" {
  source         = "../../modules/dns_records"
  root_domain    = local.root_domain
  hosted_zone_id = module.acm_certs.zone_id

  create_cf_records = true
  cf_point_apex     = true
  cf_subdomains     = ["www"]

  cf_domain_name = module.cloudfront_site.distribution_domain_name
  cf_zone_id     = module.cloudfront_site.hosted_zone_id
}

module "dns_alb_subdomains" {
  source         = "../../modules/dns_records"
  root_domain    = local.root_domain
  hosted_zone_id = module.acm_certs.zone_id

  create_alb_records = true
  alb_subdomains     = ["api", "app"]
  alb_dns_name       = module.alb.alb_dns_name
  alb_zone_id        = module.alb.alb_zone_id

  alb_point_apex = false
}

module "alb" {
  source                           = "../../modules/alb"
  name_prefix                      = local.name_prefix
  vpc_id                           = module.vpc.vpc_id
  public_subnet_ids                = module.vpc.public_subnet_ids
  allowed_ingress_cidrs            = ["0.0.0.0/0"]
  certificate_arn                  = module.acm_certs.regional_cert_arn
  default_forward_target_group_arn = module.tg_app.arn
  internal                         = false
  enable_deletion_protection       = false
}

module "tg_app" {
  source            = "../../modules/alb_target"
  name_prefix       = local.name_prefix
  service_name      = "app"
  vpc_id            = module.vpc.vpc_id
  port              = 3000
  protocol          = "HTTP"
  health_check_path = "/health"
}

module "tg_api" {
  source            = "../../modules/alb_target"
  name_prefix       = local.name_prefix
  service_name      = "api"
  vpc_id            = module.vpc.vpc_id
  port              = 3000
  protocol          = "HTTP"
  health_check_path = "/health"
}

module "rule_app" {
  source           = "../../modules/alb_rule"
  name_prefix      = local.name_prefix
  listener_arn     = module.alb.https_listener_arn
  target_group_arn = module.tg_app.arn
  priority         = 100
  hostnames        = ["app.${local.root_domain}"]
}

module "rule_api" {
  source           = "../../modules/alb_rule"
  name_prefix      = local.name_prefix
  listener_arn     = module.alb.https_listener_arn
  target_group_arn = module.tg_api.arn
  priority         = 110
  hostnames        = ["api.${local.root_domain}"]
}

module "site_bucket" {
  source      = "../../modules/s3"
  bucket_name = replace(local.root_domain, ".", "-")
}

module "cloudfront_site" {
  source                         = "../../modules/cloudfront_s3_oac"
  name_prefix                    = local.name_prefix
  s3_bucket_regional_domain_name = module.site_bucket.bucket_regional_domain_name
  aliases                        = [local.root_domain, "www.${local.root_domain}"]
  acm_certificate_arn            = module.acm_certs.cloudfront_cert_arn
}

data "aws_iam_policy_document" "site_read" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${module.site_bucket.bucket_arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.cloudfront_site.distribution_arn]
    }
  }
}
resource "aws_s3_bucket_policy" "site_read" {
  bucket = module.site_bucket.bucket_id
  policy = data.aws_iam_policy_document.site_read.json
}


########################################
# 1) HMAC function (standalone module)
########################################
module "cloudfront_hmac" {
  name_prefix           = local.name_prefix
  source                = "../../modules/cloudfront_hmac"
  shopify_shared_secret = local.shopify_shared_secret
}

########################################
# 2) CloudFront distribution (API)
########################################
module "cloudfront" {
  source      = "../../modules/cloudfront"
  name_prefix = local.name_prefix

  origin_domain_name     = module.alb.alb_dns_name
  origin_protocol_policy = "https-only"
  origin_ssl_protocols   = ["TLSv1.2"]

  aliases             = ["shopify.${local.root_domain}"]
  acm_certificate_arn = module.acm_certs.cloudfront_cert_arn

  path_pattern      = "/recommend/*"
  cache_policy_id   = null
  cache_ttl_seconds = 60

  viewer_request_function_arn = module.cloudfront_hmac.function_arn
}

module "ecs_cluster" {
  source      = "../../modules/ecs_cluster"
  name_prefix = local.name_prefix

  enable_container_insights = true
  enable_exec               = true
  exec_logging              = "DEFAULT"
}

# ########################################################################
# Shopify partner
# ########################################################################

module "bus_shopify_partner" {
  source            = "../../modules/event_bus"
  event_source_name = local.shopify_partner_source_name
  create            = false
}

# ########################################################################
# ORDERS
# ########################################################################

module "shopify_orders_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-shopify-orders"

  is_fifo    = false
  create_dlq = true

  visibility_timeout_seconds = 90
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20

  allow_eventbridge           = true
  eventbridge_source_arns     = [module.shopify_orders_create_rule.rule_arn]
  eventbridge_source_accounts = [data.aws_caller_identity.current.account_id]
}

module "shopify_orders_create_rule" {
  source         = "../../modules/event_rule"
  event_bus_name = module.bus_shopify_partner.event_bus_name
  rule_name      = "${local.name_prefix}-orders-create"
  queue_arn      = module.shopify_orders_queue.queue_arn

  event_pattern_json = jsonencode({
    "source" : [{
      "prefix" : "aws.partner/shopify.com/"
    }],
    "detail-type" : ["shopifyWebhook"],
    "detail" : {
      "metadata" : {
        "X-Shopify-Topic" : [{ "prefix" : "orders/" }]
      }
    }
  })
}

# ########################################################################
# Embedding
# ########################################################################

module "enrich_products_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-enrich-products"

  is_fifo    = false
  create_dlq = true

  allow_eventbridge = false

  visibility_timeout_seconds = 120
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
}


# ########################################################################
# Products
# ########################################################################

module "shopify_products_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-shopify-products"

  is_fifo    = false
  create_dlq = true

  visibility_timeout_seconds = 90
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20

  allow_eventbridge = true
}

module "shopify_products_create_rule" {
  source         = "../../modules/event_rule"
  rule_name      = "${local.name_prefix}-products-create"
  event_bus_name = module.bus_shopify_partner.event_bus_name
  queue_arn      = module.shopify_products_queue.queue_arn

  event_pattern_json = jsonencode({
    "source" : [{
      "prefix" : "aws.partner/shopify.com/"
    }],
    "detail-type" : ["shopifyWebhook"],
    "detail" : {
      "metadata" : {
        "X-Shopify-Topic" : [{ "prefix" : "products/" }]
      }
    }
  })
}

module "s3_lambda_artifacts" {
  source      = "../../modules/s3"
  bucket_name = "${local.name_prefix}-lambda-artifacts"
}

# Seed JS ZIP (protected; CI can overwrite freely)
resource "aws_s3_object" "seed_js" {
  bucket       = module.s3_lambda_artifacts.bucket_id
  key          = "lambda-js-starter.zip" # stays as-is
  source       = "${path.module}/../../assets/fn-basic-js.zip"
  content_type = "application/zip"

  lifecycle {
    ignore_changes = [source, content, etag, metadata, content_type]
  }
}

# (Optional) keep a Python seed too — not used by this Lambda
resource "aws_s3_object" "seed_py" {
  bucket       = module.s3_lambda_artifacts.bucket_id
  key          = "lambda-py-starter.zip"
  source       = "${path.module}/../../assets/fn-basic-py.zip"
  content_type = "application/zip"

  lifecycle {
    ignore_changes = [source, content, etag, metadata, content_type]
  }
}

module "bulk_products_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-bulk-products"

  is_fifo    = false
  create_dlq = true

  visibility_timeout_seconds = 90
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
}


module "s3_product_bulk" {
  source      = "../../modules/s3"
  bucket_name = "${local.name_prefix}-product-bulk"
}

# ---- Existing: read from the product-bulk S3 bucket ----
data "aws_iam_policy_document" "lambda_read_bulk" {
  statement {
    actions   = ["s3:GetObject", "s3:GetObjectVersion"]
    resources = ["${module.s3_product_bulk.bucket_arn}/*"]
  }
  statement {
    actions   = ["s3:ListBucket"]
    resources = [module.s3_product_bulk.bucket_arn]
  }
}

# ---- NEW: allow the Lambda to send messages to the products SQS queue ----
data "aws_iam_policy_document" "lambda_send_products_queue" {
  statement {
    sid       = "AllowSendToProductsQueue"
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [module.shopify_products_queue.queue_arn]
  }
}

# ---- NEW: combine the S3 + SQS policies (single inline policy JSON for the module) ----
data "aws_iam_policy_document" "lambda_exec_combined" {
  source_policy_documents = [
    data.aws_iam_policy_document.lambda_read_bulk.json,
    data.aws_iam_policy_document.lambda_send_products_queue.json
  ]
}

# ---- Lambda definition ----
module "lambda_products_ingest" {
  source        = "../../modules/lambda"
  function_name = "${local.name_prefix}-products-ingest"
  runtime       = "nodejs20.x"
  handler       = "src/index.handler" # matches src/index.js in your artifact

  artifact_bucket_name = module.s3_lambda_artifacts.bucket_id
  code_s3_key          = aws_s3_object.seed_js.key

  environment = {
    BULK_QUEUE_URL = module.shopify_products_queue.queue_url # URL (not ARN) – your code expects URL
    PRODUCT_BUCKET = module.s3_product_bulk.bucket_id
    # DEBUG        = "1"  # optional: turn on verbose logs in prod
  }

  # Use the merged policy so the role can read S3 and send to SQS
  exec_inline_policy_json = data.aws_iam_policy_document.lambda_exec_combined.json

  depends_on = [aws_s3_object.seed_js]
}

# ---- Allow S3 bucket to invoke the Lambda on object created ----
resource "aws_lambda_permission" "allow_product_bulk" {
  statement_id  = "AllowExecutionFromS3ProductBulk"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_products_ingest.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = module.s3_product_bulk.bucket_arn
}

resource "aws_s3_bucket_notification" "product_bulk" {
  bucket = module.s3_product_bulk.bucket_id

  lambda_function {
    lambda_function_arn = module.lambda_products_ingest.function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".jsonl"
  }

  lambda_function {
    lambda_function_arn = module.lambda_products_ingest.function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".jsonl.gz"
  }

  depends_on = [aws_lambda_permission.allow_product_bulk]
}


# module "aurora" {
#   source      = "../../modules/aurora"
#   name_prefix = local.name_prefix

#   vpc_id                     = module.vpc.vpc_id
#   subnet_ids                 = module.vpc.private_subnet_ids
#   allowed_security_group_ids = [aws_security_group.ecs_tasks.id]

#   db_credentials_secret_name = "${local.name_prefix}/manual/db_credentials"
#   db_name                    = "shopwisedb"

#   engine_version     = "17.4"
#   serverless_min_acu = 0.5
#   serverless_max_acu = 2

#   # ── turn the proxy on ─────────────────────────────────
#   enable_db_proxy              = true
#   proxy_require_tls            = true
#   proxy_idle_client_timeout    = 1800
#   proxy_debug_logging          = false
#   create_reader_proxy_endpoint = true

#   # Safety defaults
#   deletion_protection   = false
#   backup_retention_days = 1
# }


# ########################################################################
# ########################################################################
# ########################################################################


# module "elasticache" {
#   source      = "../../modules/elasticache"
#   name_prefix = local.name_prefix

#   vpc_id     = module.vpc.vpc_id
#   subnet_ids = module.vpc.private_subnet_ids

#   allowed_security_group_ids = [aws_security_group.ecs_tasks.id]

#   node_type      = "cache.t4g.micro"
#   engine_version = null

#   transit_encryption_enabled = false
#   at_rest_encryption_enabled = false
# }

module "dynamodb_store" {
  source     = "../../modules/dynamodb"
  table_name = "${local.name_prefix}-product-state"

  partition_key_name = "pk"
  sort_key_name      = "sk"

  billing_mode   = "PAY_PER_REQUEST"
  read_capacity  = 5
  write_capacity = 5

  ttl_enabled        = true
  ttl_attribute_name = "ttl_expires_at"

  pitr_enabled = true
}


############################################
# Logs for the service
############################################
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ecs/${local.name_prefix}-app"
  retention_in_days = 30
}

############################################
# Task role policy (least privilege)
############################################

resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-tasks-sg"
  description = "Ingress from ALB to ECS tasks"
  vpc_id      = module.vpc.vpc_id

  # allow ALB -> tasks on each port
  dynamic "ingress" {
    for_each = [3000]
    content {
      description     = "ALB to app:${ingress.value}"
      protocol        = "tcp"
      from_port       = ingress.value
      to_port         = ingress.value
      security_groups = [module.alb.alb_sg_id]
    }
  }

  # tasks can call out (DB/Redis/API/etc.)
  egress {
    description = "all egress"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-ecs-tasks-sg" }
}

############################################
# ECS Service (Fargate)
############################################

data "aws_iam_policy_document" "app_task" {
  statement {
    sid       = "DynamoWriteHashes"
    actions   = ["dynamodb:PutItem", "dynamodb:ConditionCheckItem"]
    resources = [module.dynamodb_store.table_arn]
  }

  statement {
    sid     = "S3ReadProductBulk"
    actions = ["s3:GetObject", "s3:GetObjectVersion", "s3:ListBucket"]
    resources = [
      "arn:aws:s3:::${module.s3_product_bulk.bucket_arn}",
      "arn:aws:s3:::${module.s3_product_bulk.bucket_arn}/*"
    ]
  }
}

# module "app_service" {
#   source = "../../modules/ecs_service"

#   name_prefix    = local.name_prefix
#   service_prefix = "${local.name_prefix}-app"

#   cluster_arn        = module.ecs_cluster.cluster_arn
#   subnet_ids         = module.vpc.private_subnet_ids
#   security_group_ids = [aws_security_group.ecs_tasks.id]

#   log_group_name = aws_cloudwatch_log_group.app.name

#   container = {
#     image  = "daniel2016/alpine-nginx-starter-healthcheck"
#     port   = 3000
#     cpu    = 256
#     memory = 512

#     environment = {
#       HASH_TABLE     = module.dynamodb_store.table_name
#       PRODUCT_BUCKET = module.s3_product_bulk.bucket_arn
#       LOG_LEVEL      = "info"
#     }
#   }

#   load_balancer = {
#     target_group_arn = module.tg_app.arn
#     container_port   = 3000
#   }

#   autoscaling = {
#     min_capacity = 1
#     max_capacity = 5
#     policies = [{
#       name         = "cpu-50"
#       metric_type  = "CPU"
#       target_value = 50
#     }]
#   }

#   #   desired_count = 1

#   task_inline_policy_json = data.aws_iam_policy_document.app_task.json

#   # optional boundaries / extras
#   # execution_permissions_boundary_arn = var.exec_boundary
#   # task_permissions_boundary_arn      = var.task_boundary
#   # execution_managed_policy_arns      = []
#   # task_managed_policy_arns           = []

#   # runtime niceties
#   propagate_tags   = "TASK_DEFINITION"
#   assign_public_ip = false
# }


# module "app_service" {
#   source = "../../modules/ecs_service"

#   name_prefix    = local.name_prefix
#   service_prefix = "${local.name_prefix}-app"

#   cluster_arn        = module.ecs_cluster.cluster_arn
#   subnet_ids         = module.vpc.private_subnet_ids
#   security_group_ids = [aws_security_group.ecs_tasks.id]

#   log_group_name = aws_cloudwatch_log_group.app.name

#   container = {
#     image  = "daniel2016/alpine-nginx-starter-healthcheck"
#     port   = 3000
#     cpu    = 256
#     memory = 512

#     environment = {
#       HASH_TABLE     = module.dynamodb_store.table_name
#       PRODUCT_BUCKET = module.s3_product_bulk.bucket_arn
#       LOG_LEVEL      = "info"
#     }
#   }

#   autoscaling = {
#     min_capacity = 1
#     max_capacity = 5
#     policies = [{
#       name         = "cpu-50"
#       metric_type  = "CPU"
#       target_value = 50
#     }]
#   }

#   desired_count = 1

#   task_inline_policy_json = data.aws_iam_policy_document.app_task.json

#   propagate_tags   = "TASK_DEFINITION"
#   assign_public_ip = false
# }



# ########################################################################
# ########################################################################
# ########################################################################

# data "aws_iam_policy_document" "lambda_llm" {
#   statement {
#     actions   = ["s3:GetObject", "s3:GetObjectVersion"]
#     resources = ["arn:aws:s3:::${module.s3_product_bulk.bucket_name}/*"]
#   }
#   statement {
#     actions   = ["s3:ListBucket"]
#     resources = ["arn:aws:s3:::${module.s3_product_bulk.bucket_name}"]
#   }
# }

# module "lambda_llm_orchestrator" {
#   source               = "../../modules/lambda"
#   function_name        = "${local.name_prefix}-ingest"
#   runtime              = "nodejs20.x"
#   handler              = "index.handler"
#   artifact_bucket_name = module.s3_lambda_artifacts.bucket_name
#   code_s3_key          = "ingest/ingest.zip"

#   environment = {
#     PRODUCT_BUCKET = module.s3_product_bulk.bucket_name
#   }

#   exec_inline_policy_json = data.aws_iam_policy_document.lambda_llm.json
# }

# ########################################################################
# ########################################################################
# ########################################################################
