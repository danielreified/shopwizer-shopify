# site-next

Marketing website for Shopwise. Static export deployed to S3 + CloudFront.

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **UI**: React 19, Radix UI primitives, shadcn/ui
- **Styling**: Tailwind CSS 4, tw-animate-css
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Space Grotesk (headings), Inter (body)
- **Analytics**: Vercel Analytics

## Project Structure

```
site-next/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Homepage
│   ├── about/            # About page
│   ├── blog/             # Blog articles
│   ├── case-studies/     # Case study pages
│   ├── pricing/          # Pricing page
│   ├── resources/        # Resources page
│   ├── why-shopwise/     # Why Shopwise page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles + CSS custom properties
├── components/           # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── magicui/          # Animated UI components
│   ├── hero.tsx          # Hero section
│   ├── features.tsx      # Features section
│   ├── pricing.tsx       # Pricing component
│   ├── testimonials.tsx  # Testimonials
│   └── ...               # Other section components
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Scripts

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Static export to ./out
pnpm start            # Serve the static export locally
pnpm lint             # Next.js ESLint

# Deployment
pnpm site:sync        # Sync ./out to S3
pnpm site:invalidate  # Invalidate CloudFront cache
```

## Customization

Colors are defined in `app/globals.css` using CSS custom properties. The primary color is a vibrant yellow-green (`oklch(0.95 0.15 110)`) with accent colors in pink/magenta.

## Deployment

The site is built as a fully static export (`output: 'export'` in `next.config.ts`). The build output in `./out` is synced to an **S3 bucket** and served through **CloudFront**.

- `pnpm site:sync` uploads the static files to S3
- `pnpm site:invalidate` clears the CloudFront cache

Images are unoptimized (standard `<img>` tags) since Next.js image optimization requires a server. Trailing slashes are enabled for S3 compatibility.
