data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

module "vpc" {
  source      = "../../modules/vpc"
  name_prefix = local.name_prefix

  vpc_cidr_block       = "10.10.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  create_nat_gateway   = true

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
  alb_subdomains     = ["app"]
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



module "rule_app" {
  source           = "../../modules/alb_rule"
  name_prefix      = local.name_prefix
  listener_arn     = module.alb.https_listener_arn
  target_group_arn = module.tg_app.arn
  priority         = 100
  hostnames        = ["app.${local.root_domain}"]
}

module "rule_shopify" {
  source           = "../../modules/alb_rule"
  name_prefix      = "${local.name_prefix}-shopify"
  listener_arn     = module.alb.https_listener_arn
  target_group_arn = module.tg_app.arn
  priority         = 90
  hostnames        = ["shopify.${local.root_domain}"]
}



module "site_bucket" {
  source           = "../../modules/s3"
  bucket_name      = replace(local.root_domain, ".", "-")
  enforce_ssl_only = false # Managed by CloudFront OAC module
}

module "cloudfront_site" {
  source      = "../../modules/cloudfront_s3_oac"
  name_prefix = local.name_prefix

  # ✅ Required for the policy fix
  s3_bucket_id                   = module.site_bucket.bucket_id
  s3_bucket_arn                  = module.site_bucket.bucket_arn
  s3_bucket_regional_domain_name = module.site_bucket.bucket_regional_domain_name

  aliases             = [local.root_domain, "www.${local.root_domain}"]
  acm_certificate_arn = module.acm_certs.cloudfront_cert_arn
  default_root_object = "index.html"
}

########################################
# 1) Tracking pixel
########################################

# ======================================================================
# PIXEL: CloudFront → S3 access logs → SQS → ECS worker → Analytics
# ======================================================================

# ---------------------------
# 1) SQS for CF access logs
# ---------------------------
module "px_logs_queue" {
  source            = "../../modules/sqs"
  base_name         = "${local.name_prefix}-cf-logs-px"
  is_fifo           = false
  create_dlq        = true
  kms_master_key_id = null

  # (defaults OK; tune if you want)
  visibility_timeout_seconds = 300
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
  allow_eventbridge          = false
}

# ------------------------------------------------------------
# 2) CloudFront pixel distribution (S3 origin + OAC + logging)
# ------------------------------------------------------------
module "cloudfront_px" {
  source              = "../../modules/cloudfront_px"
  name_prefix         = local.name_prefix
  acm_certificate_arn = module.acm_certs.cloudfront_cert_arn
  root_domain         = local.root_domain
  hosted_zone_id      = module.acm_certs.zone_id
  enable_s3_to_sqs    = false

  # Hook logs bucket → SQS notifications
  logs_queue_arn = module.px_logs_queue.queue_arn
}

resource "aws_s3_bucket_notification" "px_logs_to_sqs" {
  bucket = module.cloudfront_px.logs_bucket_id

  queue {
    queue_arn     = module.px_logs_queue.queue_arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "px/"
    filter_suffix = ".gz"
  }

  depends_on = [
    module.px_logs_queue,
    aws_sqs_queue_policy.px_logs_queue_policy
  ]
}

# 2️⃣  Allow S3 bucket to send messages to SQS
############################################################
resource "aws_sqs_queue_policy" "px_logs_queue_policy" {
  queue_url = module.px_logs_queue.queue_url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAllS3ToSend"
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = "sqs:SendMessage"
        Resource  = module.px_logs_queue.queue_arn
      }
    ]
  })
}

# -----------------------------------------------------------
# 4) IAM for ECS worker: read S3 logs + consume SQS
# ------------------------------------------------------------
data "aws_iam_policy_document" "px_worker_s3" {
  statement {
    sid       = "ReadPxLogsObjects"
    actions   = ["s3:GetObject", "s3:GetObjectVersion", "s3:DeleteObject"]
    resources = ["${module.cloudfront_px.logs_bucket_arn}/*"]
  }

  statement {
    sid       = "ListPxLogsBucket"
    actions   = ["s3:ListBucket"]
    resources = [module.cloudfront_px.logs_bucket_arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["px/*"]
    }
  }

  statement {
    sid = "WriteProcessedAndArchived"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:DeleteObject"
    ]
    resources = [
      module.cloudfront_px.processed_bucket_arn,
      "${module.cloudfront_px.processed_bucket_arn}/*",
      module.cloudfront_px.archived_bucket_arn,
      "${module.cloudfront_px.archived_bucket_arn}/*"
    ]
  }
}

data "aws_iam_policy_document" "px_worker_sqs" {
  statement {
    sid = "ConsumePxLogsQueue"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ChangeMessageVisibility",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]
    resources = [module.px_logs_queue.queue_arn]
  }
}

data "aws_iam_policy_document" "px_worker_task_inline" {
  source_policy_documents = [
    data.aws_iam_policy_document.px_worker_s3.json,
    data.aws_iam_policy_document.px_worker_sqs.json
  ]
}

# ------------------------------------------------------------
# 5) Logs for the worker
# ------------------------------------------------------------
resource "aws_cloudwatch_log_group" "px_worker" {
  name              = "/aws/ecs/${local.name_prefix}-px-worker"
  retention_in_days = 14
}

# ------------------------------------------------------------
# 6) ECS Fargate worker service (no ALB; scales on SQS depth)
# ------------------------------------------------------------

module "ecr_px" {
  source = "../../modules/ecr"
  name   = "${local.name_prefix}-service-px"
}

module "px_worker_service" {
  source = "../../modules/ecs_service"

  name_prefix    = local.name_prefix
  service_prefix = "${local.name_prefix}-px-worker"

  cluster_arn        = module.ecs_cluster.cluster_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.ecs_tasks.id]
  log_group_name     = aws_cloudwatch_log_group.px_worker.name

  container = {
    image  = "${module.ecr_px.repository_url}:latest"
    port   = 3000
    cpu    = 256
    memory = 512

    environment = {
      LOG_PREFIX     = "px/"
      BATCH_SIZE     = "10"
      POLL_WAIT_SEC  = "20"
      VISIBILITY_SEC = "300"
      ANALYTICS_URL  = "https://api.${local.root_domain}/ingest"
      LOG_LEVEL      = "info"
      SERVICE_NAME   = "service-px"
      NODE_ENV       = "production"
    }

    secrets = [
      { name = "DATABASE_URL", valueFrom = "${local.secrets_arn}:DATABASE_URL::" },
      { name = "PX_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_px_logs.arn },
      { name = "PROCESSED_BUCKET", valueFrom = aws_ssm_parameter.bucket_processed.arn },
      { name = "ARCHIVE_BUCKET", valueFrom = aws_ssm_parameter.bucket_archive.arn },
      { name = "LOG_BUCKET", valueFrom = aws_ssm_parameter.bucket_px_logs.arn }
    ]
  }

  desired_count = 1

  task_inline_policy_json  = data.aws_iam_policy_document.px_worker_task_inline.json
  task_managed_policy_arns = [aws_iam_policy.shared_sqs_access.arn]

  secrets_arns = [local.secrets_arn]

  propagate_tags   = "TASK_DEFINITION"
  assign_public_ip = false
}

# ------------------------------------------------------------
# 7) SQS backlog autoscaling for the worker
# ------------------------------------------------------------
resource "aws_appautoscaling_target" "px_worker" {
  max_capacity       = 2
  min_capacity       = 1
  resource_id        = "service/${module.ecs_cluster.cluster_name}/${module.px_worker_service.service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_cloudwatch_metric_alarm" "px_worker_scale_out" {
  alarm_name          = "${local.name_prefix}-px-worker-queue-high"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = module.px_logs_queue.queue_name }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 2
  threshold           = 25
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [aws_appautoscaling_policy.px_worker_scale_out.arn]
}

resource "aws_appautoscaling_policy" "px_worker_scale_out" {
  name               = "${local.name_prefix}-px-worker-scale-out"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.px_worker.resource_id
  scalable_dimension = aws_appautoscaling_target.px_worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.px_worker.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 100
      scaling_adjustment          = 1
    }

    step_adjustment {
      metric_interval_lower_bound = 100
      scaling_adjustment          = 2
    }
  }
}
resource "aws_cloudwatch_metric_alarm" "px_worker_scale_in" {
  alarm_name          = "${local.name_prefix}-px-worker-queue-low"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = module.px_logs_queue.queue_name }
  statistic           = "Sum"
  period              = 120
  evaluation_periods  = 2
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  alarm_actions       = [aws_appautoscaling_policy.px_worker_scale_in.arn]
}

resource "aws_appautoscaling_policy" "px_worker_scale_in" {
  name               = "${local.name_prefix}-px-worker-scale-in"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.px_worker.resource_id
  scalable_dimension = aws_appautoscaling_target.px_worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.px_worker.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 120
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }
  }
}

# ----------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------

########################################
# 1) HMAC function (standalone module)
########################################
module "cloudfront_hmac" {
  name_prefix = local.name_prefix
  source      = "../../modules/cloudfront_hmac"
  secrets_arn = local.secrets_arn
  secrets_key = "SHOPIFY_API_SECRET" # Key name in your Secrets Manager JSON
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

  # Per-route caching for recommendation API endpoints
  # Pattern: /proxy/recs/{shop}/{type}/{id}
  cache_behaviors = [
    { path_pattern = "/proxy/recs/*/arrivals/*", ttl_seconds = 300 }, # 5 min - new arrivals
    { path_pattern = "/proxy/recs/*/color/*", ttl_seconds = 3600 },   # 1 hr - color variants
    { path_pattern = "/proxy/recs/*/sellers/*", ttl_seconds = 600 },  # 10 min - seller recs
    { path_pattern = "/proxy/recs/*/similar/*", ttl_seconds = 3600 }, # 1 hr - similar products
    { path_pattern = "/proxy/recs/*/trending/*", ttl_seconds = 300 }, # 5 min - trending
    { path_pattern = "/proxy/integrations/*", ttl_seconds = 3600 },   # 1 hr - shop integrations
  ]

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
# Internal EventBridge for service-to-service communication
# ########################################################################

module "internal_eventbridge" {
  source      = "../../modules/eventbridge"
  name_prefix = local.name_prefix

  enable_archive         = false
  archive_retention_days = 7

  rules = [
    # Product enrichment pipeline
    {
      name_suffix = "enrich-products"
      event_pattern = {
        source      = ["shopwizer.service-events"]
        detail-type = ["product.enrich"]
      }
      queue_arn = module.enrich_products_queue.queue_arn
    },

    # Analytics events
    {
      name_suffix = "analytics"
      event_pattern = {
        source      = ["shopwizer.service-events"]
        detail-type = ["analytics.event"]
      }
      queue_arn = module.analytics_queue.queue_arn
    },

    # Email notifications
    {
      name_suffix = "email"
      event_pattern = {
        source      = ["shopwizer.service-events", "shopwizer.service-app"]
        detail-type = ["email.send"]
      }
      queue_arn = module.email_queue.queue_arn
    },

    # Job scheduling
    {
      name_suffix = "jobs"
      event_pattern = {
        source      = ["shopwizer.service-events", "shopwizer.service-app"]
        detail-type = ["job.schedule"]
      }
      queue_arn = module.jobs_queue.queue_arn
    },

    # Bulk products processing
    {
      name_suffix = "bulk-products"
      event_pattern = {
        source      = ["shopwizer.fn-bulk-products"]
        detail-type = ["product.bulk"]
      }
      queue_arn = module.bulk_products_queue.queue_arn
    },

    # Shop sync complete - signals all products have been ingested
    {
      name_suffix = "shop-sync-complete"
      event_pattern = {
        source      = ["shopwizer.fn-bulk-products"]
        detail-type = ["shop.sync-complete"]
      }
      queue_arn = module.bulk_products_queue.queue_arn
    }
  ]
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
  rule_name      = "${local.name_prefix}-orders"
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

  is_fifo                     = true
  allow_eventbridge           = true
  content_based_deduplication = true

  visibility_timeout_seconds = 300
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
}


# ########################################################################
# Products
# ########################################################################

module "shopify_products_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-shopify-products"

  is_fifo           = false
  allow_eventbridge = true

  visibility_timeout_seconds = 90
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
}

module "shopify_products_create_rule" {
  source         = "../../modules/event_rule"
  rule_name      = "${local.name_prefix}-products"
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

# ########################################################################
# Checkouts
# ########################################################################

module "shopify_checkouts_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-shopify-checkouts"

  is_fifo    = false
  create_dlq = true

  visibility_timeout_seconds = 90
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20

  allow_eventbridge = true
}

module "shopify_checkouts_create_rule" {
  source         = "../../modules/event_rule"
  rule_name      = "${local.name_prefix}-checkouts"
  event_bus_name = module.bus_shopify_partner.event_bus_name
  queue_arn      = module.shopify_checkouts_queue.queue_arn

  event_pattern_json = jsonencode({
    "source" : [{
      "prefix" : "aws.partner/shopify.com/"
    }],
    "detail-type" : ["shopifyWebhook"],
    "detail" : {
      "metadata" : {
        "X-Shopify-Topic" : [{ "prefix" : "checkouts/" }]
      }
    }
  })
}

# ##############################################################################

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

# ---- NEW: allow the Lambda to put events to EventBridge ----
data "aws_iam_policy_document" "lambda_put_events" {
  statement {
    sid       = "AllowPutEventsToEventBridge"
    effect    = "Allow"
    actions   = ["events:PutEvents"]
    resources = [module.internal_eventbridge.event_bus_arn]
  }
}

# ---- NEW: combine the S3 + SQS + EventBridge policies (single inline policy JSON for the module) ----
data "aws_iam_policy_document" "lambda_exec_combined" {
  source_policy_documents = [
    data.aws_iam_policy_document.lambda_read_bulk.json,
    data.aws_iam_policy_document.lambda_send_products_queue.json,
    data.aws_iam_policy_document.lambda_put_events.json
  ]
}

# ---- Lambda definition ----
module "lambda_products_ingest" {
  source          = "../../modules/lambda"
  function_name   = "${local.name_prefix}-products-ingest"
  runtime         = "nodejs20.x"
  timeout_seconds = 600
  handler         = "src/index.handler" # matches src/index.js in your artifact

  artifact_bucket_name = module.s3_lambda_artifacts.bucket_id
  code_s3_key          = aws_s3_object.seed_js.key

  environment = {
    BULK_QUEUE_URL              = module.shopify_products_queue.queue_url
    PRODUCT_BUCKET              = module.s3_product_bulk.bucket_id
    EVENT_BUS_NAME              = module.internal_eventbridge.event_bus_name
    PRISMA_QUERY_ENGINE_LIBRARY = "/var/task/libquery_engine-linux-arm64-openssl-3.0.x.so.node"
    SERVICE_NAME                = "fn-bulk-products"
    NODE_ENV                    = "production"
    LOG_LEVEL                   = "info"
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
# Task role policy (least privilege)
############################################

# Shared SQS policy for all ECS services - gives access to all queues with wildcard
data "aws_iam_policy_document" "shared_sqs_access" {
  statement {
    sid = "SQSFullAccess"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:SendMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
      "sqs:ChangeMessageVisibility"
    ]
    resources = ["arn:aws:sqs:${local.aws_region}:${data.aws_caller_identity.current.account_id}:${local.name_prefix}-*"]
  }

  statement {
    sid       = "EventBridgePutEvents"
    actions   = ["events:PutEvents"]
    resources = [module.internal_eventbridge.event_bus_arn]
  }
}

resource "aws_iam_policy" "shared_sqs_access" {
  name   = "${local.name_prefix}-shared-sqs-access"
  policy = data.aws_iam_policy_document.shared_sqs_access.json
}

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

data "aws_iam_policy_document" "app_task" {
  statement {
    sid       = "DynamoWriteHashes"
    actions   = ["dynamodb:PutItem", "dynamodb:ConditionCheckItem"]
    resources = [module.dynamodb_store.table_arn]
  }

  statement {
    sid     = "S3AccessProductBulk"
    actions = ["s3:GetObject", "s3:GetObjectVersion", "s3:ListBucket", "s3:PutObject"]
    resources = [
      module.s3_product_bulk.bucket_arn,
      "${module.s3_product_bulk.bucket_arn}/*"
    ]
  }

  statement {
    sid       = "CloudFrontInvalidateCache"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [module.cloudfront.distribution_arn]
  }
}

data "aws_iam_policy_document" "product_task" {
  statement {
    sid       = "DynamoWriteHashes"
    actions   = ["dynamodb:PutItem", "dynamodb:ConditionCheckItem"]
    resources = [module.dynamodb_store.table_arn]
  }

  statement {
    sid     = "S3ReadProductBulk"
    actions = ["s3:GetObject", "s3:GetObjectVersion", "s3:ListBucket"]
    resources = [
      module.s3_product_bulk.bucket_arn,
      "${module.s3_product_bulk.bucket_arn}/*"
    ]
  }
}

data "aws_iam_policy_document" "enrich_task" {
  statement {
    sid = "DynamoAccessHashes"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:Query",
      "dynamodb:UpdateItem"
    ]
    resources = [module.dynamodb_store.table_arn]
  }

  statement {
    sid     = "S3ReadProductBulk"
    actions = ["s3:GetObject", "s3:GetObjectVersion", "s3:ListBucket"]
    resources = [
      module.s3_product_bulk.bucket_arn,
      "${module.s3_product_bulk.bucket_arn}/*"
    ]
  }
}


############################################
# Logs for the service
############################################

resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ecs/${local.name_prefix}-app-remix"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "events" {
  name              = "/aws/ecs/${local.name_prefix}-events"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "enrich" {
  name              = "/aws/ecs/${local.name_prefix}-enrich"
  retention_in_days = 30
}

############################################
# ECS Service (Fargate)
############################################

module "ecr_app" {
  source = "../../modules/ecr"
  name   = "${local.name_prefix}-app-remix"
}

module "app_service" {
  source = "../../modules/ecs_service"

  name_prefix    = local.name_prefix
  service_prefix = "${local.name_prefix}-app-remix"

  cluster_arn        = module.ecs_cluster.cluster_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.ecs_tasks.id]

  log_group_name = aws_cloudwatch_log_group.app.name

  container = {
    image  = "${module.ecr_app.repository_url}:latest"
    port   = 3000
    cpu    = 256
    memory = 512

    environment = {
      LOG_LEVEL                  = "info"
      SCOPES                     = local.shopify_scopes
      BULK_UPLOAD_BUCKET         = module.s3_product_bulk.bucket_id
      CLOUDFRONT_DISTRIBUTION_ID = module.cloudfront.distribution_id
      PARTNER_EVENT_SOURCE       = local.shopify_partner_event_source
      SHOPIFY_APP_URL            = local.shopify_app_url
      SERVICE_NAME               = "app-remix"
      NODE_ENV                   = "production"
      SHOPIFY_BILLING_TEST       = "true"
    }

    secrets = [
      { name = "SHOPIFY_API_KEY", valueFrom = "${local.secrets_arn}:SHOPIFY_API_KEY::" },
      { name = "SHOPIFY_API_SECRET", valueFrom = "${local.secrets_arn}:SHOPIFY_API_SECRET::" },
      { name = "DATABASE_URL", valueFrom = "${local.secrets_arn}:DATABASE_URL::" },
      { name = "EVENT_BUS_NAME", valueFrom = aws_ssm_parameter.event_bus_name.arn }
    ]
  }


  load_balancer = {
    target_group_arn = module.tg_app.arn
    container_port   = 3000
  }

  autoscaling = {
    min_capacity = 1
    max_capacity = 1
    policies = [{
      name         = "cpu-50"
      metric_type  = "CPU"
      target_value = 50
    }]
  }

  desired_count = 1

  task_inline_policy_json  = data.aws_iam_policy_document.app_task.json
  task_managed_policy_arns = [aws_iam_policy.shared_sqs_access.arn]

  secrets_arns = [local.secrets_arn]

  # runtime niceties
  propagate_tags   = "TASK_DEFINITION"
  assign_public_ip = false
}


module "ecr_events" {
  source = "../../modules/ecr"
  name   = "${local.name_prefix}-service-events"
}

module "event_service" {
  source = "../../modules/ecs_service"

  name_prefix    = local.name_prefix
  service_prefix = "${local.name_prefix}-events"

  cluster_arn        = module.ecs_cluster.cluster_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.ecs_tasks.id]

  log_group_name = aws_cloudwatch_log_group.events.name

  container = {
    image  = "${module.ecr_events.repository_url}:latest"
    port   = 3000
    cpu    = 256
    memory = 512

    environment = {
      LOG_LEVEL    = "info"
      SERVICE_NAME = "service-events"
      NODE_ENV     = "production"
    }

    secrets = [
      { name = "DATABASE_URL", valueFrom = "${local.secrets_arn}:DATABASE_URL::" },
      { name = "PRODUCTS_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_products.arn },
      { name = "PRODUCTS_BULK_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_bulk_products.arn },
      { name = "ORDERS_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_orders.arn },
      { name = "CHECKOUTS_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_checkouts.arn },
      { name = "ENRICH_PRODUCTS_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_enrich.arn },
      { name = "ENRICH_STATE_TABLE_NAME", valueFrom = aws_ssm_parameter.enrich_state_table_name.arn },
      { name = "EVENT_BUS_NAME", valueFrom = aws_ssm_parameter.event_bus_name.arn }
    ]
  }

  autoscaling = {
    min_capacity = 1
    max_capacity = 10
    policies = [{
      name         = "cpu-50"
      metric_type  = "CPU"
      target_value = 50
    }]
  }

  desired_count = 1

  task_inline_policy_json  = data.aws_iam_policy_document.product_task.json
  task_managed_policy_arns = [aws_iam_policy.shared_sqs_access.arn]

  secrets_arns = [local.secrets_arn]

  propagate_tags   = "TASK_DEFINITION"
  assign_public_ip = false
}

# ------------------------------------------------------------
# SQS backlog autoscaling for the events service (GENTLE)
# Scales +1 instance per 50 messages
# ------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "events_scale_out" {
  alarm_name          = "${local.name_prefix}-events-queue-high"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = module.shopify_products_queue.queue_name }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 50 # Trigger at 50 messages
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [aws_appautoscaling_policy.events_scale_out.arn]
}

resource "aws_appautoscaling_policy" "events_scale_out" {
  name               = "${local.name_prefix}-events-scale-out"
  policy_type        = "StepScaling"
  resource_id        = module.event_service.autoscaling_target_id
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    # 50-100 messages: +1 task
    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 50
      scaling_adjustment          = 1
    }

    # 100-200 messages: +2 tasks
    step_adjustment {
      metric_interval_lower_bound = 50
      metric_interval_upper_bound = 150
      scaling_adjustment          = 2
    }

    # 200-350 messages: +3 tasks
    step_adjustment {
      metric_interval_lower_bound = 150
      metric_interval_upper_bound = 300
      scaling_adjustment          = 3
    }

    # 350-500 messages: +5 tasks
    step_adjustment {
      metric_interval_lower_bound = 300
      metric_interval_upper_bound = 450
      scaling_adjustment          = 5
    }

    # 500+ messages: scale to max (10)
    step_adjustment {
      metric_interval_lower_bound = 450
      scaling_adjustment          = 10
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "events_scale_in" {
  alarm_name          = "${local.name_prefix}-events-queue-low"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = module.shopify_products_queue.queue_name }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "LessThanOrEqualToThreshold"
  alarm_actions       = [aws_appautoscaling_policy.events_scale_in.arn]
}

resource "aws_appautoscaling_policy" "events_scale_in" {
  name               = "${local.name_prefix}-events-scale-in"
  policy_type        = "StepScaling"
  resource_id        = module.event_service.autoscaling_target_id
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -2
    }
  }
}

module "ecr_enrich" {
  source = "../../modules/ecr"
  name   = "${local.name_prefix}-service-enrich"
}

module "enrich_service" {
  source = "../../modules/ecs_service"

  name_prefix    = local.name_prefix
  service_prefix = "${local.name_prefix}-enrich"

  cluster_arn        = module.ecs_cluster.cluster_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.ecs_tasks.id]

  log_group_name = aws_cloudwatch_log_group.enrich.name

  container = {
    image  = "${module.ecr_enrich.repository_url}:latest"
    port   = 3000
    cpu    = 256
    memory = 512

    environment = {
      LOG_LEVEL    = "info"
      SERVICE_NAME = "service-enrich"
      NODE_ENV     = "production"
    }

    secrets = [
      { name = "OPENAI_API_KEY", valueFrom = "${local.secrets_arn}:OPENAI_API_KEY::" },
      { name = "DATABASE_URL", valueFrom = "${local.secrets_arn}:DATABASE_URL::" },
      { name = "ENRICH_PRODUCTS_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_enrich.arn },
      { name = "ENRICH_STATE_TABLE_NAME", valueFrom = aws_ssm_parameter.enrich_state_table_name.arn },
      { name = "EVENT_BUS_NAME", valueFrom = aws_ssm_parameter.event_bus_name.arn }
    ]
  }

  autoscaling = {
    min_capacity = 1
    max_capacity = 10
    policies = [{
      name         = "cpu-50"
      metric_type  = "CPU"
      target_value = 50
    }]
  }

  desired_count = 1

  task_inline_policy_json  = data.aws_iam_policy_document.enrich_task.json
  task_managed_policy_arns = [aws_iam_policy.shared_sqs_access.arn]

  secrets_arns = [local.secrets_arn]

  propagate_tags   = "TASK_DEFINITION"
  assign_public_ip = false
}

# ------------------------------------------------------------
# SQS backlog autoscaling for the enrich service (GENTLE)
# Scales +1 instance per 50 messages
# ------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "enrich_scale_out" {
  alarm_name          = "${local.name_prefix}-enrich-queue-high"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = module.enrich_products_queue.queue_name }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 50 # Trigger at 50 messages
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [aws_appautoscaling_policy.enrich_scale_out.arn]
}

resource "aws_appautoscaling_policy" "enrich_scale_out" {
  name               = "${local.name_prefix}-enrich-scale-out"
  policy_type        = "StepScaling"
  resource_id        = module.enrich_service.autoscaling_target_id
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    # 50-100 messages: +1 task
    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 50
      scaling_adjustment          = 1
    }

    # 100-200 messages: +2 tasks
    step_adjustment {
      metric_interval_lower_bound = 50
      metric_interval_upper_bound = 150
      scaling_adjustment          = 2
    }

    # 200-350 messages: +3 tasks
    step_adjustment {
      metric_interval_lower_bound = 150
      metric_interval_upper_bound = 300
      scaling_adjustment          = 3
    }

    # 350-500 messages: +5 tasks
    step_adjustment {
      metric_interval_lower_bound = 300
      metric_interval_upper_bound = 450
      scaling_adjustment          = 5
    }

    # 500+ messages: scale to max (10)
    step_adjustment {
      metric_interval_lower_bound = 450
      scaling_adjustment          = 10
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "enrich_scale_in" {
  alarm_name          = "${local.name_prefix}-enrich-queue-low"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = module.enrich_products_queue.queue_name }
  statistic           = "Sum"
  period              = 60 # Check every 60 seconds (was 120)
  evaluation_periods  = 1  # Just 1 period (was 2) = 1 min total
  threshold           = 0  # Scale in when queue is empty (was 1)
  comparison_operator = "LessThanOrEqualToThreshold"
  alarm_actions       = [aws_appautoscaling_policy.enrich_scale_in.arn]
}

resource "aws_appautoscaling_policy" "enrich_scale_in" {
  name               = "${local.name_prefix}-enrich-scale-in"
  policy_type        = "StepScaling"
  resource_id        = module.enrich_service.autoscaling_target_id
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60 # 60 second cooldown (was 120)
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -2 # Remove 2 tasks at a time (was -1)
    }
  }
}


# ----------------------------------------
# 1️⃣  SQS queue for analytics jobs
# ----------------------------------------
module "analytics_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-analytics"

  is_fifo    = false
  create_dlq = true

  # Standard defaults
  visibility_timeout_seconds = 300
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 20

  # Allow EventBridge to send messages directly to the queue
  allow_eventbridge = true
}


# ⏰ Hourly append job — runs at minute 15 past every hour
module "analytics_rule_hourly" {
  source    = "../../modules/event_rule"
  rule_name = "${local.name_prefix}-analytics-feature-hourly"
  schedule  = "cron(5 * * * ? *)" # every hour at HH:15 UTC
  queue_arn = module.analytics_queue.queue_arn

  message_body = jsonencode({ job_type = "FEATURE_HOURLY" })
}

# 🧾 Daily validation job — runs once a day at 02:00 UTC
module "analytics_rule_daily_validate" {
  source    = "../../modules/event_rule"
  rule_name = "${local.name_prefix}-analytics-feature-daily-validate"
  schedule  = "cron(0 2 * * ? *)" # every day at 02:00 UTC
  queue_arn = module.analytics_queue.queue_arn

  message_body = jsonencode({ job_type = "FEATURE_VALIDATE_DAILY" })
}

# ⏰ Rail hourly job — runs at minute 10 past every hour
module "analytics_rule_rail_hourly" {
  source    = "../../modules/event_rule"
  rule_name = "${local.name_prefix}-analytics-rail-hourly"
  schedule  = "cron(10 * * * ? *)" # every hour at HH:10 UTC
  queue_arn = module.analytics_queue.queue_arn

  message_body = jsonencode({ job_type = "RAIL_HOURLY" })
}

# 🧠 Graph weights daily — runs once a day at 01:00 UTC
module "analytics_rule_graph_weights_daily" {
  source    = "../../modules/event_rule"
  rule_name = "${local.name_prefix}-analytics-graph-weights-daily"
  schedule  = "cron(0 1 * * ? *)" # every day at 01:00 UTC
  queue_arn = module.analytics_queue.queue_arn

  message_body = jsonencode({ job_type = "GRAPH_WEIGHTS_DAILY" })
}

# 📈 Bundle metrics hourly — runs at minute 45 past every hour
module "analytics_rule_bundle_metrics_hourly" {
  source    = "../../modules/event_rule"
  rule_name = "${local.name_prefix}-analytics-bundle-metrics-hourly"
  schedule  = "cron(45 * * * ? *)" # every hour at HH:45 UTC
  queue_arn = module.analytics_queue.queue_arn

  message_body = jsonencode({ job_type = "BUNDLE_METRICS_HOURLY" })
}

# NOTE: RAIL_VALIDATE_DAILY was removed - no longer needed with hourly snapshot approach

# -----------------------------
# Athena Configuration
# -----------------------------
module "s3_athena_results" {
  source      = "../../modules/s3"
  bucket_name = "${local.name_prefix}-query-results"
}

resource "aws_athena_workgroup" "primary" {
  name = "primary"

  configuration {
    result_configuration {
      output_location = "s3://${module.s3_athena_results.bucket_id}/"
    }
    enforce_workgroup_configuration = true
  }
}

# -----------------------------
# Athena Database
# -----------------------------
resource "aws_athena_database" "px" {
  name   = "shopwizer_px"
  bucket = "dev-ue1-shopwizer-cf-logs-px-processed"
}


# -----------------------------
# Glue Table (Time-partitioned only, dynamic shop folders)
# -----------------------------
resource "aws_glue_catalog_table" "px_events" {
  name          = "px_events"
  database_name = aws_athena_database.px.name
  table_type    = "EXTERNAL_TABLE"

  storage_descriptor {
    # 👇 Points to the base folder that contains all year/month/day/hour/event partitions
    location      = "s3://${aws_athena_database.px.bucket}/parquet/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      name                  = "px_events"
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    # ✅ Columns that exist inside the Parquet files
    columns {
      name = "ts"
      type = "bigint"
    }
    columns {
      name = "shop"
      type = "string"
    }
    columns {
      name = "sid"
      type = "string"
    }
    columns {
      name = "pid"
      type = "string"
    }
    columns {
      name = "vid"
      type = "string"
    }
    columns {
      name = "plc"
      type = "string"
    }
    columns {
      name = "rail"
      type = "string"
    }
    columns {
      name = "src_pid"
      type = "string"
    }
    # 🆕 Training fields (for reco_click)
    columns {
      name = "slate_id"
      type = "string"
    }
    columns {
      name = "p"
      type = "string"
    }
    columns {
      name = "ps"
      type = "string"
    }
  }

  # Partition keys (string type for Hive-style partitions)
  partition_keys {
    name = "year"
    type = "string"
  }
  partition_keys {
    name = "month"
    type = "string"
  }
  partition_keys {
    name = "day"
    type = "string"
  }
  partition_keys {
    name = "hour"
    type = "string"
  }
  partition_keys {
    name = "event"
    type = "string"
  }
  parameters = {
    classification  = "parquet"
    compressionType = "none"
    typeOfData      = "file"

    # Enable partition projection - Athena dynamically builds paths from query
    "projection.enabled" = "true"

    # Integer projections - explicit definition for better Athena query planning
    "projection.year.type"   = "integer"
    "projection.year.range"  = "2020,2030"
    "projection.year.digits" = "4"

    "projection.month.type"   = "integer"
    "projection.month.range"  = "1,12"
    "projection.month.digits" = "2"

    "projection.day.type"   = "integer"
    "projection.day.range"  = "1,31"
    "projection.day.digits" = "2"

    # Use enum for hour so we can scan ALL hours in daily jobs (injected requires explicit value)
    "projection.hour.type"   = "enum"
    "projection.hour.values" = "00,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23"

    "projection.event.type"   = "enum"
    "projection.event.values" = "view_prod,reco_click,reco_load,reco_view,add_cart"

    # Template path - uses injected values directly
    "storage.location.template" = "s3://${aws_athena_database.px.bucket}/parquet/year=$${year}/month=$${month}/day=$${day}/hour=$${hour}/event=$${event}/"
  }
}

# -----------------------------
# Athena Database
# -----------------------------
resource "aws_athena_database" "fs" {
  name   = "shopwizer_feature_snapshots"
  bucket = "dev-ue1-shopwizer-feature-snapshots"
}

# -----------------------------
# Glue Table for Daily Feature Snapshots
# -----------------------------
resource "aws_glue_catalog_table" "feature_snapshots" {
  name          = "feature_snapshots"
  database_name = aws_athena_database.fs.name
  table_type    = "EXTERNAL_TABLE"

  storage_descriptor {
    location      = "s3://${aws_athena_database.fs.bucket}/parquet/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      name                  = "feature_snapshots"
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    # These are the columns INSIDE your Parquet snapshot file
    columns {
      name = "productid"
      type = "string"
    }
    columns {
      name = "views24h"
      type = "int"
    }
    columns {
      name = "views7d"
      type = "int"
    }
    columns {
      name = "views30d"
      type = "int"
    }
    columns {
      name = "clicks24h"
      type = "int"
    }
    columns {
      name = "clicks7d"
      type = "int"
    }
    columns {
      name = "clicks30d"
      type = "int"
    }
    columns {
      name = "orders7d"
      type = "int"
    }
    columns {
      name = "orders30d"
      type = "int"
    }
    columns {
      name = "revenue7d"
      type = "double"
    }
    columns {
      name = "revenue30d"
      type = "double"
    }
    columns {
      name = "bestsellerscore"
      type = "double"
    }
    columns {
      name = "trendingscore"
      type = "double"
    }
  }

  # -----------------------------
  # PARTITIONS
  # -----------------------------
  partition_keys {
    name = "shopid"
    type = "string"
  }

  partition_keys {
    name = "date"
    type = "string"
  }

  parameters = {
    classification       = "parquet"
    typeOfData           = "file"
    "projection.enabled" = "true"

    # Dynamic shop ids
    "projection.shopid.type"   = "enum"
    "projection.shopid.values" = "dev-recommender.myshopify.com" # add more later

    # Date partition (daily snapshots)
    "projection.date.type"   = "date"
    "projection.date.range"  = "2020-01-01,NOW"
    "projection.date.format" = "yyyy-MM-dd"

    # S3 folder template
    "storage.location.template" = "s3://${aws_athena_database.fs.bucket}/parquet/shopId=$${shopid}/date=$${date}/"
  }
}



# ########################################################################
# Analytics Service (ECS)
# ########################################################################

resource "aws_cloudwatch_log_group" "analytics" {
  name              = "/aws/ecs/${local.name_prefix}-analytics"
  retention_in_days = 7
}

data "aws_iam_policy_document" "analytics_task" {
  # Read/Write to Processed and Archive Buckets
  statement {
    sid = "S3AnalyticsAccess"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:DeleteObject"
    ]
    resources = [
      module.cloudfront_px.processed_bucket_arn,
      "${module.cloudfront_px.processed_bucket_arn}/*",
      module.cloudfront_px.archived_bucket_arn,
      "${module.cloudfront_px.archived_bucket_arn}/*"
    ]
  }

  statement {
    sid = "AthenaAnalyticsAccess"
    actions = [
      "athena:StartQueryExecution",
      "athena:GetQueryExecution",
      "athena:GetQueryResults",
      "athena:StopQueryExecution",
      "athena:ListQueryExecutions",
      "glue:GetTable",
      "glue:GetPartitions",
      "glue:GetDatabase",
      "glue:GetDatabases",
      "glue:GetTables"
    ]
    resources = ["*"]
  }

  statement {
    sid = "S3AthenaResultsAccess"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "s3:AbortMultipartUpload"
    ]
    resources = [
      "arn:aws:s3:::aws-athena-query-results-*",
      module.s3_athena_results.bucket_arn,
      "${module.s3_athena_results.bucket_arn}/*"
    ]
  }

  # Read secrets (DB URL)
  statement {
    sid       = "SecretsManagerRead"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [local.secrets_arn]
  }
}

module "ecr_analytics" {
  source = "../../modules/ecr"
  name   = "${local.name_prefix}-service-analytics"
}

module "analytics_service" {
  source = "../../modules/ecs_service"

  name_prefix    = local.name_prefix
  service_prefix = "${local.name_prefix}-analytics"

  cluster_arn        = module.ecs_cluster.cluster_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.ecs_tasks.id] # Use same SG as other tasks

  log_group_name = aws_cloudwatch_log_group.analytics.name

  container = {
    image  = "${module.ecr_analytics.repository_url}:latest"
    port   = 3000
    cpu    = 256
    memory = 512

    environment = {
      PROCESSED_BUCKET    = module.cloudfront_px.processed_bucket_id
      ARCHIVE_BUCKET      = module.cloudfront_px.archived_bucket_id
      ANALYTICS_QUEUE_URL = module.analytics_queue.queue_url
      ATHENA_WORKGROUP    = aws_athena_workgroup.primary.name
      ATHENA_DB           = aws_athena_database.px.name
      ATHENA_OUTPUT       = "s3://${module.s3_athena_results.bucket_id}/"
      LOG_LEVEL           = "info"
      SERVICE_NAME        = "service-analytics"
      NODE_ENV            = "production"
    }

    secrets = [
      { name = "DATABASE_URL", valueFrom = "${local.secrets_arn}:DATABASE_URL::" }
    ]
  }

  desired_count = 1

  task_inline_policy_json  = data.aws_iam_policy_document.analytics_task.json
  task_managed_policy_arns = [aws_iam_policy.shared_sqs_access.arn]
  secrets_arns             = [local.secrets_arn]

  propagate_tags   = "TASK_DEFINITION"
  assign_public_ip = false
}

module "jobs_queue" {
  source     = "../../modules/sqs"
  base_name  = "${local.name_prefix}-jobs"
  is_fifo    = false
  create_dlq = true

  visibility_timeout_seconds = 300
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
}

# module "jobs_scheduler_rule" {
#   source    = "../../modules/event_rule"
#   rule_name = "${local.name_prefix}-jobs-scheduler"
#   schedule  = "rate(5 minutes)"
#   queue_arn = module.jobs_queue.queue_arn

#   message_body = jsonencode({ job_type = "scheduler_tick" })
# }

module "ecr_jobs_worker" {
  source = "../../modules/ecr"
  name   = "${local.name_prefix}-service-jobs-worker"
}

resource "aws_cloudwatch_log_group" "jobs_worker" {
  name              = "/aws/ecs/${local.name_prefix}-jobs-worker"
  retention_in_days = 14
}

module "jobs_worker_service" {
  source = "../../modules/ecs_service"

  name_prefix    = local.name_prefix
  service_prefix = "${local.name_prefix}-jobs-worker"

  cluster_arn        = module.ecs_cluster.cluster_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.ecs_tasks.id]
  log_group_name     = aws_cloudwatch_log_group.jobs_worker.name

  container = {
    image  = "${module.ecr_jobs_worker.repository_url}:latest"
    port   = 3000
    cpu    = 256
    memory = 512

    environment = {
      LOG_LEVEL        = "info"
      ATHENA_WORKGROUP = aws_athena_workgroup.primary.name
      SERVICE_NAME     = "service-jobs-worker"
      NODE_ENV         = "production"
      CURRENCY_BUCKET  = module.s3_currency.bucket_id
    }

    secrets = [
      { name = "DATABASE_URL", valueFrom = "${local.secrets_arn}:DATABASE_URL::" },
      { name = "JOB_QUEUE_URL", valueFrom = aws_ssm_parameter.queue_jobs.arn },
      { name = "CURRENCY_API_KEY", valueFrom = "${local.secrets_arn}:CURRENCY_API_KEY::" }
    ]
  }

  desired_count = 1

  task_inline_policy_json  = data.aws_iam_policy_document.jobs_worker_task_inline.json
  task_managed_policy_arns = [aws_iam_policy.shared_sqs_access.arn]

  secrets_arns = [local.secrets_arn]

  propagate_tags   = "TASK_DEFINITION"
  assign_public_ip = false
}

data "aws_iam_policy_document" "jobs_worker_task_inline" {
  statement {
    sid = "ConsumeJobsQueue"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ChangeMessageVisibility",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]
    resources = [module.jobs_queue.queue_arn]
  }

  statement {
    sid       = "CloudWatchLogsWrite"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.jobs_worker.name}:*"]
  }

  statement {
    sid = "AthenaGlennAccess"
    actions = [
      "athena:StartQueryExecution",
      "athena:GetQueryExecution",
      "athena:GetQueryResults",
      "athena:StopQueryExecution",
      "athena:ListQueryExecutions",
      "glue:GetTable",
      "glue:GetPartitions",
      "glue:GetDatabase",
      "glue:GetDatabases",
      "glue:GetTables"
    ]
    resources = ["*"]
  }

  statement {
    sid = "S3DataReadWrite"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "s3:AbortMultipartUpload"
    ]
    resources = [
      module.cloudfront_px.processed_bucket_arn,
      "${module.cloudfront_px.processed_bucket_arn}/*",
      "arn:aws:s3:::aws-athena-query-results-*", # Default Athena results bucket
      module.s3_athena_results.bucket_arn,
      "${module.s3_athena_results.bucket_arn}/*",
      module.s3_currency.bucket_arn,
      "${module.s3_currency.bucket_arn}/*"
    ]
  }
}


# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------



module "dns_cf_currency" {
  source         = "../../modules/dns_records"
  root_domain    = local.root_domain
  hosted_zone_id = module.acm_certs.zone_id

  create_cf_records = true
  cf_subdomains     = ["currency"]

  cf_domain_name = module.cloudfront_currency.distribution_domain_name
  cf_zone_id     = module.cloudfront_currency.hosted_zone_id
}

module "s3_currency" {
  source           = "../../modules/s3"
  bucket_name      = "${local.name_prefix}-currency"
  enforce_ssl_only = false # Managed by CloudFront OAC module
}

module "cloudfront_currency" {
  source      = "../../modules/cloudfront_s3_oac"
  name_prefix = "${local.name_prefix}-currency"

  s3_bucket_id                   = module.s3_currency.bucket_id
  s3_bucket_arn                  = module.s3_currency.bucket_arn
  s3_bucket_regional_domain_name = module.s3_currency.bucket_regional_domain_name

  aliases             = ["currency.${local.root_domain}"]
  acm_certificate_arn = module.acm_certs.cloudfront_cert_arn
  default_root_object = "latest.json"
}

module "email_queue" {
  source    = "../../modules/sqs"
  base_name = "${local.name_prefix}-email"

  is_fifo    = false
  create_dlq = true

  visibility_timeout_seconds = 660 # Must be >= Lambda timeout (600s)
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20

  allow_eventbridge = true
}

# --------------------------------------------------------------------
# 2️⃣ IAM Policy for Lambda: consume SQS + write logs + read SSM + send via SES
# --------------------------------------------------------------------
data "aws_iam_policy_document" "lambda_email_exec" {
  statement {
    sid = "ConsumeEmailQueue"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ChangeMessageVisibility",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]
    resources = [module.email_queue.queue_arn]
  }

  statement {
    sid       = "CloudWatchLogs"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"]
  }

  # Optional if using SES directly
  statement {
    sid       = "AllowSESSend"
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }

  # Read from Secrets Manager
  statement {
    sid       = "SecretsManagerRead"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [local.secrets_arn]
  }
}

# Read secrets for email sender
data "aws_secretsmanager_secret_version" "email_sender_secrets" {
  secret_id = local.secrets_arn
}

# --------------------------------------------------------------------
# 3️⃣ Lambda Function (pulls from SQS automatically)
# --------------------------------------------------------------------
module "lambda_email_sender" {
  source          = "../../modules/lambda"
  function_name   = "${local.name_prefix}-email-sender"
  runtime         = "nodejs20.x"
  timeout_seconds = 600
  handler         = "src/index.handler"

  artifact_bucket_name = module.s3_lambda_artifacts.bucket_id
  code_s3_key          = aws_s3_object.seed_js.key

  # Secrets Manager ARN - Lambda fetches secrets at runtime
  environment = {
    DATABASE_URL                = jsondecode(data.aws_secretsmanager_secret_version.job_scheduler_secrets.secret_string)["DATABASE_URL"]
    SECRETS_ARN                 = local.secrets_arn
    SQS_EMAIL_URL               = module.email_queue.queue_url
    FROM_EMAIL                  = "team@${local.root_domain}"
    RESEND_API_KEY              = jsondecode(data.aws_secretsmanager_secret_version.email_sender_secrets.secret_string)["RESEND_API_KEY"]
    PRISMA_QUERY_ENGINE_LIBRARY = "/var/task/libquery_engine-linux-arm64-openssl-3.0.x.so.node"
    LOG_LEVEL                   = "info"
    SERVICE_NAME                = "fn-email"
    NODE_ENV                    = "production"
  }

  exec_inline_policy_json = data.aws_iam_policy_document.lambda_email_exec.json
  depends_on              = [aws_s3_object.seed_js]
}

# --------------------------------------------------------------------
# 4️⃣ Wire SQS → Lambda trigger
# --------------------------------------------------------------------
resource "aws_lambda_event_source_mapping" "lambda_email_sqs" {
  event_source_arn = module.email_queue.queue_arn
  function_name    = module.lambda_email_sender.function_arn
  batch_size       = 10
  enabled          = true
}


# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------
# -----------------------------------------------------------------------------------------------------------------------


# ########################################################################
# Job Scheduler Lambda - Runs every 5 minutes
# ########################################################################

# 1️⃣ IAM Policy for Job Scheduler Lambda
# Read key/value secrets for injection
data "aws_secretsmanager_secret_version" "job_scheduler_secrets" {
  secret_id = local.secrets_arn
}

data "aws_iam_policy_document" "lambda_job_scheduler_exec" {
  # Write logs
  statement {
    sid       = "CloudWatchLogs"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:${local.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-job-scheduler:*"]
  }

  # Send messages to the job queue
  statement {
    sid = "SQSSendJobs"
    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]
    resources = [module.jobs_queue.queue_arn]
  }

  # Read from Secrets Manager
  statement {
    sid       = "SecretsManagerRead"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [local.secrets_arn]
  }
}

# 2️⃣ Lambda Function
module "lambda_job_scheduler" {
  source          = "../../modules/lambda"
  function_name   = "${local.name_prefix}-job-scheduler"
  description     = "Scheduled job dispatcher - runs every 5 minutes"
  runtime         = "nodejs20.x"
  timeout_seconds = 600
  handler         = "src/index.handler"

  artifact_bucket_name = module.s3_lambda_artifacts.bucket_id
  code_s3_key          = aws_s3_object.seed_js.key

  environment = {
    DATABASE_URL                = jsondecode(data.aws_secretsmanager_secret_version.job_scheduler_secrets.secret_string)["DATABASE_URL"]
    JOB_QUEUE_URL               = module.jobs_queue.queue_url
    PRISMA_QUERY_ENGINE_LIBRARY = "/var/task/libquery_engine-linux-arm64-openssl-3.0.x.so.node"
    LOG_LEVEL                   = "info"
    SERVICE_NAME                = "fn-job-scheduler"
    NODE_ENV                    = "production"
  }

  exec_inline_policy_json = data.aws_iam_policy_document.lambda_job_scheduler_exec.json
  depends_on              = [aws_s3_object.seed_js]
}

# 3️⃣ EventBridge Rule - Every 5 minutes
resource "aws_cloudwatch_event_rule" "job_scheduler_cron" {
  name                = "${local.name_prefix}-job-scheduler-cron"
  description         = "Triggers job scheduler Lambda every 5 minutes"
  schedule_expression = "rate(5 minutes)"
}

# 4️⃣ EventBridge Target - Lambda
resource "aws_cloudwatch_event_target" "job_scheduler_target" {
  rule      = aws_cloudwatch_event_rule.job_scheduler_cron.name
  target_id = "job-scheduler-lambda"
  arn       = module.lambda_job_scheduler.function_arn
}

# 5️⃣ Lambda Permission - Allow EventBridge to invoke
resource "aws_lambda_permission" "job_scheduler_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_job_scheduler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.job_scheduler_cron.arn
}

# ============================================================
# 💱 Daily Currency Refresh Cron - Runs at midnight UTC
# ============================================================
resource "aws_cloudwatch_event_rule" "currency_daily_cron" {
  name                = "${local.name_prefix}-currency-daily"
  description         = "Triggers currency refresh job daily at midnight UTC"
  schedule_expression = "cron(0 0 * * ? *)"
}

resource "aws_cloudwatch_event_target" "currency_daily_target" {
  rule      = aws_cloudwatch_event_rule.currency_daily_cron.name
  target_id = "currency-job-sqs"
  arn       = module.jobs_queue.queue_arn

  input = jsonencode({
    type = "CURRENCY"
  })
}

# 🎁 Bundle generation daily — runs once a day at 03:00 UTC (after graph weights)
resource "aws_cloudwatch_event_rule" "bundles_generate_daily_cron" {
  name                = "${local.name_prefix}-bundles-generate-daily"
  description         = "Triggers bundle generation job daily at 03:00 UTC"
  schedule_expression = "cron(0 3 * * ? *)"
}

resource "aws_cloudwatch_event_target" "bundles_generate_daily_target" {
  rule      = aws_cloudwatch_event_rule.bundles_generate_daily_cron.name
  target_id = "bundles-generate-job-sqs"
  arn       = module.jobs_queue.queue_arn

  input = jsonencode({
    type = "BUNDLE_GENERATE"
  })
}

# Allow EventBridge to send messages to the jobs queue
resource "aws_sqs_queue_policy" "currency_eventbridge_allow" {
  queue_url = module.jobs_queue.queue_url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowEventBridgeSendMessage"
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action    = "sqs:SendMessage"
        Resource  = module.jobs_queue.queue_arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = [
              aws_cloudwatch_event_rule.currency_daily_cron.arn,
              aws_cloudwatch_event_rule.bundles_generate_daily_cron.arn
            ]
          }
        }
      }
    ]
  })
}

# ########################################################################
# ########################################################################
# SSM Parameter Store - Configuration & Secrets
# ########################################################################
# ########################################################################

# ============================================================
# Secrets are managed externally in Secrets Manager
# ARNs are passed in via variables (see variables.tf / dev.tfvars)
# This keeps secret values OUT of Terraform state
# ============================================================
# Create your secret manually:
#   aws secretsmanager create-secret --name "dev-ue1-shopwizer/app-secrets" \
#     --secret-string '{"DATABASE_URL":"...","OPENAI_API_KEY":"...","SHOPIFY_API_KEY":"..."}'
#
# Then reference in dev.tfvars:
#   secrets_arn = "arn:aws:secretsmanager:us-east-1:xxx:secret:dev-ue1-shopwizer/app-secrets-xxxxxx"
# ============================================================

# ============================================================
# Infrastructure References (non-secret, but useful)
# ============================================================

resource "aws_ssm_parameter" "event_bus_name" {
  name        = "/${local.name_prefix}/infra/EVENT_BUS_NAME"
  description = "Internal EventBridge bus name"
  type        = "String"
  value       = module.internal_eventbridge.event_bus_name

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "event_bus_arn" {
  name        = "/${local.name_prefix}/infra/EVENT_BUS_ARN"
  description = "Internal EventBridge bus ARN"
  type        = "String"
  value       = module.internal_eventbridge.event_bus_arn

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "enrich_state_table_name" {
  name        = "/${local.name_prefix}/infra/ENRICH_STATE_TABLE_NAME"
  description = "DynamoDB table name for product enrichment state"
  type        = "String"
  value       = module.dynamodb_store.table_name

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "bucket_product_bulk" {
  name        = "/${local.name_prefix}/buckets/PRODUCT_BULK_BUCKET"
  description = "S3 bucket for bulk product uploads"
  type        = "String"
  value       = module.s3_product_bulk.bucket_id

  tags = { Environment = local.env }
}

# ============================================================
# Queue URLs (for services that need to send messages)
# ============================================================

resource "aws_ssm_parameter" "queue_orders" {
  name        = "/${local.name_prefix}/queues/ORDERS_QUEUE_URL"
  description = "Shopify orders SQS queue URL"
  type        = "String"
  value       = module.shopify_orders_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_products" {
  name        = "/${local.name_prefix}/queues/PRODUCTS_QUEUE_URL"
  description = "Shopify products SQS queue URL"
  type        = "String"
  value       = module.shopify_products_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_checkouts" {
  name        = "/${local.name_prefix}/queues/CHECKOUTS_QUEUE_URL"
  description = "Shopify checkouts SQS queue URL"
  type        = "String"
  value       = module.shopify_checkouts_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_enrich" {
  name        = "/${local.name_prefix}/queues/ENRICH_QUEUE_URL"
  description = "Product enrichment SQS queue URL"
  type        = "String"
  value       = module.enrich_products_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_analytics" {
  name        = "/${local.name_prefix}/queues/ANALYTICS_QUEUE_URL"
  description = "Analytics SQS queue URL"
  type        = "String"
  value       = module.analytics_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_email" {
  name        = "/${local.name_prefix}/queues/EMAIL_QUEUE_URL"
  description = "Email SQS queue URL"
  type        = "String"
  value       = module.email_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_jobs" {
  name        = "/${local.name_prefix}/queues/JOBS_QUEUE_URL"
  description = "Jobs scheduler SQS queue URL"
  type        = "String"
  value       = module.jobs_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_bulk_products" {
  name        = "/${local.name_prefix}/queues/BULK_PRODUCTS_QUEUE_URL"
  description = "Bulk products SQS queue URL"
  type        = "String"
  value       = module.bulk_products_queue.queue_url

  tags = { Environment = local.env }
}

# Note: SESSION_SECRET and ENCRYPTION_KEY are now in Secrets Manager
# They're accessed via: ${local.secrets_arn}:SESSION_SECRET::

resource "aws_ssm_parameter" "app_scopes" {
  name        = "/${local.name_prefix}/app/SCOPES"
  description = "Shopify OAuth scopes for the app"
  type        = "String"
  value       = local.shopify_scopes

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "partner_event_source" {
  name        = "/${local.name_prefix}/infra/PARTNER_EVENT_SOURCE"
  description = "Shopify partner EventBridge source name"
  type        = "String"
  value       = local.shopify_partner_source_name

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "queue_px_logs" {
  name        = "/${local.name_prefix}/queues/PX_QUEUE_URL"
  description = "Pixel logs SQS queue URL"
  type        = "String"
  value       = module.px_logs_queue.queue_url

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "bucket_px_logs" {
  name        = "/${local.name_prefix}/buckets/PX_LOGS_BUCKET"
  description = "CloudFront pixel logs bucket"
  type        = "String"
  value       = module.cloudfront_px.logs_bucket_id

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "bucket_processed" {
  name        = "/${local.name_prefix}/buckets/PROCESSED_BUCKET"
  description = "S3 bucket for processed analytics data"
  type        = "String"
  value       = module.cloudfront_px.processed_bucket_id

  tags = { Environment = local.env }
}

resource "aws_ssm_parameter" "bucket_archive" {
  name        = "/${local.name_prefix}/buckets/ARCHIVE_BUCKET"
  description = "S3 bucket for archived data"
  type        = "String"
  value       = module.cloudfront_px.archived_bucket_id

  tags = { Environment = local.env }
}

# ########################################################################
# ########################################################################
# CodeBuild - Database Migrations
# ########################################################################
# ########################################################################

# S3 bucket for CodeBuild source code uploads
module "s3_codebuild_source" {
  source      = "../../modules/s3"
  bucket_name = "${local.name_prefix}-codebuild-source"
}

module "codebuild_migrations" {
  source = "../../modules/codebuild"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids

  # S3 source for code uploads
  source_s3_bucket = module.s3_codebuild_source.bucket_id
  source_s3_key    = "migrations/source.zip"

  secrets_arns = [local.secrets_arn]
  ecr_arns     = [module.ecr_app.repository_arn]

  # Get DATABASE_URL from Secrets Manager
  secrets_env_vars = [
    {
      name       = "DATABASE_URL"
      value_from = "${local.secrets_arn}:DATABASE_URL::"
    }
  ]

  environment_variables = {
    NODE_ENV = "production"
  }

  # Placeholder - actual buildspec passed via --buildspec-override from GitLab
  buildspec = <<-EOF
    version: 0.2
    phases:
      build:
        commands:
          - echo "No buildspec provided - use --buildspec-override"
          - exit 1
  EOF

  tags = { Environment = local.env }
}

# Allow CodeBuild to connect to RDS Proxy
# resource "aws_security_group_rule" "codebuild_to_rds_proxy" {
#   type                     = "ingress"
#   from_port                = 5432
#   to_port                  = 5432
#   protocol                 = "tcp"
#   security_group_id        = module.aurora.proxy_security_group_id
#   source_security_group_id = module.codebuild_migrations.security_group_id
#   description              = "Allow CodeBuild migrations to access RDS Proxy"
# }


# ########################################################################
# Aurora Serverless v2 with RDS Proxy
# ########################################################################

# module "aurora" {
#   source      = "../../modules/aurora"
#   name_prefix = local.name_prefix

#   vpc_id                     = module.vpc.vpc_id
#   subnet_ids                 = module.vpc.private_subnet_ids
#   allowed_security_group_ids = [aws_security_group.ecs_tasks.id]

#   db_credentials_secret_name = local.db_credentials_secret_name
#   db_name                    = "shopwizerdb"

#   engine_version     = "17.4"
#   serverless_min_acu = 0.5
#   serverless_max_acu = 1

#   # ── RDS Proxy for connection pooling ─────────────────────
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
# SSM Bastion for local database access
# ########################################################################
# ########################################################################

# module "bastion" {
#   source      = "../../modules/bastion"
#   name_prefix = local.name_prefix

#   vpc_id    = module.vpc.vpc_id
#   subnet_id = module.vpc.private_subnet_ids[0]

#   rds_proxy_endpoint          = module.aurora.proxy_endpoint
#   rds_proxy_security_group_id = module.aurora.proxy_security_group_id

#   tags = { Environment = local.env }
# }

# # Allow bastion to connect to RDS Proxy
# resource "aws_security_group_rule" "bastion_to_rds_proxy" {
#   type                     = "ingress"
#   from_port                = 5432
#   to_port                  = 5432
#   protocol                 = "tcp"
#   security_group_id        = module.aurora.proxy_security_group_id
#   source_security_group_id = module.bastion.security_group_id
#   description              = "Allow bastion to access RDS Proxy"
# }

# ########################################################################
# BetterStack Log Forwarder
# Forwards all CloudWatch logs to BetterStack via Lambda
# ########################################################################

module "betterstack_logs" {
  source = "../../modules/betterstack_logs"

  name_prefix                = local.name_prefix
  betterstack_source_token   = local.logtail_source_token
  betterstack_ingesting_host = "s1657231.eu-nbg-2.betterstackdata.com"

  log_group_names = [
    # ECS Services
    aws_cloudwatch_log_group.app.name,
    aws_cloudwatch_log_group.events.name,
    aws_cloudwatch_log_group.enrich.name,
    aws_cloudwatch_log_group.px_worker.name,
    aws_cloudwatch_log_group.analytics.name,
    aws_cloudwatch_log_group.jobs_worker.name,
    aws_cloudwatch_log_group.category_embeddings.name,
    # Lambda Functions
    "/aws/lambda/${module.lambda_products_ingest.function_name}",
    "/aws/lambda/${module.lambda_email_sender.function_name}",
    "/aws/lambda/${module.lambda_job_scheduler.function_name}",
  ]
}

# ########################################
# Service: Category Embeddings (recommendations)
# ########################################

module "ecr_category_embeddings" {
  source = "../../modules/ecr"
  name   = "${local.name_prefix}-service-category-embeddings"
}

resource "aws_cloudwatch_log_group" "category_embeddings" {
  name              = "/aws/ecs/${local.name_prefix}-category-embeddings"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "category_embeddings_setup" {
  name              = "/aws/ecs/${local.name_prefix}-category-embeddings-setup"
  retention_in_days = 7
}

# Target Group
module "tg_category_embeddings" {
  source            = "../../modules/alb_target"
  name_prefix       = local.name_prefix
  service_name      = "embeddings" # max length constraints usually apply
  vpc_id            = module.vpc.vpc_id
  port              = 8003
  protocol          = "HTTP"
  health_check_path = "/health"
}

# ALB Rule
module "rule_category_embeddings" {
  source           = "../../modules/alb_rule"
  name_prefix      = "${local.name_prefix}-embeddings"
  listener_arn     = module.alb.https_listener_arn
  target_group_arn = module.tg_category_embeddings.arn
  priority         = 150 # Pick a free priority
  hostnames        = ["embeddings.${local.root_domain}"]
}

# IAM Policy (Minimal)
data "aws_iam_policy_document" "category_embeddings_task" {
  statement {
    sid       = "MinimalAccess"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }
}

# ECS Service
module "service_category_embeddings" {
  source = "../../modules/ecs_service"

  name_prefix    = local.name_prefix
  service_prefix = "${local.name_prefix}-category-embeddings"

  cluster_arn        = module.ecs_cluster.cluster_arn
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.ecs_tasks.id]

  log_group_name = aws_cloudwatch_log_group.category_embeddings.name

  container = {
    image  = "${module.ecr_category_embeddings.repository_url}:latest"
    port   = 8003
    cpu    = 256
    memory = 512

    environment = {
      LOG_LEVEL  = "info"
      MODEL_PATH = "model/category2vec.model"
    }

    secrets = [
      { name = "DATABASE_URL", valueFrom = "${local.secrets_arn}:DATABASE_URL::" },
      { name = "OPENAI_API_KEY", valueFrom = "${local.secrets_arn}:OPENAI_API_KEY::" }
    ]
  }

  desired_count = 1

  task_inline_policy_json = data.aws_iam_policy_document.category_embeddings_task.json
  # No extra managed policies needed for now
  task_managed_policy_arns = []

  secrets_arns = [local.secrets_arn]

  propagate_tags   = "TASK_DEFINITION"
  assign_public_ip = false
}
