import { Lineicons } from "@lineiconshq/react-lineicons";
import type { IconData } from "@lineiconshq/free-icons";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: IconData;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Icon({
  icon,
  size = 16,
  color = "currentColor",
  strokeWidth = 1.5,
  className,
}: IconProps) {
  return (
    <Lineicons
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
    />
  );
}
