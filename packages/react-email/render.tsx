import React from 'react';
import { render, pretty, toPlainText } from '@react-email/render';

import InstallEmail from './emails/install';
import UninstallEmail from './emails/uninstall';
import PlanChangedEmail from './emails/plan-changed';
import UsageApproachingEmail from './emails/usage-approaching';
import UsageCappedEmail from './emails/usage-capped';
import UsageResetEmail from './emails/usage-reset';
import SyncCompleteEmail from './emails/sync-complete';

export type EmailType =
  | 'INSTALL'
  | 'UNINSTALL'
  | 'PLAN_CHANGE'
  | 'USAGE_APPROACHING'
  | 'USAGE_CAPPED'
  | 'USAGE_RESET'
  | 'SYNC_COMPLETE';

// 💡 Replace {{shopName}}, {{planName}}, etc. in the rendered HTML
function applyReplacements(html: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce((acc, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    return acc.replace(regex, value);
  }, html);
}

export async function getEmailHtml(
  type: EmailType,
  replacements: Record<string, string> = {},
  options: { pretty?: boolean; includeText?: boolean } = {},
): Promise<{
  subject: string;
  html: string;
  text?: string;
}> {
  let subject = 'Shopwizer Update';
  let component: JSX.Element;

  switch (type) {
    case 'INSTALL':
      subject = 'Welcome to Shopwizer 🎉';
      component = <InstallEmail />;
      break;
    case 'UNINSTALL':
      subject = 'Goodbye from Shopwizer 💔';
      component = <UninstallEmail />;
      break;
    case 'PLAN_CHANGE':
      subject = 'Your Shopwizer plan has changed 📈';
      component = <PlanChangedEmail />;
      break;
    case 'USAGE_APPROACHING':
      subject = "You're nearing your Shopwizer usage limit ⚠️";
      component = <UsageApproachingEmail />;
      break;
    case 'USAGE_CAPPED':
      subject = 'Your Shopwizer usage has been capped 🚫';
      component = <UsageCappedEmail />;
      break;
    case 'USAGE_RESET':
      subject = 'Your Shopwizer usage has been reset 🔁';
      component = <UsageResetEmail />;
      break;
    case 'SYNC_COMPLETE':
      subject = 'Your product sync is complete! ✅';
      component = <SyncCompleteEmail />;
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  // Render to HTML
  let html = await render(component);
  html = applyReplacements(html, replacements);

  if (options.pretty) html = await pretty(html);

  const text = options.includeText ? toPlainText(html) : undefined;

  return { subject, html, text };
}
