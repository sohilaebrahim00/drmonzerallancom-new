import { Seo } from "@/components/seo/Seo";
import { LegalLayout } from "@/components/common/LegalLayout";
import { ContactMethodLink } from "@/components/common/ContactMethodLink";
import { business } from "@/data/business";

export default function TermsPage() {
  return (
    <>
      <Seo
        title="Terms of Service"
        description="The terms and conditions for using Monzer Allan's website and nutrition services."
        path="/terms"
        noindex
      />
      <LegalLayout title="Terms of Service" updated="August 6, 2026">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of this website and the
          nutrition consultation services offered by {business.doctorName}. By using this website or
          booking a session, you agree to these Terms.
        </p>

        <h2>Services</h2>
        <p>
          We provide nutrition consultation and educational services, available online and
          in-person, as described on this website. Service availability, pricing, and package
          details are subject to change without prior notice.
        </p>

        <h2>Bookings &amp; Payments</h2>
        <ul>
          <li>
            Booking requests submitted through this website are requests only and are confirmed once
            acknowledged by our team, or directly through your selected online scheduling provider.
          </li>
          <li>
            Pricing displayed on this website is indicative and may be confirmed at the time of
            booking.
          </li>
          <li>
            We ask for at least 24 hours' notice to reschedule or cancel a session. Late
            cancellations or no-shows may be subject to our cancellation policy as communicated at
            the time of booking.
          </li>
        </ul>

        <h2>Client Responsibilities</h2>
        <p>
          You agree to provide accurate and complete information about your health history, current
          medications, and goals to help us provide safe and effective guidance. You are responsible
          for consulting your physician regarding any medical condition before making significant
          dietary changes.
        </p>

        <h2>No Guarantee of Results</h2>
        <p>
          Nutrition outcomes vary by individual and depend on many factors outside our control,
          including adherence, underlying health conditions, and lifestyle. We do not guarantee
          specific results.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All content on this website, including text, graphics, logos, and articles, is the
          property of {business.doctorName} unless otherwise noted, and may not be reproduced
          without permission.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, {business.doctorName} shall not be liable for any
          indirect, incidental, or consequential damages arising from your use of this website or
          our services.
        </p>

        <h2>Changes to These Terms</h2>
        <p>
          We may revise these Terms from time to time. Continued use of the website after changes
          are posted constitutes acceptance of the revised Terms.
        </p>

        <h2>Contact Us</h2>
        <p>
          Questions about these Terms can be directed to us via <ContactMethodLink />.
        </p>
      </LegalLayout>
    </>
  );
}
