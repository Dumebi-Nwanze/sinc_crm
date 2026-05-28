import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "table" | "panel" | "inline" | "pipeline";
  lines?: number;
  className?: string;
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-pulse rounded bg-[var(--color-gray-100)]",
        className,
      )}
    />
  );
}

export function LoadingState({
  variant = "panel",
  lines = 3,
  className,
}: LoadingStateProps) {
  if (variant === "table") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-white p-4",
          className,
        )}
      >
        <SkeletonBar className="mb-4 h-8 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBar key={i} className="mb-3 h-10 w-full last:mb-0" />
        ))}
      </div>
    );
  }

  if (variant === "pipeline") {
    return (
      <div className={cn("flex gap-3 overflow-hidden", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex w-[280px] shrink-0 flex-col rounded-md border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3"
          >
            <SkeletonBar className="mb-3 h-5 w-2/3" />
            <SkeletonBar className="mb-2 h-16 w-full" />
            <SkeletonBar className="mb-2 h-16 w-full" />
            <SkeletonBar className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBar
            key={i}
            className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 p-5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar
          key={i}
          className={cn("h-4", i === 0 ? "w-full" : i === 1 ? "w-4/5" : "w-3/5")}
        />
      ))}
    </div>
  );
}
