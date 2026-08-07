import { Facebook, Youtube } from "lucide-react";

import { InstagramIcon } from "@/components/landing/instagram";
import { TikTokIcon } from "@/components/landing/tiktok";
import { business } from "@/data/business";
import { cn } from "@/lib/utils";

export function SocialLinks({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  const links = [
    { href: business.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: business.facebook, label: "Facebook", Icon: Facebook },
    { href: business.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: business.youtube, label: "YouTube", Icon: Youtube },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));

  if (links.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${business.doctorName} on ${label}`}
          className={cn(
            "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-navy/70 transition-colors hover:border-turquoise hover:text-turquoise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            iconClassName,
          )}
        >
          <Icon className="h-[1.05rem] w-[1.05rem]" />
        </a>
      ))}
    </div>
  );
}
