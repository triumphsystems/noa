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
  description = "Project name for resource naming"
  type        = string
  default     = "noa"
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for application data"
  type        = string
  default     = "noa-data"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "app_url" {
  description = "Application URL"
  type        = string
}

variable "enable_bedrock" {
  description = "Enable Bedrock integration"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_s3_replication" {
  description = "Enable S3 cross-region replication for backups"
  type        = bool
  default     = false
}

variable "s3_replication_region" {
  description = "S3 replication destination region"
  type        = string
  default     = "us-west-2"
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default = {
    Component  = "NoaMedicalPlatform"
    CostCenter = "Engineering"
  }
}
