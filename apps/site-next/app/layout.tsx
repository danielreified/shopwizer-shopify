import type React from 'react';
import type { Metadata } from 'next';
import { Space_Grotesk, Inter, DM_Sans, DM_Serif_Display, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Shopwizer - AI-Powered Product Recommendations for Shopify',
  description:
    'Transform your Shopify store with intelligent AI recommendations. Increase sales, boost engagement, and personalize every customer journey with Shopwizer.',
  keywords: [
    'Shopify',
    'AI recommendations',
    'product recommendations',
    'e-commerce',
    'personalization',
    'Shopify app',
  ],
  authors: [{ name: 'Shopwizer' }],
  openGraph: {
    title: 'Shopwizer - AI-Powered Product Recommendations for Shopify',
    description: 'Transform your Shopify store with intelligent AI recommendations.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shopwizer - AI-Powered Product Recommendations for Shopify',
    description: 'Transform your Shopify store with intelligent AI recommendations.',
  },
  generator: 'v0.app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${dmSans.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
