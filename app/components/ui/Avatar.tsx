import {
  Avatar as AvatarRoot,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/_primitives/avatar";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-[12px]",
  lg: "h-10 w-10 text-[13px]",
};

export function Avatar({ src, alt, name = "", size = "md", className }: AvatarProps) {
  return (
    <AvatarRoot className={cn(sizeClasses[size], className)}>
      {src && (
        <AvatarImage src={src} alt={alt ?? name} />
      )}
      <AvatarFallback delayMs={src ? 600 : 0}>
        {getInitials(name || alt || "?")}
      </AvatarFallback>
    </AvatarRoot>
  );
}
