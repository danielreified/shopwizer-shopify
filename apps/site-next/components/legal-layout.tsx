'use client';

import type React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <article
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        fontFamily: 'var(--font-dm-sans), sans-serif',
      }}
    >
      {/* Back nav */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 32px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#6B7280',
              textDecoration: 'none',
              letterSpacing: '0.5px',
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div style={{ padding: '72px 32px 48px', maxWidth: 680, margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            lineHeight: 1.15,
            letterSpacing: '-0.3px',
            color: '#1A1A2E',
            marginBottom: 16,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', letterSpacing: '0.3px' }}>
          Last updated: {lastUpdated}
        </p>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

      {/* Content */}
      <div
        className="legal-content"
        style={{ maxWidth: 680, margin: '0 auto', padding: '48px 32px 120px' }}
      >
        {children}
      </div>

      <style>{`
                .legal-content h2 {
                    font-family: var(--font-dm-sans), sans-serif;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1A1A2E;
                    margin: 48px 0 16px;
                    letter-spacing: -0.2px;
                }
                .legal-content h2:first-child {
                    margin-top: 0;
                }
                .legal-content h3 {
                    font-family: var(--font-dm-sans), sans-serif;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1A1A2E;
                    margin: 32px 0 10px;
                }
                .legal-content p {
                    font-size: 15px;
                    line-height: 1.75;
                    color: #4B5563;
                    margin: 0 0 16px;
                }
                .legal-content strong {
                    color: #1A1A2E;
                    font-weight: 600;
                }
                .legal-content ul,
                .legal-content ol {
                    margin: 12px 0 20px;
                    padding-left: 0;
                    list-style: none;
                }
                .legal-content ul li,
                .legal-content ol li {
                    font-size: 15px;
                    line-height: 1.75;
                    color: #4B5563;
                    padding-left: 20px;
                    position: relative;
                    margin-bottom: 8px;
                }
                .legal-content ul li::before {
                    content: '';
                    position: absolute;
                    left: 2px;
                    top: 10px;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #9CA3AF;
                }
                .legal-content a {
                    color: #5B8A4A;
                    text-decoration: none;
                }
                .legal-content a:hover {
                    text-decoration: underline;
                }
                .legal-content hr {
                    border: none;
                    border-top: 1px solid rgba(0,0,0,0.06);
                    margin: 40px 0;
                }
                .legal-content .contact-box {
                    background: #F7F7F5;
                    border: 1px solid rgba(0,0,0,0.06);
                    border-radius: 12px;
                    padding: 24px 28px;
                    margin: 32px 0;
                }
                .legal-content .contact-box p {
                    margin-bottom: 8px;
                }
                .legal-content .contact-box p:last-child {
                    margin-bottom: 0;
                }
            `}</style>
    </article>
  );
}
