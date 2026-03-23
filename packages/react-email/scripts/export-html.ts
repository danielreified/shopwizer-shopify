import fs from 'fs';
import path from 'path';
import { getEmailHtml, EmailType } from '../render';

async function exportAllEmails() {
  const outputDir = path.join(process.cwd(), 'html');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const emails: EmailType[] = [
    'INSTALL',
    'UNINSTALL',
    'PLAN_CHANGE',
    'USAGE_APPROACHING',
    'USAGE_CAPPED',
    'USAGE_RESET',
    'SYNC_COMPLETE',
  ];

  console.log('🧱 Generating raw HTML email templates...');

  for (const type of emails) {
    const { subject, html } = await getEmailHtml(type, { pretty: true });

    const fileName = `${type.toLowerCase().replace(/_/g, '-')}.html`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, html, 'utf-8');

    console.log(`✅ Exported ${fileName} (${subject})`);
  }

  console.log(`\n✨ All raw emails exported to: ${outputDir}`);
}

exportAllEmails().catch((err) => {
  console.error('❌ Failed to export emails:', err);
  process.exit(1);
});
