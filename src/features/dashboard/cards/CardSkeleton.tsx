import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="border-border/70 p-5 shadow-soft">
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </Card>
  );
}
