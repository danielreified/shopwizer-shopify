import { SliceHeader } from '@/components/shopwizer-slices/SliceHeader';
import { SliceFooter } from '@/components/shopwizer-slices/SliceFooter';
import { LegalLayout } from '@/components/legal-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Shopwizer',
  description: 'How Shopwizer collects, uses, and protects your data.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <SliceHeader />
      <div style={{ paddingTop: 80 }}>
        <LegalLayout title="Privacy Policy" lastUpdated="January 15, 2026">
          <h2>1. Introduction</h2>
          <p>
            Shopwizer Inc. (&ldquo;Shopwizer,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when you use our Shopify
            application, website, and related services (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p>
            By accessing or using the Service, you agree to the terms of this Privacy Policy. If you
            do not agree with the terms, please do not use the Service.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Information you provide</h3>
          <ul>
            <li>Account registration details (name, email address, business name)</li>
            <li>Billing and payment information processed through Shopify</li>
            <li>Communications you send to us (support requests, feedback)</li>
            <li>Configuration preferences and settings within the app</li>
          </ul>

          <h3>Information collected automatically</h3>
          <ul>
            <li>
              Store data accessed through the Shopify API (products, orders, customer interactions)
            </li>
            <li>Usage analytics (feature usage, recommendation performance metrics)</li>
            <li>Device and browser information, IP address, and access timestamps</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3>End-customer data</h3>
          <p>
            When merchants install Shopwizer, we process certain data about their end-customers to
            power product recommendations. This includes browsing behavior, purchase history, and
            interaction patterns. We process this data solely on behalf of the merchant and in
            accordance with their instructions.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Generate personalized product recommendations for your store&apos;s visitors</li>
            <li>Analyze usage patterns to optimize recommendation algorithms</li>
            <li>Send transactional emails and service-related communications</li>
            <li>Process billing and manage your subscription</li>
            <li>Respond to support requests and provide customer service</li>
            <li>Detect, prevent, and address technical issues or fraud</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul>
            <li>
              <strong>Service providers</strong> who assist in operating our Service (hosting,
              analytics, payment processing)
            </li>
            <li>
              <strong>Shopify</strong> as required by the Shopify App Store terms and API agreements
            </li>
            <li>
              <strong>Legal authorities</strong> when required by law, legal process, or to protect
              our rights
            </li>
            <li>
              <strong>Business transfers</strong> in connection with a merger, acquisition, or sale
              of assets
            </li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to provide
            the Service. Store and customer data is deleted within 30 days of app uninstallation,
            unless retention is required by law. Aggregated, anonymized data may be retained
            indefinitely for analytics purposes.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including
            encryption in transit (TLS 1.3) and at rest (AES-256), regular security audits, and
            access controls. However, no method of electronic storage is 100% secure, and we cannot
            guarantee absolute security.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Request data portability</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@shopwizer.com.</p>

          <h2>8. International Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your own. We
            ensure appropriate safeguards are in place, including Standard Contractual Clauses where
            applicable.
          </p>

          <h2>9. Cookies</h2>
          <p>
            We use essential cookies to operate the Service and analytics cookies to understand
            usage. You can manage cookie preferences through your browser settings. Disabling
            essential cookies may affect Service functionality.
          </p>

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to individuals under 16. We do not knowingly collect
            personal information from children. If we become aware that a child has provided us with
            personal data, we will take steps to delete it.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by email or through the Service. Your continued use after changes take effect
            constitutes acceptance of the revised policy.
          </p>

          <h2>12. Contact Us</h2>
          <div className="contact-box">
            <p>
              <strong>Shopwizer Inc.</strong>
            </p>
            <p>privacy@shopwizer.com</p>
          </div>
        </LegalLayout>
      </div>
      <SliceFooter />
    </>
  );
}
