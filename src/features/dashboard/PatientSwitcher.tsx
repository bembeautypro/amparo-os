import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientAvatarImage } from "@/components/PatientAvatarImage";
import { cn } from "@/lib/utils";
import { useFamilyContext } from "@/contexts/FamilyContext";

function shortName(name: string) {
  return name.split(" ")[0] ?? name;
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function PatientSwitcher() {
  const { patients, activePatient, setActivePatient } = useFamilyContext();
  if (patients.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Selecionar familiar"
      className="sticky top-16 z-20 -mx-4 border-b border-border bg-background/85 px-4 py-2 backdrop-blur md:-mx-8 md:px-8"
      style={{ marginTop: "-1.5rem" }}
    >
      <div className="flex gap-2 overflow-x-auto">
        {patients.map((p) => {
          const active = activePatient?.id === p.id;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActivePatient(p)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              <Avatar className="h-7 w-7">
                <PatientAvatarImage path={p.avatarUrl} alt={p.name} />
                <AvatarFallback className="bg-primary-soft text-primary text-[10px] font-semibold">
                  {initials(p.name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{shortName(p.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
