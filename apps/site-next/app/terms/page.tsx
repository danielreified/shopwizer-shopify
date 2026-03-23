import { SliceHeader } from '@/components/shopwizer-slices/SliceHeader';
import { SliceFooter } from '@/components/shopwizer-slices/SliceFooter';
import { LegalLayout } from '@/components/legal-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Shopwizer',
  description: 'Terms and conditions governing the use of Shopwizer.',
};

export default function TermsOfService() {
  return (
    <>
      <SliceHeader />
      <div style={{ paddingTop: 80 }}>
        <LegalLayout title="Terms of Service" lastUpdated="January 15, 2026">
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
            Shopwizer application, website, and related services (the &ldquo;Service&rdquo;)
            provided by Shopwizer Inc. (&ldquo;Shopwizer,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
            or &ldquo;our&rdquo;). By installing, accessing, or using the Service, you agree to be
            bound by these Terms.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Shopwizer provides AI-powered product recommendation technology for Shopify stores. The
            Service analyzes product catalogs, customer behavior, and purchase patterns to generate
            personalized product recommendations, bundles, and merchandising suggestions.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            To use the Service, you must have an active Shopify store and install Shopwizer through
            the Shopify App Store. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the security of your account credentials</li>
            <li>All activity that occurs under your account</li>
            <li>Ensuring that your use complies with Shopify&apos;s terms of service</li>
            <li>Providing accurate and current account information</li>
          </ul>

          <h2>4. Subscription and Billing</h2>
          <p>
            The Service is offered through subscription plans billed via Shopify&apos;s billing
            system. By subscribing, you agree to pay the applicable fees for your selected plan.
            Fees are non-refundable except as expressly stated in these Terms or required by law.
          </p>
          <ul>
            <li>Subscription fees are billed monthly or annually through your Shopify account</li>
            <li>We may change pricing with 30 days&apos; prior notice</li>
            <li>
              Free trial periods, if offered, convert to paid subscriptions unless cancelled before
              expiry
            </li>
            <li>Downgrades take effect at the start of the next billing cycle</li>
          </ul>

          <h2>5. Permitted Use</h2>
          <p>
            You agree to use the Service only for lawful purposes and in accordance with these
            Terms. You shall not:
          </p>
          <ul>
            <li>
              Reverse engineer, decompile, or attempt to extract the source code of the Service
            </li>
            <li>Use the Service to transmit harmful, fraudulent, or illegal content</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Resell, sublicense, or redistribute the Service without written permission</li>
            <li>Use the Service in a manner that violates applicable laws or regulations</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its algorithms, software, design, and documentation, is owned by
            Shopwizer and protected by intellectual property laws. Your subscription grants you a
            limited, non-exclusive, non-transferable license to use the Service for your Shopify
            store during the subscription period.
          </p>
          <p>
            You retain all rights to your store data, product information, and customer data. By
            using the Service, you grant us a limited license to process this data solely to provide
            and improve the Service.
          </p>

          <h2>7. Data Processing</h2>
          <p>
            Our collection and use of data is governed by our <a href="/privacy">Privacy Policy</a>.
            By using the Service, you acknowledge and agree to our data practices as described
            therein.
          </p>
          <p>
            As a merchant, you are responsible for ensuring that your use of the Service complies
            with applicable data protection laws with respect to your end-customers. This includes
            providing appropriate privacy notices and obtaining any necessary consents.
          </p>

          <h2>8. Service Availability</h2>
          <p>
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We may
            temporarily suspend the Service for maintenance, updates, or circumstances beyond our
            control. We will provide reasonable notice of planned maintenance when possible.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Shopwizer shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including loss of profits,
            revenue, data, or business opportunities, arising from your use of or inability to use
            the Service.
          </p>
          <p>
            Our total liability for any claims arising from these Terms or the Service shall not
            exceed the fees you paid to us in the twelve months preceding the claim.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold Shopwizer harmless from any claims, losses, or damages
            arising from your use of the Service, violation of these Terms, or infringement of any
            third-party rights.
          </p>

          <h2>11. Termination</h2>
          <p>
            Either party may terminate these Terms at any time. You may cancel by uninstalling the
            app from your Shopify store. We may suspend or terminate your access if you violate
            these Terms or if required by law.
          </p>
          <p>
            Upon termination, your right to use the Service ceases immediately. We will delete your
            data within 30 days of termination, unless retention is required by law.
          </p>

          <h2>12. Modifications to Terms</h2>
          <p>
            We may modify these Terms at any time. Material changes will be communicated via email
            or through the Service at least 30 days before taking effect. Continued use after
            changes take effect constitutes acceptance of the revised Terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without
            regard to conflict of law principles. Any disputes shall be resolved through binding
            arbitration in accordance with the rules of the American Arbitration Association.
          </p>

          <h2>14. Contact</h2>
          <div className="contact-box">
            <p>
              <strong>Shopwizer Inc.</strong>
            </p>
            <p>legal@shopwizer.com</p>
          </div>
        </LegalLayout>
      </div>
      <SliceFooter />
    </>
  );
}
