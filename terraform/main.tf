# Data source to get current AWS account
data "aws_caller_identity" "current" {}

# ============================================
# S3 Buckets for Audio and Backup Storage
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

# Block public access
resource "aws_s3_bucket_public_access_block" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable lifecycle policies
resource "aws_s3_bucket_lifecycle_configuration" "audio_bucket" {
  bucket = aws_s3_bucket.audio_bucket.id

  rule {
    id     = "archive-old-recordings"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# Backup bucket (optional, for replication)
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
# IAM Roles and Policies
# ============================================

# Bedrock Role
resource "aws_iam_role" "bedrock_role" {
  name = "${var.project_name}-bedrock-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# Bedrock access policy
resource "aws_iam_role_policy" "bedrock_policy" {
  name = "${var.project_name}-bedrock-policy"
  role = aws_iam_role.bedrock_role.id

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
        Effect = "Allow"
        Action = [
          "bedrock:GetFoundationModel"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 Role
resource "aws_iam_role" "s3_role" {
  name = "${var.project_name}-s3-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# S3 access policy
resource "aws_iam_role_policy" "s3_policy" {
  name = "${var.project_name}-s3-policy"
  role = aws_iam_role.s3_role.id

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
# CloudWatch Logs (Optional)
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
# SNS Topics for Alerts (Optional)
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
  endpoint  = "ops@noa.triumphsystems.tech"
}

# ============================================
# CloudWatch Alarms (Optional)
# ============================================

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
# Outputs for Configuration
# ============================================

locals {
  aws_region_output = var.aws_region
}
