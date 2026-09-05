/**
 * Superadmin Seed Tool
 *
 * Provisions the user in AWS Cognito, sets permanent password,
 * creates the 'Admins' group, and stores the profile in DynamoDB.
 *
 * Usage:
 *   node scripts/seed-admin.mjs
 */

import fs from 'node:fs';
import readline from 'node:readline';

// Load .env.local first if available, otherwise .env
const envFile = fs.existsSync('.env.local')
  ? '.env.local'
  : fs.existsSync('.env')
    ? '.env'
    : null;
if (envFile) {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envFile);
    } catch {}
  } else {
    try {
      const content = fs.readFileSync(envFile, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest
            .join('=')
            .trim()
            .replace(/^["'](.*)["']$/, '$1');
          const k = key.trim();
          if (!process.env[k]) {
            process.env[k] = val;
          }
        }
      }
    } catch {}
  }
}
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CreateGroupCommand,
  GetGroupCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// ============================================================================
// ANSI Color & Styling Utilities
// ============================================================================
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Colors
  teal: '\x1b[38;2;45;212;191m',
  cyan: '\x1b[38;2;56;189;248m',
  blue: '\x1b[38;2;96;165;250m',
  purple: '\x1b[38;2;192;132;252m',
  emerald: '\x1b[38;2;52;211;153m',
  rose: '\x1b[38;2;251;113;133m',
  amber: '\x1b[38;2;251;191;36m',
  slate: '\x1b[38;2;148;163;184m',
  darkSlate: '\x1b[38;2;71;85;105m',
  white: '\x1b[38;2;255;255;255m',

  // Backgrounds
  bgDark: '\x1b[48;2;15;23;42m',
  bgTeal: '\x1b[48;2;13;148;136m',
};

const symbols = {
  check: `${c.emerald}✔${c.reset}`,
  cross: `${c.rose}✖${c.reset}`,
  arrow: `${c.teal}➜${c.reset}`,
  star: `${c.amber}★${c.reset}`,
  lock: `${c.purple}🔒${c.reset}`,
  shield: `${c.cyan}🛡️${c.reset}`,
  sparkle: `${c.teal}✨${c.reset}`,
  bullet: `${c.darkSlate}▪${c.reset}`,
};

function printBanner() {
  const art = [
    ` ${c.teal}███╗   ██╗ ██████╗  █████╗      ${c.cyan}██╗  ██╗███████╗ █████╗ ██╗  ████████╗██╗  ██╗${c.reset}`,
    ` ${c.teal}████╗  ██║██╔═══██╗██╔══██╗     ${c.cyan}██║  ██║██╔════╝██╔══██╗██║  ╚══██╔══╝██║  ██║${c.reset}`,
    ` ${c.teal}██╔██╗ ██║██║   ██║███████║${c.white}█████╗${c.cyan}███████║█████╗  ███████║██║     ██║   ███████║${c.reset}`,
    ` ${c.teal}██║╚██╗██║██║   ██║██╔══██║${c.white}╚════╝${c.cyan}██╔══██║██╔══╝  ██╔══██║██║     ██║   ██╔══██║${c.reset}`,
    ` ${c.teal}██║ ╚████║╚██████╔╝██║  ██║     ${c.cyan}██║  ██║███████╗██║  ██║███████╗██║   ██║  ██║${c.reset}`,
    ` ${c.teal}╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝     ${c.cyan}╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝  ╚═╝${c.reset}`,
  ];

  console.clear();
  console.log();
  art.forEach((line) => console.log(line));
  console.log();
  console.log(
    ` ${c.bgDark}${c.white}${c.bold} CLINICAL ADMINISTRATION SUITE ${c.reset}  ${c.dim}│${c.reset}  ${c.teal}${symbols.shield} Zero-Trust Superadmin Provisioning${c.reset}`
  );
  console.log(
    ` ${c.darkSlate}─────────────────────────────────────────────────────────────────────────────${c.reset}\n`
  );
}

// ============================================================================
// AWS Config & Checks
// ============================================================================
const region = process.env.AWS_REGION || 'us-east-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const tableName = process.env.DYNAMODB_TABLE_NAME || 'noa-clinical-data';

if (!userPoolId) {
  printBanner();
  console.log(
    ` ${c.rose}${symbols.cross} Configuration Error:${c.reset} ${c.white}COGNITO_USER_POOL_ID${c.reset} is not set in environment.`
  );
  console.log(
    ` ${c.darkSlate}Please configure your Cognito User Pool ID in .env.local or shell variables.${c.reset}\n`
  );
  process.exit(1);
}

const cognito = new CognitoIdentityProviderClient({ region });
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// ============================================================================
// Interactive Prompt Helpers
// ============================================================================
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function promptQuestion(rl, label, hint = '') {
  const formattedQuery = ` ${symbols.arrow} ${c.white}${c.bold}${label}${c.reset}${
    hint ? ` ${c.darkSlate}(${hint})${c.reset}` : ''
  }: `;
  return new Promise((resolve) => {
    rl.question(formattedQuery, (answer) => {
      resolve(answer.trim());
    });
  });
}

function promptPassword(label, hint = 'min 6 chars') {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const formattedQuery = ` ${symbols.lock} ${c.white}${c.bold}${label}${c.reset}${
      hint ? ` ${c.darkSlate}(${hint})${c.reset}` : ''
    }: `;
    process.stdout.write(formattedQuery);

    let password = '';

    process.stdin.setRawMode?.(true);
    process.stdin.resume();

    const onData = (chunk) => {
      const char = chunk.toString('utf8');

      // Enter
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(password.trim());
        return;
      }

      // Backspace
      if (char === '\u0008' || char === '\x7f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }

      // Ctrl+C
      if (char === '\u0003') {
        process.stdout.write(`\n ${c.amber}Operation cancelled.${c.reset}\n\n`);
        process.exit(0);
      }

      password += char;
      process.stdout.write(`${c.teal}•${c.reset}`);
    };

    if (process.stdin.isTTY) {
      process.stdin.on('data', onData);
    } else {
      rl.question('', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

// ============================================================================
// Provisioning Logic
// ============================================================================
async function ensureAdminGroup() {
  try {
    await cognito.send(
      new GetGroupCommand({
        UserPoolId: userPoolId,
        GroupName: 'Admins',
      })
    );
    return false;
  } catch (error) {
    if (
      error?.name === 'ResourceNotFoundException' ||
      error?.name === 'GroupNotFoundException'
    ) {
      await cognito.send(
        new CreateGroupCommand({
          UserPoolId: userPoolId,
          GroupName: 'Admins',
          Description:
            'Superadministrators and clinical review officers with full administrative access',
          Precedence: 0,
        })
      );
      return true;
    }
    throw error;
  }
}

async function main() {
  printBanner();

  console.log(` ${c.dim}Target Environment:${c.reset}`);
  console.log(
    `  ${symbols.bullet} AWS Region:        ${c.cyan}${region}${c.reset}`
  );
  console.log(
    `  ${symbols.bullet} Cognito Pool ID:   ${c.cyan}${userPoolId}${c.reset}`
  );
  console.log(
    `  ${symbols.bullet} DynamoDB Table:    ${c.cyan}${tableName}${c.reset}`
  );
  console.log();

  const rl = createInterface();

  let email = '';
  while (!email || !email.includes('@')) {
    email = await promptQuestion(
      rl,
      'Superadmin Email',
      'e.g. medical.director@noa.health'
    );
    if (!email || !email.includes('@')) {
      console.log(`   ${c.rose}Please enter a valid email address.${c.reset}`);
    }
  }

  let name = '';
  while (!name) {
    name = await promptQuestion(rl, 'Full Name', 'e.g. Dr. Jane Doe');
    if (!name) {
      console.log(`   ${c.rose}Name cannot be empty.${c.reset}`);
    }
  }

  rl.close();

  let password = '';
  while (password.length < 6) {
    password = await promptPassword('Secure Password', 'min 6 chars, hidden');
    if (password.length < 6) {
      console.log(
        `   ${c.rose}Password must be at least 6 characters long.${c.reset}`
      );
    }
  }

  console.log();
  console.log(` ${c.teal}❯ Starting provisioning pipeline...${c.reset}`);
  console.log();

  try {
    // Step 1: Ensure Admins Group
    process.stdout.write(
      `   ${c.slate}[1/5] Checking Cognito "Admins" group...${c.reset}`
    );
    const created = await ensureAdminGroup();
    process.stdout.write(
      `\r   ${symbols.check} [1/5] Cognito "Admins" group verified ${created ? '(created new)' : '(existing)'}\n`
    );

    // Step 2: Create User
    process.stdout.write(
      `   ${c.slate}[2/5] Creating user identity in Cognito...${c.reset}`
    );
    let userSub = '';
    try {
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email.toLowerCase(),
        UserAttributes: [
          { Name: 'email', Value: email.toLowerCase() },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:user_type', Value: 'admin' },
          { Name: 'given_name', Value: name.split(' ')[0] || name },
          {
            Name: 'family_name',
            Value: name.split(' ').slice(1).join(' ') || 'Admin',
          },
        ],
        MessageAction: 'SUPPRESS',
      });

      const createRes = await cognito.send(createCommand);
      userSub =
        createRes.User?.Attributes?.find((a) => a.Name === 'sub')?.Value || '';
      process.stdout.write(
        `\r   ${symbols.check} [2/5] User identity registered in Cognito\n`
      );
    } catch (err) {
      if (err?.name === 'UsernameExistsException') {
        process.stdout.write(
          `\r   ${symbols.check} [2/5] User already exists in Cognito (updating profile)\n`
        );
      } else {
        throw err;
      }
    }

    // Step 3: Set Permanent Password
    process.stdout.write(
      `   ${c.slate}[3/5] Setting permanent password...${c.reset}`
    );
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email.toLowerCase(),
        Password: password,
        Permanent: true,
      })
    );
    process.stdout.write(
      `\r   ${symbols.check} [3/5] Permanent password configured\n`
    );

    // Step 4: Add to Admins Group
    process.stdout.write(
      `   ${c.slate}[4/5] Assigning user to "Admins" group...${c.reset}`
    );
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email.toLowerCase(),
        GroupName: 'Admins',
      })
    );
    process.stdout.write(
      `\r   ${symbols.check} [4/5] Administrator group membership granted\n`
    );

    // Step 5: DynamoDB Record
    process.stdout.write(
      `   ${c.slate}[5/5] Registering admin record in DynamoDB...${c.reset}`
    );
    const adminId =
      userSub || `admin-${Buffer.from(email).toString('hex').slice(0, 12)}`;
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          id: adminId,
          type: 'admin',
          email: email.toLowerCase(),
          name,
          role: 'superadmin',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      })
    );
    process.stdout.write(
      `\r   ${symbols.check} [5/5] DynamoDB admin profile stored (${adminId})\n`
    );

    // Success Card
    console.log();
    console.log(
      ` ${c.emerald}┌───────────────────────────────────────────────────────────────────────────┐${c.reset}`
    );
    console.log(
      ` ${c.emerald}│${c.reset}  ${symbols.sparkle} ${c.white}${c.bold}SUPERADMIN PROVISIONED SUCCESSFULLY${c.reset}                                    ${c.emerald}│${c.reset}`
    );
    console.log(
      ` ${c.emerald}├───────────────────────────────────────────────────────────────────────────┤${c.reset}`
    );
    console.log(
      ` ${c.emerald}│${c.reset}  ${c.dim}Account Email:${c.reset}   ${c.cyan}${email.toLowerCase().padEnd(58)}${c.reset}${c.emerald}│${c.reset}`
    );
    console.log(
      ` ${c.emerald}│${c.reset}  ${c.dim}Full Name:${c.reset}       ${c.white}${name.padEnd(58)}${c.reset}${c.emerald}│${c.reset}`
    );
    console.log(
      ` ${c.emerald}│${c.reset}  ${c.dim}Role:${c.reset}            ${c.teal}Superadministrator (${c.white}Admins${c.teal} Cognito Group)${c.reset}          ${c.emerald}│${c.reset}`
    );
    console.log(
      ` ${c.emerald}│${c.reset}  ${c.dim}Approval API:${c.reset}    ${c.amber}GET  /api/admin/doctors?status=pending${c.reset}                    ${c.emerald}│${c.reset}`
    );
    console.log(
      ` ${c.emerald}│${c.reset}  ${c.dim}Approve Doctor:${c.reset}  ${c.amber}POST /api/admin/doctors/:id/approve${c.reset}                       ${c.emerald}│${c.reset}`
    );
    console.log(
      ` ${c.emerald}└───────────────────────────────────────────────────────────────────────────┘${c.reset}\n`
    );
  } catch (err) {
    console.log(
      `\n ${c.rose}${symbols.cross} Provisioning Failed:${c.reset} ${c.white}${err?.message || err}${c.reset}\n`
    );
    process.exit(1);
  }
}

main();
