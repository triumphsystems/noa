variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "noa"
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for application data"
  type        = string
  default     = "noa-data"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "app_url" {
  description = "Application URL (e.g. https://noa.yourdomain.com)"
  type        = string
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops@noa.yourdomain.com"
}

variable "enable_monitoring" {
  description = "Create CloudWatch log group, SNS topic, and alarms. Recommended for prod only."
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30
}

variable "enable_s3_versioning" {
  description = "Enable S3 versioning on the audio bucket. Suspended by default to avoid accumulating old-version storage costs."
  type        = bool
  default     = false
}

variable "s3_expiry_days" {
  description = "Days after which current S3 objects are permanently deleted"
  type        = number
  default     = 365
}

variable "enable_s3_replication" {
  description = "Create a backup S3 bucket for cross-region replication"
  type        = bool
  default     = false
}

variable "s3_replication_region" {
  description = "Destination region for S3 replication"
  type        = string
  default     = "us-west-2"
}

variable "tags" {
  description = "Additional tags applied to all resources"
  type        = map(string)
  default = {
    Component  = "NoaMedicalPlatform"
    CostCenter = "Engineering"
  }
}
