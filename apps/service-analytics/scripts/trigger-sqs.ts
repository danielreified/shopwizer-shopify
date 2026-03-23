import 'dotenv/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const region = process.env.AWS_REGION || 'us-east-1';
const queueUrl = process.env.ANALYTICS_QUEUE_URL;

if (!queueUrl) {
  console.error('❌ Missing ANALYTICS_QUEUE_URL in .env');
  process.exit(1);
}

const jobType = process.argv[2] || 'FEATURE_HOURLY';
const extraArg = process.argv[3] ? JSON.parse(process.argv[3]) : {};

const sqs = new SQSClient({ region });

const messageBody = JSON.stringify({
  job_type: jobType,
  ...extraArg,
});

(async () => {
  console.log(`🚀 Sending SQS message to ${queueUrl}`);
  console.log(`   🧩 job_type: ${jobType}`);
  console.log(`   🧾 payload:  ${messageBody}\n`);

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
