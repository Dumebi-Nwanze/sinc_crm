import { LoadingState } from "@/components/ui";
import { cn } from "@/lib/utils";

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

function StatCardSkeleton() {
  return (
    <div className="rounded-md border border-[var(--color-gray-200)] bg-white p-5">
      <SkeletonBar className="h-9 w-9 rounded-full" />
      <SkeletonBar className="mt-4 h-8 w-16" />
      <SkeletonBar className="mt-2 h-4 w-24" />
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-white">
      <div className="border-b border-[var(--color-gray-100)] px-4 py-3.5">
        <SkeletonBar className="h-4 w-32" />
      </div>
      <LoadingState variant="inline" lines={5} className="px-4 py-3" />
    </div>
  );
}

interface DashboardSkeletonProps {
  variant?: "sales" | "client";
}

export function DashboardSkeleton({ variant = "sales" }: DashboardSkeletonProps) {
  if (variant === "client") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
      <PanelSkeleton />
    </div>
  );
}
