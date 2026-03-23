#!/usr/bin/env npx tsx
/**
 * Global SQS Trigger Script
 *
 * Usage: npx tsx scripts/trigger-sqs.ts <queue_env_var> <job_type> [extra_json]
 *
 * Examples:
 *   npx tsx scripts/trigger-sqs.ts ANALYTICS_QUEUE_URL feature_hourly
 *   npx tsx scripts/trigger-sqs.ts JOB_QUEUE_URL TRENDING '{"shopId":"abc123"}'
 */
import 'dotenv/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const region = process.env.AWS_REGION || 'us-east-1';

// Args: <queue_env_var> <job_type> [extra_json]
const queueEnvVar = process.argv[2];
const jobType = process.argv[3];
const extraArg = process.argv[4] ? JSON.parse(process.argv[4]) : {};

if (!queueEnvVar) {
  console.error('❌ Missing queue env var name (e.g., ANALYTICS_QUEUE_URL, JOB_QUEUE_URL)');
  console.error('   Usage: trigger-sqs.ts <QUEUE_ENV_VAR> <job_type> [extra_json]');
  process.exit(1);
}

if (!jobType) {
  console.error('❌ Missing job_type argument');
  console.error('   Usage: trigger-sqs.ts <QUEUE_ENV_VAR> <job_type> [extra_json]');
  process.exit(1);
}

const queueUrl = process.env[queueEnvVar];
if (!queueUrl) {
  console.error(`❌ Missing ${queueEnvVar} in environment`);
  process.exit(1);
}

const sqs = new SQSClient({ region });

// Build message body - supports both job_type (analytics) and type (jobs-worker) formats
const messageBody = JSON.stringify({
  job_type: jobType,
  type: jobType,
  ...extraArg,
});

(async () => {
  console.log(`🚀 Sending SQS message`);
  console.log(`   📬 Queue: ${queueEnvVar} → ${queueUrl.slice(0, 50)}...`);
  console.log(`   🧩 Type:  ${jobType}`);
  console.log(`   🧾 Body:  ${messageBody}\n`);

  try {
    const res = await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
      }),
    );
    console.log('✅ Message sent!', res.MessageId);
  } catch (err: any) {
    console.error('💥 Failed to send message:', err.message);
    process.exit(1);
  }
})();
