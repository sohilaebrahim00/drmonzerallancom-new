import { Seo } from "@/components/seo/Seo";
import { LegalLayout } from "@/components/common/LegalLayout";
import { ContactMethodLink } from "@/components/common/ContactMethodLink";
import { business } from "@/data/business";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="How Monzer Allan collects, uses, and protects your personal information."
        path="/privacy-policy"
        noindex
      />
      <LegalLayout title="Privacy Policy" updated="August 6, 2026">
        <p>
          This Privacy Policy explains how {business.doctorName} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects information you
          provide when you use this website, request a consultation, or communicate with us.
        </p>

        <h2>Information We Collect</h2>
        <p>We collect information you voluntarily provide, including:</p>
        <ul>
          <li>Contact details such as your name, email address, and phone number.</li>
          <li>
            Booking information, including preferred service, date, time, and any notes you share.
          </li>
          <li>Messages sent through our contact form, WhatsApp, or email.</li>
          <li>
            Health-related information you choose to share during a consultation, which is treated
            as confidential and used solely to provide nutrition guidance.
          </li>
        </ul>
        <p>
          We do not knowingly collect information from children without parental involvement, and
          services for minors are provided with a parent or guardian's participation.
        </p>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To schedule, confirm, and manage your consultations.</li>
          <li>To respond to inquiries sent through our contact form, email, or WhatsApp.</li>
          <li>To develop and adjust your personalized nutrition guidance.</li>
          <li>To improve our services and website experience.</li>
        </ul>
        <p>We do not sell, rent, or trade your personal information to third parties.</p>

        <h2>How We Protect Your Information</h2>
        <p>
          We take reasonable technical and organizational measures to protect your information from
          unauthorized access, alteration, or disclosure. However, no method of transmission over
          the internet is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2>Cookies &amp; Analytics</h2>
        <p>
          This website may use minimal cookies or analytics tools to understand how visitors use the
          site and to improve performance. These tools do not collect sensitive personal or health
          information.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          Booking requests may be sent via WhatsApp or email, which are subject to the respective
          privacy policies of those platforms. We encourage you to review their policies as well.
        </p>

        <h2>Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal information at any
          time by contacting us via <ContactMethodLink />.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page
          with an updated revision date.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us via{" "}
          <ContactMethodLink />.
        </p>
      </LegalLayout>
    </>
  );
}
