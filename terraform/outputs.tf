output "s3_bucket_name" {
  description = "S3 bucket for audio and file storage"
  value       = aws_s3_bucket.audio_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 audio bucket"
  value       = aws_s3_bucket.audio_bucket.arn
}

output "backup_bucket_name" {
  description = "S3 backup bucket name (empty if replication disabled)"
  value       = try(aws_s3_bucket.backup_bucket[0].id, "")
}

output "backup_bucket_arn" {
  description = "ARN of the backup S3 bucket (empty if replication disabled)"
  value       = try(aws_s3_bucket.backup_bucket[0].arn, "")
}

output "dynamodb_table_name" {
  description = "DynamoDB table for application data"
  value       = aws_dynamodb_table.noa_db.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.noa_db.arn
}

output "app_role_arn" {
  description = "IAM role ARN for all app access (Bedrock + DynamoDB + S3)"
  value       = aws_iam_role.app_role.arn
}

output "app_role_name" {
  description = "IAM role name for all app access"
  value       = aws_iam_role.app_role.name
}

output "vercel_oidc_provider_arn" {
  description = "ARN of the Vercel OIDC Identity Provider (empty if disabled)"
  value       = try(aws_iam_openid_connect_provider.vercel[0].arn, "")
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name (empty if monitoring disabled)"
  value       = try(aws_cloudwatch_log_group.noa_logs[0].name, "")
}

output "environment_variables" {
  description = "Environment variables to configure in Vercel"
  sensitive   = true
  value = {
    AWS_REGION           = var.aws_region
    AWS_ACCOUNT_ID       = var.aws_account_id
    AWS_ROLE_ARN         = aws_iam_role.app_role.arn
    BEDROCK_REGION       = var.bedrock_region
    DYNAMODB_TABLE_NAME  = aws_dynamodb_table.noa_db.name
    S3_BUCKET            = aws_s3_bucket.audio_bucket.id
    S3_BACKUP_BUCKET     = try(aws_s3_bucket.backup_bucket[0].id, "")
    CLOUDWATCH_LOG_GROUP = try(aws_cloudwatch_log_group.noa_logs[0].name, "")
    COGNITO_USER_POOL_ID = aws_cognito_user_pool.noa_user_pool.id
    COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.noa_app_client.id
  }
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.noa_user_pool.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito App Client"
  value       = aws_cognito_user_pool_client.noa_app_client.id
}

output "deployment_instructions" {
  description = "Post-apply setup instructions"
  sensitive   = true
  value       = <<-EOT
    1. Copy these environment variables to your Vercel project:
       AWS_REGION=${var.aws_region}
       AWS_ACCOUNT_ID=${var.aws_account_id}
       AWS_ROLE_ARN=${aws_iam_role.app_role.arn}
       BEDROCK_REGION=${var.bedrock_region}
       DYNAMODB_TABLE_NAME=${aws_dynamodb_table.noa_db.name}
       S3_BUCKET=${aws_s3_bucket.audio_bucket.id}
       S3_BACKUP_BUCKET=${try(aws_s3_bucket.backup_bucket[0].id, "")}

    2. Verify DynamoDB:
       aws dynamodb describe-table --table-name ${aws_dynamodb_table.noa_db.name} --region ${var.aws_region}

    3. Verify Bedrock:
       aws bedrock list-foundation-models --region ${var.aws_region}

    4. Verify S3:
       aws s3 ls s3://${aws_s3_bucket.audio_bucket.id} --region ${var.aws_region}

    5. Deploy:
       git push origin main
  EOT
}
