import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

const errorAlertVariants = cva(
  "relative flex items-start gap-3 rounded-xl border p-4 text-sm",
  {
    variants: {
      variant: {
        error:
          "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300",
        warning:
          "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300",
        success:
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-300",
        info:
          "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
)

const ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const

interface ErrorAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorAlertVariants> {
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
}

function ErrorAlert({
  className,
  variant = "error",
  title,
  message,
  dismissible,
  onDismiss,
  ...props
}: ErrorAlertProps) {
  const Icon = ICONS[variant ?? "error"]

  return (
    <div
      data-slot="error-alert"
      role="alert"
      className={cn(errorAlertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold leading-snug mb-0.5">{title}</p>}
        <p className="leading-snug">{message}</p>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export { ErrorAlert, errorAlertVariants }
