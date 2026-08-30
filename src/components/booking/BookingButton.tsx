import { Link, type LinkProps } from "react-router-dom";

import { useTranslate } from "@/i18n";
import { CalendarCheck } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingButtonProps extends Omit<LinkProps, "to">, VariantProps<typeof buttonVariants> {
  showIcon?: boolean;
  label?: string;
}

/**
 * Routes to the packages page — booking a consultation now starts with
 * choosing a one-time program package (a real appointment slot is picked
 * afterward, from the authenticated Account -> Consultations page, once a
 * purchase has granted consultation credits).
 */
export function BookingButton({
  showIcon = true,
  label,
  className,
  variant,
  size,
  ...props
}: BookingButtonProps) {
  const t = useTranslate();
  return (
    <Link
      to="/packages"
      className={cn(buttonVariants({ variant, size }), "group cursor-pointer", className)}
      {...props}
    >
      {showIcon && (
        <CalendarCheck className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
      )}
      {label ?? t("cta.bookSession")}
    </Link>
  );
}
