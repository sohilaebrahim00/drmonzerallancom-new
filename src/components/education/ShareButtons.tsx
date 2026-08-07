import { useState } from "react";
import { Check, Link2, Linkedin, Send } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
      icon: Send,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: Linkedin,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Share:
      </span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${link.label}`}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border text-navy/70 transition-colors hover:border-turquoise hover:text-turquoise"
        >
          <link.icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border text-navy/70 transition-colors hover:border-turquoise hover:text-turquoise"
      >
        {copied ? <Check className="h-4 w-4 text-green" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
