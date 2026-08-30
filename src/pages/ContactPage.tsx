import { Seo } from "@/components/seo/Seo";
import { Contact } from "@/components/sections/Contact";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { business } from "@/data/business";
import { breadcrumbSchema } from "@/lib/schema";
import { useTranslate } from "@/i18n";

export default function ContactPage() {
  const t = useTranslate();
  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ]);

  return (
    <div>
      <Seo
        title="Contact"
        description={`Get in touch with ${business.doctorName}, ${business.professionalTitle} — ask a question or book your first session.`}
        path="/contact"
        jsonLd={jsonLd}
      />

      <div className="mx-auto w-full max-w-7xl px-6 pt-10 sm:px-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("common.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("nav.contact")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <section className="pt-6 text-center sm:pt-8">
        <div>
          <p dir="auto" className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("contactPage.heading")}
          </p>
          <h1
            dir="auto"
            className="mx-auto mt-4 max-w-xl px-6 font-display text-4xl font-extrabold tracking-tight text-navy sm:text-5xl"
          >
            {t("contactPage.subheading")}
          </h1>
        </div>
      </section>

      <Contact />
    </div>
  );
}
