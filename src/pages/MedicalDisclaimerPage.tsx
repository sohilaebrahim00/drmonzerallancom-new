import { Seo } from "@/components/seo/Seo";
import { LegalLayout } from "@/components/common/LegalLayout";
import { ContactMethodLink } from "@/components/common/ContactMethodLink";
import { business } from "@/data/business";

export default function MedicalDisclaimerPage() {
  return (
    <>
      <Seo
        title="Medical Disclaimer"
        description="Important information about the educational nature of the content and services on this website."
        path="/medical-disclaimer"
        noindex
      />
      <LegalLayout title="Medical Disclaimer" updated="August 6, 2026">
        <p>
          The content on this website, including articles, service descriptions, and any guidance
          provided by {business.doctorName}, is intended for general educational and informational
          purposes only. It is not intended to diagnose, treat, cure, or prevent any disease or
          medical condition.
        </p>

        <h2>Not a Substitute for Medical Advice</h2>
        <p>
          Nothing on this website or provided during a consultation should be considered a
          substitute for professional medical advice, diagnosis, or treatment from a licensed
          physician or qualified healthcare provider. Always seek the advice of your doctor or
          another qualified health provider with any questions you may have regarding a medical
          condition, medication, or before making changes to your diet or lifestyle.
        </p>

        <h2>Individual Results May Vary</h2>
        <p>
          Nutrition guidance is personalized where possible, but individual results depend on many
          factors, including adherence, medical history, genetics, and lifestyle. Any statistics,
          testimonials, or transformation examples that may appear on this website are illustrative
          only, are never published without the client's explicit consent, and results are not
          guaranteed.
        </p>

        <h2>Wellness Products</h2>
        <p>
          Any products featured on this website are intended to support a healthy daily routine.
          They are not intended to diagnose, treat, cure, or prevent any disease, and do not replace
          medication or medical care.
        </p>

        <h2>Emergency Situations</h2>
        <p>
          If you are experiencing a medical emergency, call your local emergency services
          immediately. Do not rely on this website, our chat widget, or any communication with our
          practice for urgent or emergency medical needs.
        </p>

        <h2>Coordination With Your Healthcare Provider</h2>
        <p>
          Clients managing existing medical conditions, taking medication, or who are pregnant or
          nursing should consult their physician before beginning any new nutrition plan. We
          encourage coordination between our guidance and your existing medical care.
        </p>

        <h2>Nutrition Support for Cancer Patients</h2>
        <p>
          Our nutrition support for cancer patients is{" "}
          <strong>supportive nutritional care only</strong>. It is intended to help with maintaining
          weight and muscle, appetite loss, nausea, taste changes, and eating through the side
          effects of treatment. It complements — and never replaces — the treatment plan prescribed
          by your oncologist and oncology team.
        </p>
        <p>
          Nothing offered by this practice treats, cures, shrinks, slows, or prevents cancer, and we
          make no claim about survival, remission, or recurrence. Never start, stop, or change any
          treatment, medication, or supplement on the basis of nutritional guidance. Decisions about
          your treatment, and questions about whether a particular food or supplement is safe during
          chemotherapy, radiotherapy, immunotherapy, or surgery, belong with your oncology team.
        </p>

        <h2>No Doctor-Patient Relationship</h2>
        <p>
          Use of this website or engagement with our nutrition consultation services does not create
          a doctor-patient relationship between you and {business.doctorName}.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this disclaimer, please contact us via <ContactMethodLink />.
        </p>
      </LegalLayout>
    </>
  );
}
