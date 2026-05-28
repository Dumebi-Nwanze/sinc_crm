import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/_primitives/select";
import { cn } from "@/lib/utils";

export interface AppSelectOption {
  value: string;
  label: string;
}

export interface AppSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  labelKey?: string;
  placeholderKey?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  id?: string;
}

export function AppSelect({
  value,
  onValueChange,
  options,
  labelKey,
  placeholderKey,
  disabled,
  className,
  size = "md",
  id,
}: AppSelectProps) {
  const { t } = useTranslation();
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const select = (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={selectId}
        size={size === "sm" ? "sm" : "default"}
        className={cn(className)}
        aria-label={labelKey ? t(labelKey) : undefined}
      >
        <SelectValue
          placeholder={
            placeholderKey ? t(placeholderKey) : undefined
          }
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (labelKey) {
    return (
      <FormField labelKey={labelKey} htmlFor={selectId}>
        {select}
      </FormField>
    );
  }

  return select;
}
