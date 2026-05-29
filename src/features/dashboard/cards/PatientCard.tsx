import { Link } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientAvatarImage } from "@/components/PatientAvatarImage";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAge } from "@/lib/age";
import {
  usePatientHeader,
  usePatientAllergies,
  usePatientConditions,
} from "@/features/dashboard/hooks/useDashboardQueries";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function PatientCard({ patientId }: { patientId: string }) {
  const headerQ = usePatientHeader(patientId);
  const allergiesQ = usePatientAllergies(patientId);
  const conditionsQ = usePatientConditions(patientId);

  const p = headerQ.data;
  const ageLabel = formatAge(p?.birth_date);

  return (
    <Card
      aria-labelledby="card-patient-title"
      className="border-border/70 p-6 shadow-soft"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-20 w-20 border border-border">
          <PatientAvatarImage path={p?.photo_url} alt={p?.full_name ?? ""} />
          <AvatarFallback className="bg-primary-soft text-primary text-lg font-semibold">
            {initials(p?.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          {headerQ.isPending ? (
            <>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </>
          ) : (
            <>
              <h2
                id="card-patient-title"
                className="truncate text-xl font-semibold tracking-tight"
              >
                {p?.full_name ?? "—"}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {[ageLabel, p?.relation].filter(Boolean).join(" · ") || "—"}
              </p>
              {p?.blood_type && p.blood_type !== "unknown" && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emergency-soft px-2.5 py-0.5 text-xs font-semibold text-emergency">
                  <span aria-hidden>🩸</span> {p.blood_type}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {(allergiesQ.data?.length || conditionsQ.data?.length) ? (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {allergiesQ.data?.map((a) => (
            <Badge
              key={a.id}
              className="bg-emergency text-emergency-foreground hover:bg-emergency"
            >
              {a.name}
            </Badge>
          ))}
          {conditionsQ.data?.map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="bg-primary-soft text-primary hover:bg-primary-soft"
            >
              {c.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <Button
        asChild
        size="lg"
        className="mt-6 h-12 w-full bg-emergency text-emergency-foreground hover:bg-emergency/90"
      >
        <Link to="/emergencia" aria-label="Acessar painel de emergência">
          <Siren className="mr-2 h-5 w-5" /> Emergência
        </Link>
      </Button>
    </Card>
  );
}
