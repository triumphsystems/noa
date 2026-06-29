output "s3_bucket_name" {
  description = "S3 bucket for audio and file storage"
  value       = aws_s3_bucket.audio_bucket.id
}

output "dynamodb_table_name" {
  description = "DynamoDB table for application data"
  value       = aws_dynamodb_table.noa_db.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.noa_db.arn
}

output "s3_bucket_arn" {
  description = "ARN of the S3 audio bucket"
  value       = aws_s3_bucket.audio_bucket.arn
}

output "backup_bucket_name" {
  description = "S3 bucket for backups"
  value       = try(aws_s3_bucket.backup_bucket[0].id, "")
}

output "backup_bucket_arn" {
  description = "ARN of the backup S3 bucket"
  value       = try(aws_s3_bucket.backup_bucket[0].arn, "")
}

output "bedrock_role_arn" {
  description = "IAM role ARN for Bedrock access"
  value       = aws_iam_role.bedrock_role.arn
}

output "bedrock_role_name" {
  description = "IAM role name for Bedrock access"
  value       = aws_iam_role.bedrock_role.name
}

output "s3_role_arn" {
  description = "IAM role ARN for S3 access"
  value       = aws_iam_role.s3_role.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = try(aws_cloudwatch_log_group.noa_logs[0].name, "")
}

output "environment_variables" {
  description = "Environment variables to add to Vercel"
  value = {
    AWS_REGION           = var.aws_region
    AWS_ACCOUNT_ID       = var.aws_account_id
    AWS_ROLE_ARN         = aws_iam_role.bedrock_role.arn
    DYNAMODB_TABLE_NAME  = aws_dynamodb_table.noa_db.name
    S3_BUCKET            = aws_s3_bucket.audio_bucket.id
    S3_BACKUP_BUCKET     = try(aws_s3_bucket.backup_bucket[0].id, "")
    CLOUDWATCH_LOG_GROUP = try(aws_cloudwatch_log_group.noa_logs[0].name, "")
  }
  sensitive = true
}

output "deployment_instructions" {
  description = "Instructions for deployment"
  value       = <<-EOT
    1. Copy these environment variables to your Vercel project:
       AWS_REGION=${var.aws_region}
       AWS_ACCOUNT_ID=${var.aws_account_id}
       AWS_ROLE_ARN=${aws_iam_role.bedrock_role.arn}
       DYNAMODB_TABLE_NAME=${aws_dynamodb_table.noa_db.name}
       S3_BUCKET=${aws_s3_bucket.audio_bucket.id}
       S3_BACKUP_BUCKET=${try(aws_s3_bucket.backup_bucket[0].id, "")}
    
     2. Verify DynamoDB access:
       aws dynamodb describe-table --table-name ${aws_dynamodb_table.noa_db.name} --region ${var.aws_region}

     3. Verify Bedrock access:
       aws bedrock list-foundation-models --region ${var.aws_region}
    
     4. Test S3 bucket access:
       aws s3 ls s3://${aws_s3_bucket.audio_bucket.id} --region ${var.aws_region}
    
     5. Deploy to Vercel:
       git push origin main
  EOT
  sensitive   = true
}
