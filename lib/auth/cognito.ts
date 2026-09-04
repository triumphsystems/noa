/**
 * Modern Server-Side AWS Cognito Authentication Engine
 * Powered by AWS SDK v3 (@aws-sdk/client-cognito-identity-provider)
 *
 * Replaces legacy amazon-cognito-identity-js with server-side SDK commands
 * and strict password verification.
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  AdminConfirmSignUpCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider'
import { getAwsCredentials } from '@/lib/aws-config'

const region = process.env.AWS_REGION || 'us-east-1'
const credentials = getAwsCredentials(region)

export const cognitoClient = new CognitoIdentityProviderClient({
  region,
  ...(credentials ? { credentials } : {}),
})

export function getCognitoConfig() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID || ''
  const clientId = process.env.COGNITO_CLIENT_ID || ''

  return {
    userPoolId,
    clientId,
    isConfigured: Boolean(userPoolId && clientId),
  }
}

export interface CognitoTokens {
  accessToken: string
  idToken: string
  refreshToken?: string
  expiresIn: number
}

export interface CognitoUserSession {
  sub: string
  email: string
  name: string
  userType: 'doctor' | 'patient'
}

/**
 * Sign in user with email and password via Cognito USER_PASSWORD_AUTH
 */
export async function signInWithCognito(
  email: string,
  password: string
): Promise<CognitoTokens> {
  const { clientId, isConfigured } = getCognitoConfig()

  if (!isConfigured) {
    throw new Error('AWS Cognito is not configured. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID.')
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email.trim().toLowerCase(),
        PASSWORD: password,
      },
    })

    const response = await cognitoClient.send(command)

    if (!response.AuthenticationResult?.AccessToken || !response.AuthenticationResult?.IdToken) {
      throw new Error('Authentication failed: No tokens returned by Cognito')
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
    }
  } catch (error: any) {
    console.error('[Cognito] Sign-in error:', error?.name, error?.message)
    if (error?.name === 'NotAuthorizedException' || error?.name === 'UserNotFoundException') {
      throw new Error('Incorrect email or password.')
    }
    if (error?.name === 'UserNotConfirmedException') {
      throw new Error('Account email is not verified yet. Please check your verification code.')
    }
    throw new Error(error?.message || 'Authentication failed')
  }
}

/**
 * Refresh Cognito session tokens using an active refresh token
 */
export async function refreshCognitoTokens(
  refreshToken: string
): Promise<CognitoTokens> {
  const { clientId, isConfigured } = getCognitoConfig()

  if (!isConfigured) {
    throw new Error('AWS Cognito is not configured.')
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    })

    const response = await cognitoClient.send(command)

    if (!response.AuthenticationResult?.AccessToken || !response.AuthenticationResult?.IdToken) {
      throw new Error('Failed to refresh tokens: No tokens returned by Cognito')
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken || refreshToken,
      expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
    }
  } catch (error: any) {
    console.error('[Cognito] Refresh token error:', error?.name, error?.message)
    throw new Error(error?.message || 'Failed to refresh authentication session')
  }
}

/**
 * Register a new user in Cognito User Pool with custom attributes
 */
export async function signUpWithCognito({
  email,
  password,
  userType,
  firstName,
  lastName,
}: {
  email: string
  password: string
  userType: 'doctor' | 'patient'
  firstName: string
  lastName: string
}): Promise<{ userSub: string; isConfirmed: boolean }> {
  const { clientId, isConfigured } = getCognitoConfig()

  if (!isConfigured) {
    throw new Error('AWS Cognito is not configured. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID.')
  }

  try {
    const command = new SignUpCommand({
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email.trim().toLowerCase() },
        { Name: 'given_name', Value: firstName.trim() },
        { Name: 'family_name', Value: lastName.trim() },
        { Name: 'custom:user_type', Value: userType },
      ],
    })

    const response = await cognitoClient.send(command)

    return {
      userSub: response.UserSub || '',
      isConfirmed: Boolean(response.UserConfirmed),
    }
  } catch (error: any) {
    console.error('[Cognito] Sign-up error:', error?.name, error?.message)
    if (error?.name === 'UsernameExistsException') {
      throw new Error('An account with this email already exists.')
    }
    if (error?.name === 'InvalidPasswordException') {
      throw new Error('Password must be at least 6 characters long.')
    }
    throw new Error(error?.message || 'Registration failed')
  }
}

/**
 * Confirm user signup with email verification code
 */
export async function confirmCognitoSignUp(
  email: string,
  code: string
): Promise<{ success: boolean }> {
  const { clientId, isConfigured } = getCognitoConfig()

  if (!isConfigured) {
    throw new Error('AWS Cognito is not configured.')
  }

  try {
    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
      ConfirmationCode: code.trim(),
    })

    await cognitoClient.send(command)
    return { success: true }
  } catch (error: any) {
    console.error('[Cognito] Confirmation error:', error)
    if (error?.name === 'CodeMismatchException') {
      throw new Error('Invalid verification code.')
    }
    if (error?.name === 'ExpiredCodeException') {
      throw new Error('Verification code has expired. Please request a new code.')
    }
    throw new Error(error?.message || 'Verification failed')
  }
}

/**
 * Revoke tokens and sign out globally from all devices
 */
export async function signOutWithCognito(accessToken: string): Promise<void> {
  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    })
    await cognitoClient.send(command)
  } catch (error) {
    // Log warning but allow client session clearance to proceed
    console.warn('[Cognito] Global sign-out warning:', error)
  }
}

/**
 * Fetch user profile & custom attributes from an active access token
 */
export async function getCognitoUser(accessToken: string): Promise<CognitoUserSession | null> {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    })

    const response = await cognitoClient.send(command)
    const attrs = response.UserAttributes || []

    const sub = attrs.find(a => a.Name === 'sub')?.Value || ''
    const email = attrs.find(a => a.Name === 'email')?.Value || response.Username || ''
    const firstName = attrs.find(a => a.Name === 'given_name')?.Value || ''
    const lastName = attrs.find(a => a.Name === 'family_name')?.Value || ''
    const userType = (attrs.find(a => a.Name === 'custom:user_type')?.Value as 'doctor' | 'patient') || 'patient'

    return {
      sub,
      email,
      name: `${firstName} ${lastName}`.trim() || email,
      userType,
    }
  } catch (error) {
    return null
  }
}

/**
 * Initiate password reset request by sending a verification code to the user's email
 */
export async function forgotPasswordWithCognito(email: string): Promise<{ destination?: string }> {
  const { clientId, isConfigured } = getCognitoConfig()

  if (!isConfigured) {
    throw new Error('AWS Cognito is not configured.')
  }

  try {
    const command = new ForgotPasswordCommand({
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
    })

    const response = await cognitoClient.send(command)
    return {
      destination: response.CodeDeliveryDetails?.Destination,
    }
  } catch (error: any) {
    console.error('[Cognito] Forgot-password error:', error?.name, error?.message)
    if (error?.name === 'UserNotFoundException') {
      // In security practices, still respond gracefully or give standard error
      throw new Error('No account found with this email address.')
    }
    if (error?.name === 'LimitExceededException') {
      throw new Error('Attempt limit exceeded. Please try again later.')
    }
    if (error?.name === 'InvalidParameterException') {
      throw new Error('Invalid email parameter.')
    }
    throw new Error(error?.message || 'Failed to request password reset.')
  }
}

/**
 * Confirm password reset using the verification code and new password
 */
export async function confirmForgotPasswordWithCognito({
  email,
  code,
  newPassword,
}: {
  email: string
  code: string
  newPassword: string
}): Promise<{ success: boolean }> {
  const { clientId, isConfigured } = getCognitoConfig()

  if (!isConfigured) {
    throw new Error('AWS Cognito is not configured.')
  }

  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
      ConfirmationCode: code.trim(),
      Password: newPassword,
    })

    await cognitoClient.send(command)
    return { success: true }
  } catch (error: any) {
    console.error('[Cognito] Confirm-forgot-password error:', error?.name, error?.message)
    if (error?.name === 'CodeMismatchException') {
      throw new Error('Invalid verification code. Please check and try again.')
    }
    if (error?.name === 'ExpiredCodeException') {
      throw new Error('Verification code has expired. Please request a new one.')
    }
    if (error?.name === 'InvalidPasswordException') {
      throw new Error('Password does not meet requirements (must be at least 6 characters).')
    }
    if (error?.name === 'UserNotFoundException') {
      throw new Error('No user found for this email address.')
    }
    throw new Error(error?.message || 'Failed to reset password.')
  }
}
