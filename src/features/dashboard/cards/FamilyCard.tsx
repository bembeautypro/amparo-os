import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFamilyMembers } from "@/features/dashboard/hooks/useDashboardQueries";

const RELATION_INITIAL: Record<string, string> = {
  child: "F",
  spouse: "C",
  caregiver: "Cu",
  parent: "P",
  sibling: "I",
  other: "?",
};

export function FamilyCard({ familyId }: { familyId: string }) {
  const q = useFamilyMembers(familyId);
  const members = q.data ?? [];
  const visible = members.slice(0, 5);
  const overflow = Math.max(0, members.length - visible.length);

  return (
    <Card
      aria-labelledby="card-family-title"
      className="border-border/70 p-5 shadow-soft"
    >
      <header className="flex items-center justify-between">
        <h2 id="card-family-title" className="text-base font-semibold">
          Família
        </h2>
        <Link
          to="/familia"
          className="text-sm font-medium text-primary hover:underline"
        >
          Gerenciar
        </Link>
      </header>

      <div className="mt-4 flex items-center gap-3">
        {q.isPending ? (
          <Skeleton className="h-9 w-40" />
        ) : members.length > 0 ? (
          <>
            <div className="flex -space-x-2">
              {visible.map((m) => (
                <Avatar
                  key={m.id}
                  className="h-9 w-9 border-2 border-card"
                >
                  <AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">
                    {RELATION_INITIAL[m.relation] ?? "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {overflow > 0 && (
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">
                  +{overflow}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {members.length}{" "}
              {members.length === 1 ? "membro" : "membros"} com acesso
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Apenas você
          </div>
        )}
      </div>
    </Card>
  );
}
