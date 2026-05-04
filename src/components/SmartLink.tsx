import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SmartLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function SmartLink({ href, children, className }: SmartLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "underline underline-offset-4 hover:decoration-solid transition-all",
        className,
      )}
      style={{ color: "var(--yessal-green)" }}
    >
      {children}
    </Link>
  );
}
