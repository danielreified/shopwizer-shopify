#!/usr/bin/env ts-node
import 'dotenv/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// ---
// Setup & environment
// ---

const region = process.env.AWS_REGION || 'us-east-1';
const queueUrl = process.env.SQS_EMAIL_URL;
const from = process.env.EMAIL_FROM || 'Shopwizer <no-reply@shopwizer.co>';

if (!queueUrl) {
  console.error('Missing SQS_EMAIL_URL in .env');
  process.exit(1);
}

// ---
// Types
// ---

interface EmailJobPayload {
  type: string; // e.g. "INSTALL" | "PLAN_CHANGE"
  to: string; // recipient email
  from: string; // sender
  data?: Record<string, any>; // dynamic data for template
}

// ---
// CLI Args
// Usage: pnpm send:email INSTALL you@example.com '{"plan":"Pro"}'
// ---

const typeArg = process.argv[2] || 'INSTALL';
const toArg = process.argv[3] || 'daniel@reified.studio';
const dataArg = process.argv[4] ? JSON.parse(process.argv[4]) : {};

const job: EmailJobPayload = {
  type: typeArg,
  to: toArg,
  from,
  data: {
    shopName: 'Demo Shop',
    plan: 'Pro',
    ...dataArg,
  },
};

// ---
// Send Message
// ---

const sqs = new SQSClient({ region });

async function sendEmailJob() {
  console.log(`Sending email job to SQS queue: ${queueUrl}`);
  console.log(`  type: ${job.type}`);
  console.log(`  to:   ${job.to}`);
  console.log(`  payload: ${JSON.stringify(job, null, 2)}\n`);

  try {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(job),
    });

    const res = await sqs.send(command);
    console.log(`Message sent! ID: ${res.MessageId}`);
  } catch (err: any) {
    console.error('Failed to send message:', err.message);
    process.exit(1);
  }
}

sendEmailJob();
