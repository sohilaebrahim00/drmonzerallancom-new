import { Link, type LinkProps } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingButtonProps extends Omit<LinkProps, "to">, VariantProps<typeof buttonVariants> {
  packageSlug?: string;
  serviceSlug?: string;
  showIcon?: boolean;
  label?: string;
}

export function BookingButton({
  packageSlug,
  serviceSlug,
  showIcon = true,
  label = "Book a Session",
  className,
  variant,
  size,
  ...props
}: BookingButtonProps) {
  const params = new URLSearchParams();
  if (packageSlug) params.set("package", packageSlug);
  if (serviceSlug) params.set("service", serviceSlug);
  const to = params.toString() ? `/booking?${params.toString()}` : "/booking";

  return (
    <Link
      to={to}
      className={cn(buttonVariants({ variant, size }), "group cursor-pointer", className)}
      {...props}
    >
      {showIcon && (
        <CalendarCheck className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
      )}
      {label}
    </Link>
  );
}
