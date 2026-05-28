import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/ui/Input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  labelKey?: string;
  errorKey?: string;
  helperKey?: string;
}

export function Textarea({
  className,
  labelKey,
  errorKey,
  helperKey,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  const textarea = (
    <textarea
      id={textareaId}
      className={cn(
        "min-h-[80px] w-full resize-y rounded border border-[var(--color-gray-200)] bg-white px-3 py-2 text-[13px] text-[var(--color-gray-800)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)] disabled:cursor-not-allowed disabled:bg-[var(--color-gray-50)]",
        errorKey && "border-[var(--color-error)] focus:ring-[var(--color-error-light)]",
        className,
      )}
      {...props}
    />
  );

  if (labelKey || errorKey || helperKey) {
    return (
      <FormField
        labelKey={labelKey}
        htmlFor={textareaId}
        errorKey={errorKey}
        helperKey={helperKey}
        required={props.required}
      >
        {textarea}
      </FormField>
    );
  }

  return textarea;
}
