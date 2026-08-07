import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Packages } from "@/components/sections/Packages";
import { HowMembershipWorks } from "@/components/sections/HowMembershipWorks";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
import { YouTubeSection } from "@/components/sections/YouTubeSection";
import { EducationPreview } from "@/components/sections/EducationPreview";
import { GalleryTeaser } from "@/components/sections/GalleryTeaser";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { SocialCommunity } from "@/components/sections/SocialCommunity";
import { Contact } from "@/components/sections/Contact";
import { MembershipCta } from "@/components/sections/MembershipCta";
import { Seo } from "@/components/seo/Seo";
import { medicalBusinessSchema, personSchema, faqSchema } from "@/lib/schema";
import { faqs } from "@/data/faqs";
import { scrollToId } from "@/lib/scroll";

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const timeout = setTimeout(() => scrollToId(id, "smooth"), 80);
      return () => clearTimeout(timeout);
    }
  }, [location.hash]);

  return (
    <>
      <Seo
        title="Monzer Allan | Nutrition, Health & Wellness"
        description="Trusted nutrition, health, and wellness guidance from Monzer Allan, Nutrition Specialist and Pharmacist. Join a membership or book a consultation today."
        path="/"
        jsonLd={[medicalBusinessSchema(), personSchema(), faqSchema(faqs)]}
      />
      <Hero />
      <About />
      <Services />
      <Packages />
      <HowMembershipWorks />
      <ProductsPreview />
      <YouTubeSection />
      <EducationPreview />
      <GalleryTeaser />
      <BeforeAfter />
      <Testimonials />
      <FAQ />
      <SocialCommunity />
      <Contact />
      <MembershipCta />
    </>
  );
}
