# ============================================
# AWS Cognito User Pool for HIPAA-Compliant Auth
# ============================================

resource "aws_cognito_user_pool" "noa_user_pool" {
  name = "noa-user-pool-${var.environment}"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 6
    require_lowercase                = false
    require_numbers                  = false
    require_symbols                  = false
    require_uppercase                = false
    temporary_password_validity_days = 7
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "user_type"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "clinic_id"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 64
    }
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "Noa"
  }
}

resource "aws_cognito_user_pool_client" "noa_app_client" {
  name         = "noa-app-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.noa_user_pool.id

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
}

# User Groups
resource "aws_cognito_user_group" "doctors" {
  name         = "Doctors"
  user_pool_id = aws_cognito_user_pool.noa_user_pool.id
  description  = "Licensed clinicians and medical providers"
  precedence   = 1
}

resource "aws_cognito_user_group" "patients" {
  name         = "Patients"
  user_pool_id = aws_cognito_user_pool.noa_user_pool.id
  description  = "Patients accessing care summaries and intake"
  precedence   = 2
}
