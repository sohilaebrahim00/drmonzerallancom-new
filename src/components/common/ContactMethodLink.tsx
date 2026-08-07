import { Link } from "react-router-dom";

import { business } from "@/data/business";
import { whatsappLink } from "@/config/contact";

/** Renders the best available way to reach the practice — never a fabricated email/phone. */
export function ContactMethodLink() {
  if (business.email) {
    return (
      <a
        href={`mailto:${business.email}`}
        className="font-semibold text-primary hover:text-turquoise"
      >
        {business.email}
      </a>
    );
  }

  const waHref = whatsappLink("Hello, I have a question about the website policies.");
  if (waHref) {
    return (
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary hover:text-turquoise"
      >
        WhatsApp
      </a>
    );
  }

  return (
    <Link to="/contact" className="font-semibold text-primary hover:text-turquoise">
      our Contact page
    </Link>
  );
}
