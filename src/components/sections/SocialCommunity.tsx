import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { SocialLinks } from "@/components/common/SocialLinks";
import { business } from "@/data/business";

export function SocialCommunity() {
  return (
    <section id="community" className="relative py-20 sm:py-28" aria-labelledby="community-heading">
      <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
        <SectionHeading
          eyebrow="Community"
          title="Join the Community"
          description={`Follow ${business.doctorName} for daily nutrition tips, behind-the-scenes updates, and educational content.`}
        />
        <Reveal direction="up" delay={0.1} className="mt-8 flex justify-center">
          <SocialLinks iconClassName="h-12 w-12" />
        </Reveal>
      </div>
    </section>
  );
}
