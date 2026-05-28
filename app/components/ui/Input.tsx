import type { InputHTMLAttributes, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  labelKey?: string;
  htmlFor?: string;
  error?: string;
  errorKey?: string;
  helper?: string;
  helperKey?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  labelKey,
  htmlFor,
  error,
  errorKey,
  helper,
  helperKey,
  required,
  children,
  className,
}: FormFieldProps) {
  const { t } = useTranslation();
  const labelText = labelKey ? t(labelKey) : label;
  const errorText = errorKey ? t(errorKey) : error;
  const helperText = helperKey ? t(helperKey) : helper;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {labelText && (
        <label
          htmlFor={htmlFor}
          className="text-[12px] font-medium text-[var(--color-gray-700)]"
        >
          {labelText}
          {required && (
            <span className="ml-1 text-[var(--color-error)]">*</span>
          )}
        </label>
      )}
      {children}
      {errorText && (
        <p className="text-[12px] text-[var(--color-error)]">{errorText}</p>
      )}
      {!errorText && helperText && (
        <p className="text-[12px] text-[var(--color-gray-500)]">{helperText}</p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  labelKey?: string;
  errorKey?: string;
  helperKey?: string;
}

export function Input({
  className,
  labelKey,
  errorKey,
  helperKey,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  const input = (
    <input
      id={inputId}
      className={cn(
        "h-9 w-full rounded border border-[var(--color-gray-200)] bg-white px-3 text-[13px] text-[var(--color-gray-800)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)] disabled:cursor-not-allowed disabled:bg-[var(--color-gray-50)]",
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
        htmlFor={inputId}
        errorKey={errorKey}
        helperKey={helperKey}
        required={props.required}
      >
        {input}
      </FormField>
    );
  }

  return input;
}
