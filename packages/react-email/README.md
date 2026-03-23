# @repo/react-email

React Email templates for transactional emails sent via Resend. Templates are authored as React components and exported as static HTML for the email delivery Lambda.

## Templates

| Template | Trigger |
|----------|---------|
| `install` | App installed |
| `uninstall` | App uninstalled |
| `plan-changed` | Billing plan changed |
| `sync-complete` | Product sync finished |
| `usage-approaching` | Approaching usage limit |
| `usage-capped` | Usage limit reached |
| `usage-reset` | Usage counter reset |

## Usage

Templates are consumed via the `./templates/*` export map, which points to pre-rendered HTML in `dist-html/`:

```ts
import installHtml from '@repo/react-email/templates/install';
```

## Scripts

```bash
pnpm dev       # Start React Email preview server
pnpm generate  # Export all templates to HTML + TypeScript
pnpm clean     # Remove dist-html/ and html/
pnpm lint      # Run ESLint
```
