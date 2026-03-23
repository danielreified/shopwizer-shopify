import styles from './shopwizer.module.css';
import { Facebook, Linkedin, Instagram } from 'lucide-react';
import Link from 'next/link';

export function SliceFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerCta}>
        <div>
          <h2>Get started with Shopwizer</h2>
          <p>
            Join thousands of Shopify merchants using AI to showcase their best products
            automatically.
          </p>
        </div>
        <form className={styles.footerCtaForm}>
          <input
            type="email"
            placeholder="Enter your email"
            className={styles.footerInput}
            required
          />
          <button type="submit" className={styles.footerBtn}>
            Start free trial
          </button>
        </form>
      </div>

      <div className={styles.footerLinks}>
        <div className={styles.footerLinkCol}>
          <h3>Platform</h3>
          <ul>
            <li>
              <Link href="/#features">Features</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <Link href="/case-studies">Case Studies</Link>
            </li>
            <li>
              <Link href="#">Integrations</Link>
            </li>
          </ul>
        </div>
        <div className={styles.footerLinkCol}>
          <h3>Resources</h3>
          <ul>
            <li>
              <Link href="/blog">Blog</Link>
            </li>
            <li>
              <Link href="#">Help Center</Link>
            </li>
            <li>
              <Link href="#">Developer Docs</Link>
            </li>
            <li>
              <Link href="#">Status</Link>
            </li>
          </ul>
        </div>
        <div className={styles.footerLinkCol}>
          <h3>Company</h3>
          <ul>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="#">Careers</Link>
            </li>
            <li>
              <Link href="#">Contact</Link>
            </li>
            <li>
              <Link href="#">Partners</Link>
            </li>
          </ul>
        </div>
        <div className={styles.footerLinkCol}>
          <h3>Legal</h3>
          <ul>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/security">Security</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerCopy}>
          <span>&copy; {new Date().getFullYear()} Shopwizer Inc.</span>
        </div>
        <div className={styles.footerSocial}>
          <a href="#" aria-label="Twitter">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
          </a>
          <a href="#" aria-label="Instagram">
            <Instagram size={16} />
          </a>
          <a href="#" aria-label="LinkedIn">
            <Linkedin size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
