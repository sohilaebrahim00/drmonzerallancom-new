import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Hero } from "@/components/landing/Hero";
import { AboutPreview } from "@/components/sections/AboutPreview";
import { Services } from "@/components/sections/Services";
import { ProgramPackages } from "@/components/sections/ProgramPackages";
import { HowProgramsWork } from "@/components/sections/HowProgramsWork";
import { ProductsPreview } from "@/components/sections/ProductsPreview";
import { MemberExperiencePreview } from "@/components/sections/MemberExperiencePreview";
import { YouTubeSection } from "@/components/sections/YouTubeSection";
import { EducationPreview } from "@/components/sections/EducationPreview";
import { ContentDiscovery } from "@/components/sections/ContentDiscovery";
import { GalleryTeaser } from "@/components/sections/GalleryTeaser";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Testimonials } from "@/components/sections/Testimonials";
import { FaqPreview } from "@/components/sections/FaqPreview";
import { SocialCommunity } from "@/components/sections/SocialCommunity";
import { ProgramCta } from "@/components/sections/ProgramCta";
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
        description="Trusted nutrition, health, and wellness guidance from Monzer Allan, Nutrition Specialist and Pharmacist. Choose a one-time Weight Loss or Treatment program today."
        path="/"
        jsonLd={[medicalBusinessSchema(), personSchema(), faqSchema(faqs)]}
      />
      <Hero />
      <AboutPreview />
      <Services />
      <ProgramPackages />
      <HowProgramsWork />
      <ProductsPreview />
      <MemberExperiencePreview />
      <YouTubeSection />
      <EducationPreview />
      <ContentDiscovery />
      <GalleryTeaser />
      <BeforeAfter />
      <Testimonials />
      <FaqPreview />
      <SocialCommunity />
      <ProgramCta />
    </>
  );
}
