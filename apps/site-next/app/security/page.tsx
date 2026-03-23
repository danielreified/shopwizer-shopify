import { SliceHeader } from '@/components/shopwizer-slices/SliceHeader';
import { SliceFooter } from '@/components/shopwizer-slices/SliceFooter';
import { LegalLayout } from '@/components/legal-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security — Shopwizer',
  description: "How Shopwizer protects your data and your customers' data.",
};

export default function Security() {
  return (
    <>
      <SliceHeader />
      <div style={{ paddingTop: 80 }}>
        <LegalLayout title="Security" lastUpdated="January 15, 2026">
          <p>
            At Shopwizer, security is foundational to everything we build. We handle sensitive store
            and customer data, and we take that responsibility seriously. This page outlines the
            measures we employ to keep your data safe.
          </p>

          <h2>Infrastructure</h2>
          <p>
            Our infrastructure is hosted on industry-leading cloud providers with SOC 2 Type II
            certification. All systems run in isolated environments with automated scaling and
            redundancy across multiple availability zones to ensure high availability.
          </p>
          <ul>
            <li>Multi-region deployment with automatic failover</li>
            <li>Network isolation with private subnets and firewalls</li>
            <li>DDoS protection at the network edge</li>
            <li>Automated backups with point-in-time recovery</li>
          </ul>

          <h2>Encryption</h2>
          <p>All data is encrypted both in transit and at rest:</p>
          <ul>
            <li>
              <strong>In transit:</strong> TLS 1.3 for all connections between your store, our
              servers, and third-party services
            </li>
            <li>
              <strong>At rest:</strong> AES-256 encryption for all stored data, including databases
              and backups
            </li>
            <li>
              <strong>Key management:</strong> Encryption keys are managed through a dedicated key
              management service with automatic rotation
            </li>
          </ul>

          <h2>Access Controls</h2>
          <p>We enforce the principle of least privilege across our organization:</p>
          <ul>
            <li>Role-based access controls for all internal systems</li>
            <li>Multi-factor authentication required for all employee accounts</li>
            <li>Access reviews conducted quarterly</li>
            <li>Privileged access to production systems is time-limited and audited</li>
            <li>All access is logged and monitored</li>
          </ul>

          <h2>Application Security</h2>
          <ul>
            <li>Secure development lifecycle with mandatory code reviews</li>
            <li>Automated vulnerability scanning in CI/CD pipelines</li>
            <li>Regular third-party penetration testing</li>
            <li>Dependency monitoring for known vulnerabilities</li>
            <li>Input validation and output encoding to prevent injection attacks</li>
            <li>Rate limiting and abuse prevention on all API endpoints</li>
          </ul>

          <h2>Compliance</h2>
          <ul>
            <li>
              <strong>GDPR:</strong> Full compliance with the General Data Protection Regulation for
              EU merchants and their customers
            </li>
            <li>
              <strong>CCPA:</strong> Compliance with the California Consumer Privacy Act
            </li>
            <li>
              <strong>Shopify API:</strong> Adherence to Shopify&apos;s API terms, data protection
              requirements, and app review standards
            </li>
            <li>
              <strong>PCI DSS:</strong> We do not store, process, or transmit cardholder data
              directly. Payment processing is handled entirely through Shopify
            </li>
          </ul>

          <h2>Incident Response</h2>
          <p>
            We maintain a documented incident response plan that is reviewed and tested regularly.
            In the event of a security incident:
          </p>
          <ul>
            <li>Our team is alerted within minutes through automated monitoring</li>
            <li>
              Affected merchants are notified within 72 hours of confirmed breaches, in compliance
              with GDPR requirements
            </li>
            <li>Post-incident reviews are conducted to prevent recurrence</li>
          </ul>

          <h2>Data Handling</h2>
          <ul>
            <li>Store data is logically isolated per merchant</li>
            <li>Data is deleted within 30 days of app uninstallation</li>
            <li>We do not sell merchant or customer data to third parties</li>
            <li>Employee access to customer data requires documented justification</li>
          </ul>

          <h2>Monitoring</h2>
          <p>We run continuous monitoring across our infrastructure and applications:</p>
          <ul>
            <li>Real-time alerting for anomalous activity</li>
            <li>Centralized logging with 90-day retention</li>
            <li>Automated threat detection and response</li>
            <li>99.9% uptime SLA with public status page</li>
          </ul>

          <h2>Reporting a Vulnerability</h2>
          <p>
            If you discover a security vulnerability, we encourage responsible disclosure. Please
            contact us at the address below with details of the vulnerability. We aim to acknowledge
            reports within 24 hours and provide an initial assessment within 5 business days.
          </p>

          <div className="contact-box">
            <p>
              <strong>Security Team</strong>
            </p>
            <p>security@shopwizer.com</p>
          </div>
        </LegalLayout>
      </div>
      <SliceFooter />
    </>
  );
}
