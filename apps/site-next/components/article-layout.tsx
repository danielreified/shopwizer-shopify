'use client';

import type React from 'react';

import { Clock, Calendar, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ArticleLayoutProps {
  title: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  children: React.ReactNode;
  tableOfContents: { id: string; title: string; level: number }[];
}

export function ArticleLayout({
  title,
  date,
  readTime,
  author,
  category,
  children,
  tableOfContents,
}: ArticleLayoutProps) {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' },
    );

    tableOfContents.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  return (
    <article
      style={{
        minHeight: '100vh',
        background: '#FAFAF8',
        fontFamily: 'var(--font-dm-sans), sans-serif',
      }}
    >
      {/* Back nav */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
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

      {/* Article Header */}
      <div style={{ padding: '80px 32px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            marginBottom: 28,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase' as const,
            border: '1px solid rgba(91,138,74,0.2)',
            borderRadius: 100,
            background: 'rgba(91,138,74,0.05)',
            color: '#5B8A4A',
          }}
        >
          {category}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: 'clamp(32px, 5vw, 52px)',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
            color: '#1A1A2E',
            marginBottom: 28,
          }}
        >
          {title}
        </h1>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: 24,
            fontSize: 13,
            color: '#9CA3AF',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User style={{ width: 14, height: 14 }} />
            {author}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar style={{ width: 14, height: 14 }} />
            {date}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock style={{ width: 14, height: 14 }} />
            {readTime}
          </span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

      {/* Content Layout */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '60px 32px 120px',
          display: 'flex',
          gap: 80,
        }}
      >
        {/* Main Content */}
        <div className="article-content" style={{ flex: 1, minWidth: 0, maxWidth: 720 }}>
          {children}
        </div>

        {/* Table of Contents */}
        <aside className="hidden lg:block" style={{ width: 220, flexShrink: 0 }}>
          <div style={{ position: 'sticky' as const, top: 100 }}>
            <h3
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase' as const,
                color: '#9CA3AF',
                marginBottom: 20,
              }}
            >
              On this page
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {tableOfContents.map(({ id, title, level }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  style={{
                    fontSize: 13,
                    color: activeSection === id ? '#5B8A4A' : '#9CA3AF',
                    fontWeight: activeSection === id ? 500 : 400,
                    textDecoration: 'none',
                    paddingLeft: (level - 2) * 14,
                    transition: 'color 0.2s',
                    lineHeight: 1.5,
                  }}
                >
                  {title}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <style>{`
                .article-content h2 {
                    font-family: var(--font-dm-serif), serif;
                    font-size: 32px;
                    line-height: 1.15;
                    letter-spacing: -0.3px;
                    color: #1A1A2E;
                    margin: 56px 0 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(0,0,0,0.06);
                }
                .article-content h2:first-child {
                    margin-top: 0;
                }
                .article-content h3 {
                    font-family: var(--font-dm-sans), sans-serif;
                    font-size: 20px;
                    font-weight: 600;
                    color: #1A1A2E;
                    margin: 40px 0 14px;
                    letter-spacing: -0.2px;
                }
                .article-content p {
                    font-size: 16px;
                    line-height: 1.8;
                    color: #4B5563;
                    margin: 0 0 20px;
                }
                .article-content strong {
                    color: #1A1A2E;
                    font-weight: 600;
                }
                .article-content ul,
                .article-content ol {
                    margin: 20px 0 28px;
                    padding-left: 0;
                    list-style: none;
                }
                .article-content ul li,
                .article-content ol li {
                    font-size: 16px;
                    line-height: 1.8;
                    color: #4B5563;
                    padding-left: 24px;
                    position: relative;
                    margin-bottom: 10px;
                }
                .article-content ul li::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 11px;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #5B8A4A;
                }
                .article-content ol {
                    counter-reset: ol-counter;
                }
                .article-content ol li {
                    counter-increment: ol-counter;
                }
                .article-content ol li::before {
                    content: counter(ol-counter) '.';
                    position: absolute;
                    left: 0;
                    color: #5B8A4A;
                    font-weight: 600;
                    font-size: 14px;
                    font-family: var(--font-jetbrains-mono), monospace;
                }
                .article-content a {
                    color: #5B8A4A;
                    text-decoration: none;
                    font-weight: 500;
                }
                .article-content a:hover {
                    text-decoration: underline;
                }
                .article-content blockquote {
                    border-left: 3px solid #5B8A4A;
                    padding: 16px 24px;
                    margin: 28px 0;
                    background: rgba(91,138,74,0.04);
                    border-radius: 0 8px 8px 0;
                    color: #4B5563;
                    font-style: italic;
                }
                .article-content code {
                    font-family: var(--font-jetbrains-mono), monospace;
                    font-size: 14px;
                    background: rgba(0,0,0,0.04);
                    padding: 2px 8px;
                    border-radius: 4px;
                    color: #1A1A2E;
                }
                .article-content pre {
                    background: #1A1A2E;
                    color: #E5E7EB;
                    padding: 24px;
                    border-radius: 12px;
                    overflow-x: auto;
                    margin: 28px 0;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .article-content pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                }
                .article-content hr {
                    border: none;
                    border-top: 1px solid rgba(0,0,0,0.06);
                    margin: 48px 0;
                }
            `}</style>
    </article>
  );
}
