import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { Button as ButtonPrimitive } from "@/components/ui/_primitives/button";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)] disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed text-[13px] w-full md:w-auto",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary-800)] text-white hover:bg-[var(--color-primary-900)]",
        secondary:
          "bg-white border border-[var(--color-gray-200)] text-[var(--color-gray-800)] hover:bg-[var(--color-gray-50)]",
        ghost:
          "text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] hover:text-[var(--color-gray-900)]",
        destructive:
          "bg-[var(--color-error)] text-white hover:bg-[#b91c1c]",
      },
      size: {
        sm: "h-8 min-h-[44px] md:min-h-0 px-3",
        md: "h-9 min-h-[44px] md:min-h-0 px-4",
        lg: "h-10 min-h-[44px] md:min-h-0 px-5",
        icon: "h-9 w-9 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const { t } = useTranslation();
  const resolvedClassName = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    return (
      <ButtonPrimitive asChild className={resolvedClassName} {...props}>
        {children}
      </ButtonPrimitive>
    );
  }

  return (
    <button
      className={resolvedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
      {loading && <span className="sr-only">{t("loading")}</span>}
    </button>
  );
}
