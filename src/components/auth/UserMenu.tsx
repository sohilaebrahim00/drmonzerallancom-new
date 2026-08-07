import { Link } from "react-router-dom";
import { CalendarCheck, LogOut, Package, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

export function UserMenu({ className }: { className?: string }) {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm font-semibold text-navy/80 backdrop-blur-sm transition-all duration-300 hover:border-turquoise hover:bg-card hover:text-turquoise"
          }
        >
          <User className="h-4 w-4" />
          My Account
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/account" className="cursor-pointer">
            <User className="h-4 w-4" /> My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/packages" className="cursor-pointer">
            <CalendarCheck className="h-4 w-4" /> Book Consultation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/products" className="cursor-pointer">
            <Package className="h-4 w-4" /> Products
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
