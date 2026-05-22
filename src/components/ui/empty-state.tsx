import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  size?: "sm" | "md" | "lg"
}

function EmptyState({
  className,
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  ...props
}: EmptyStateProps) {
  const iconSize = { sm: "size-8", md: "size-12", lg: "size-16" }[size]
  const titleSize = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size]
  const padding = { sm: "py-8", md: "py-12", lg: "py-16" }[size]

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        padding,
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex items-center justify-center rounded-full bg-muted/50 p-3">
          <Icon
            className={cn(iconSize, "text-muted-foreground/50")}
            aria-hidden="true"
          />
        </div>
      )}
      <div className="space-y-1">
        <p className={cn("font-medium text-foreground", titleSize)}>{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export { EmptyState }
