import { SectionHeading } from "@/components/common/SectionHeading";
import { SocialLinks } from "@/components/common/SocialLinks";
import { business } from "@/data/business";
import { useTranslate } from "@/i18n";

export function SocialCommunity() {
  const t = useTranslate();
  return (
    <section id="community" className="relative py-20 sm:py-28" aria-labelledby="community-heading">
      <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
        <SectionHeading
          eyebrow={t("community.eyebrow")}
          title={t("community.title")}
          description={`Follow ${business.doctorName} for daily nutrition tips, behind-the-scenes updates, and educational content.`}
        />
        <div className="mt-8 flex justify-center">
          <SocialLinks iconClassName="h-12 w-12" />
        </div>
      </div>
    </section>
  );
}
