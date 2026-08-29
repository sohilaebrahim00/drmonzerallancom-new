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

export default function ContactPage() {
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
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Contact</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <section className="pt-6 text-center sm:pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Get in Touch
          </p>
          <h1 className="mx-auto mt-4 max-w-xl px-6 font-display text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
            Let&apos;s Talk
          </h1>
        </div>
      </section>

      <Contact />
    </div>
  );
}
