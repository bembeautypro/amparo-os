import { Pill, FileUp, CalendarPlus, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepFirstAction({
  familyId,
  onChoose,
}: {
  familyId: string;
  onChoose: (target: string) => void;
}) {
  const actions = [
    {
      icon: Pill,
      title: "Adicionar medicamento",
      desc: "Cadastre doses e horários",
      target: `/familia/${familyId}/medicamentos/novo`,
    },
    {
      icon: FileUp,
      title: "Subir receita ou exame",
      desc: "Mantenha tudo digitalizado",
      target: `/familia/${familyId}/documentos/novo`,
    },
    {
      icon: CalendarPlus,
      title: "Criar consulta",
      desc: "Agende e receba lembretes",
      target: `/familia/${familyId}/agenda/novo`,
    },
    {
      icon: LayoutDashboard,
      title: "Ver meu painel",
      desc: "Comece pelo resumo geral",
      target: "/dashboard",
      primary: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Quase pronto! O que você quer organizar agora?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Escolha por onde começar. Você pode acessar tudo depois pelo menu.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {actions.map(({ icon: Icon, title, desc, target, primary }) => (
          <button
            key={title}
            onClick={() => onChoose(target)}
            className={cn(
              "group flex flex-col items-start gap-3 rounded-xl border border-border bg-background p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card",
              primary && "border-primary/30 bg-primary-soft/50",
            )}
          >
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                primary && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold leading-tight">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
