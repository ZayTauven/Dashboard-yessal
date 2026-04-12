import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandMarkSize = "sm" | "md" | "lg";

interface BrandMarkProps {
  href?: string;
  size?: BrandMarkSize;
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeMap: Record<
  BrandMarkSize,
  { icon: string; title: string; subtitle: string; gap: string }
> = {
  sm: {
    icon: "h-10 w-10 rounded-xl p-1.5",
    title: "text-sm",
    subtitle: "text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    icon: "h-12 w-12 rounded-2xl p-2",
    title: "text-base",
    subtitle: "text-[11px]",
    gap: "gap-3",
  },
  lg: {
    icon: "h-16 w-16 rounded-3xl p-3",
    title: "text-xl",
    subtitle: "text-xs",
    gap: "gap-4",
  },
};

export function BrandMark({
  href = "/",
  size = "md",
  showSubtitle = true,
  subtitle = "",
  className,
}: BrandMarkProps) {
  const dims = sizeMap[size];

  const content = (
    <div className={cn("inline-flex items-center", dims.gap, className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-background border border-border shadow-sm",
          dims.icon,
        )}
      >
        <Image
          src="/logo.svg"
          alt="Yessal Gui"
          width={56}
          height={56}
          priority
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-semibold tracking-[-0.03em] text-foreground",
            dims.title,
          )}
        >
          Yessal Gui
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "mt-1 font-medium uppercase tracking-[0.18em] text-muted-foreground/80",
              dims.subtitle,
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
