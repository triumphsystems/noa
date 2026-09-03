# Data source to get current AWS account
data "aws_caller_identity" "current" {}

# ============================================
# DynamoDB Table for Application Data
# ============================================

resource "aws_dynamodb_table" "noa_db" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "type"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "doctorId"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  # KEYS_ONLY avoids duplicating every item attribute into each index.
  # Add INCLUDE projections here only if a specific query needs extra fields.
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    range_key       = "type"
    projection_type = "KEYS_ONLY"
  }

  global_secondary_index {
    name            = "doctorId-index"
    hash_key        = "doctorId"
    range_key       = "type"
    projection_type = "KEYS_ONLY"
  }

  global_secondary_index {
    name            = "patientId-index"
    hash_key        = "patientId"
    range_key       = "type"
    projection_type = "KEYS_ONLY"
  }

  tags = merge(
    var.tags,
    {
      Name    = var.dynamodb_table_name
      Purpose = "Medical platform data storage"
    }
  )
}

# ============================================
# S3 Bucket for Audio and Document Storage
# ============================================

resource "aws_s3_bucket" "audio_bucket" {
  bucket = "${var.project_name}-audio-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-audio-bucket"
      Purpose = "Medical consultation recordings and documents"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning is suspended by default to avoid accumulating old-version
# storage costs. Enable it only in production via var.enable_s3_versioning.
resource "aws_s3_bucket_versioning" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  versioning_configuration {
    status = var.enable_s3_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy:
# - Move to STANDARD_IA after 30 days (retrieval is instant, cheaper for
#   infrequently accessed audio; avoids Glacier's retrieval delays and
#   90-day minimum storage charge).
# - Expire current objects after var.s3_expiry_days (default 365).
# - Clean up noncurrent versions quickly if versioning is enabled.
resource "aws_s3_bucket_lifecycle_configuration" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  rule {
    id     = "tiered-storage"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = var.s3_expiry_days
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# ============================================
# Backup Bucket (optional)
# ============================================

resource "aws_s3_bucket" "backup_bucket" {
  count  = var.enable_s3_replication ? 1 : 0
  bucket = "${var.project_name}-backup-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-backup-bucket"
      Purpose = "Backup and disaster recovery"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "backup_bucket" {
  count  = var.enable_s3_replication ? 1 : 0
  bucket = aws_s3_bucket.backup_bucket[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_bucket" {
  count  = var.enable_s3_replication ? 1 : 0
  bucket = aws_s3_bucket.backup_bucket[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ============================================
# Vercel OIDC Identity Provider (Zero Static Keys)
# ============================================

resource "aws_iam_openid_connect_provider" "vercel" {
  count           = var.enable_vercel_oidc ? 1 : 0
  url             = "https://oidc.vercel.com"
  client_id_list  = ["https://vercel.com"]
  thumbprint_list = ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-vercel-oidc"
      Purpose = "Vercel OpenID Connect identity federation"
    }
  )
}

# ============================================
# IAM Role — single role for all app access
# ============================================

# One role covers Bedrock + DynamoDB + S3. Fewer sts:AssumeRole calls
# from the app, and supports both traditional IAM and Vercel OIDC.
resource "aws_iam_role" "app_role" {
  name = "${var.project_name}-app-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Principal = {
            AWS = "arn:aws:iam::${var.aws_account_id}:root"
          }
          Action = "sts:AssumeRole"
        }
      ],
      var.enable_vercel_oidc ? [
        {
          Effect = "Allow"
          Principal = {
            Federated = aws_iam_openid_connect_provider.vercel[0].arn
          }
          Action = "sts:AssumeRoleWithWebIdentity"
          Condition = {
            StringEquals = {
              "oidc.vercel.com:aud" = "https://vercel.com"
            }
            StringLike = {
              "oidc.vercel.com:sub" = "owner:*:project:${var.vercel_project_name}:environment:*"
            }
          }
        }
      ] : []
    )
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "bedrock_policy" {
  name = "${var.project_name}-bedrock-policy"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:ListFoundationModels"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}::foundation-model/*"
      },
      {
        Effect   = "Allow"
        Action   = ["bedrock:GetFoundationModel"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "${var.project_name}-dynamodb-policy"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.noa_db.arn,
          "${aws_dynamodb_table.noa_db.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "s3_policy" {
  name = "${var.project_name}-s3-policy"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audio_bucket.arn,
          "${aws_s3_bucket.audio_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================
# CloudWatch Logs (disabled by default)
# ============================================

resource "aws_cloudwatch_log_group" "noa_logs" {
  count             = var.enable_monitoring ? 1 : 0
  name              = "/aws/noa/${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-logs"
    }
  )
}

# ============================================
# SNS + CloudWatch Alarms (disabled by default)
# ============================================

resource "aws_sns_topic" "alerts" {
  count = var.enable_monitoring ? 1 : 0
  name  = "${var.project_name}-alerts-${var.environment}"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.enable_monitoring ? 1 : 0
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "bedrock_errors" {
  count               = var.enable_monitoring ? 1 : 0
  alarm_name          = "${var.project_name}-bedrock-errors"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]
  evaluation_periods  = 1
  metric_name         = "BedrockInvocationErrors"
  namespace           = "AWS/Bedrock"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"

  tags = var.tags
}

# ============================================
# Locals
# ============================================

locals {
  aws_region_output = var.aws_region
}
