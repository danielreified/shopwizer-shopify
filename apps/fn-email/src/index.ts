import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import type { EmailType } from '@prisma/client';

import { installHtml } from '@repo/react-email/templates/install.ts';
import { uninstallHtml } from '@repo/react-email/templates/uninstall.ts';
import { planChangeHtml } from '@repo/react-email/templates/plan-change.ts';
import { usageApproachingHtml } from '@repo/react-email/templates/usage-approaching.ts';
import { usageCappedHtml } from '@repo/react-email/templates/usage-capped.ts';
import { usageResetHtml } from '@repo/react-email/templates/usage-reset.ts';
import { syncCompleteHtml } from '@repo/react-email/templates/sync-complete.ts';
import { logger, timer } from '@repo/logger';

import { INFRA_CONFIG, RUNTIME_CONFIG } from './config/service.config';

const prisma = new PrismaClient();
const resend = new Resend(INFRA_CONFIG.RESEND.API_KEY);
const FROM = INFRA_CONFIG.RESEND.FROM;

// ---
// Email Templates
// ---

const TEMPLATES: Record<string, { subject: string; html: string; emailType: EmailType }> = {
  INSTALL: {
    subject: 'Welcome to Shopwizer 🎉',
    html: installHtml,
    emailType: 'INSTALL',
  },
  UNINSTALL: {
    subject: 'Goodbye from Shopwizer 💔',
    html: uninstallHtml,
    emailType: 'UNINSTALL',
  },
  PLAN_CHANGE: {
    subject: 'Your Shopwizer plan has changed 📈',
    html: planChangeHtml,
    emailType: 'PLAN_CHANGE',
  },
  USAGE_APPROACHING: {
    subject: "You're nearing your usage limit ⚠️",
    html: usageApproachingHtml,
    emailType: 'USAGE_APPROACHING',
  },
  USAGE_CAPPED: {
    subject: 'Your usage has been capped 🚫',
    html: usageCappedHtml,
    emailType: 'USAGE_CAPPED',
  },
  USAGE_RESET: {
    subject: 'Your Shopwizer usage has been reset 🔁',
    html: usageResetHtml,
    emailType: 'USAGE_RESET',
  },
  SYNC_COMPLETE: {
    subject: 'Your product sync is complete! ✅',
    html: syncCompleteHtml,
    emailType: 'SYNC_COMPLETE',
  },
};

// ---
// Message Parsing
// ---

function parseMessages(event: any): any[] {
  if (event.Records && Array.isArray(event.Records)) {
    // SQS event - each record body is the EventBridge event as JSON string
    const messages: any[] = [];
    for (const record of event.Records) {
      logger.debug(
        { bodySnippet: record.body?.substring(0, 500) },
        '[fn-email] Processing SQS record',
      );
      try {
        const parsed = JSON.parse(record.body || '{}');
        // EventBridge wraps the detail as a string, need to parse it if so
        if (typeof parsed.detail === 'string') {
          parsed.detail = JSON.parse(parsed.detail);
        }
        messages.push(parsed);
      } catch (parseErr) {
        logger.error(
          { error: parseErr, event: 'email.parse_error' },
          'Failed to parse record body',
        );
      }
    }
    return messages;
  }

  if (event.body) {
    return [JSON.parse(event.body)];
  }

  if (RUNTIME_CONFIG.IS_LOCAL) {
    return [
      {
        type: 'INSTALL',
        to: 'daniel@reified.studio',
        data: { shopName: 'Local Test Store', plan: 'Pro' },
      },
    ];
  }

  return [];
}

// ---
// Main Handler
// ---

export const handler = async (event: any = {}) => {
  const t = timer();
  try {
    logger.info(
      {
        eventKeys: Object.keys(event),
        hasRecords: !!event.Records,
        recordsCount: event.Records?.length ?? 0,
      },
      '[fn-email] Handler invoked',
    );

    const messages = parseMessages(event);
    logger.info({ messageCount: messages.length }, '[fn-email] Messages parsed');

    for (const msg of messages) {
      const payload = msg.detail ?? msg;
      const { type, to, data } = payload;

      logger.info(
        { type, to, dataKeys: Object.keys(data || {}) },
        '[fn-email] Processing email message',
      );

      if (!type || !to) {
        logger.warn({ msg }, '[fn-email] Skipping invalid message - missing type or to');
        continue;
      }

      const template = TEMPLATES[type];
      if (!template) {
        logger.warn({ type }, 'Unknown email type');
        continue;
      }

      // Replace {{placeholders}} dynamically
      let html = template.html;
      if (data && typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
      }

      // Send email via Resend
      logger.debug({ to, subject: template.subject }, '[fn-email] Sending email via Resend...');
      const sendTimer = timer();
      const { data: result, error } = await resend.emails.send({
        from: FROM,
        to,
        subject: template.subject,
        html,
      });
      sendTimer.done('resend.send', 'Resend API call complete');

      if (error) {
        logger.error({ error, event: 'email.send_failed' }, 'Resend error');
        throw error;
      }

      logger.info(
        { event: 'email.sent', data: { to, subject: template.subject, resendId: result?.id } },
        'Email sent successfully',
      );

      // Log to EmailLog for audit trail
      try {
        const shop = await prisma.shop.findFirst({
          where: { email: to },
          select: { id: true },
        });

        await prisma.emailLog.create({
          data: {
            shopId: shop?.id ?? null,
            type: template.emailType,
            to,
            subject: template.subject,
            metadata: {
              resendId: result?.id,
              data,
            },
          },
        });
        logger.debug({ type, to }, '[fn-email] EmailLog created');
      } catch (logErr) {
        // Don't fail email send if logging fails
        logger.error(
          { error: logErr, event: 'email.audit_log_failed' },
          'Failed to create EmailLog',
        );
      }
    }

    t.done('email.handler_complete', 'Handler completed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err: any) {
    logger.error({ error: err, event: 'email.handler_failed' }, 'Email Lambda Error');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

// ---
// Auto-run for local dev
// ---

if (RUNTIME_CONFIG.IS_LOCAL && !RUNTIME_CONFIG.IS_INVOKE_LOCAL) {
  (async () => {
    try {
      logger.info('IS_LOCAL=true - sending test email...');
      const res = await handler();
      logger.info({ result: res }, 'Autorun completed');
    } catch (err) {
      logger.error({ err }, 'Autorun failed');
    } finally {
      await prisma.$disconnect();
    }
  })();
}
