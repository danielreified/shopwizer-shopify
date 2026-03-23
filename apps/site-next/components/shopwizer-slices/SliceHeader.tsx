'use client';

import { useState, useEffect } from 'react';
import styles from './shopwizer.module.css';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function SliceHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <Link href="/" className={styles.navLogo}>
          <svg viewBox="-170 -170 340 340">
            <g transform="rotate(45)">
              <path
                d="M -3,-115 C -40,-115 -80,-100 -95,-85 C -100,-80 -115,-40 -115,-3 L -40,0 Q 0,0 0,-40 Z"
                fill="#1A1A2E"
              />
              <path
                d="M 115,-3 C 115,-40 100,-80 85,-95 C 80,-100 40,-115 3,-115 L 0,-40 Q 0,0 40,0 Z"
                fill="#1A1A2E"
              />
              <path
                d="M 3,115 C 40,115 80,100 95,85 C 100,80 115,40 115,3 L 40,0 Q 0,0 0,40 Z"
                fill="#1A1A2E"
              />
              <path
                d="M -115,3 C -115,40 -100,80 -85,95 C -80,100 -40,115 -3,115 L 0,40 Q 0,0 -40,0 Z"
                fill="#1A1A2E"
              />
            </g>
          </svg>
          <span>shopwizer</span>
        </Link>

        <ul className={styles.navMenu}>
          <li>
            <Link href="/" className={styles.navLink}>
              Product
            </Link>
          </li>
          <li>
            <Link href="/pricing" className={styles.navLink}>
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/about" className={styles.navLink}>
              About
            </Link>
          </li>
          <li>
            <Link href="/blog/getting-started-with-ai-recommendations" className={styles.navLink}>
              Blog
            </Link>
          </li>
        </ul>

        <div className={styles.navActions}>
          <Link href="#" className={styles.navLogin}>
            Sign in
          </Link>
          <button className={styles.navCta}>Start free trial</button>
        </div>

        <button
          className={styles.mobileMenuToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Link
              href="/"
              className={styles.mobileMenuLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Product
            </Link>
            <Link
              href="/pricing"
              className={styles.mobileMenuLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className={styles.mobileMenuLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/blog/getting-started-with-ai-recommendations"
              className={styles.mobileMenuLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <div className={styles.mobileMenuActions}>
              <Link href="#" className={styles.navLogin} onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
              <button className={styles.navCta} onClick={() => setMobileMenuOpen(false)}>
                Start free trial
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
