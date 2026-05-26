import { Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Bem-vindo ao Amparo
      </div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        A saúde da sua família em um só lugar
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Organize remédios, exames, consultas e histórico de quem você cuida.
      </p>

      <ul className="mt-8 space-y-3">
        <Feature
          icon={HeartHandshake}
          title="Cuidado compartilhado"
          desc="Convide irmãos e cuidadores para acompanhar juntos."
        />
        <Feature
          icon={ShieldCheck}
          title="Pronto para emergências"
          desc="Dados vitais sempre à mão quando mais importa."
        />
      </ul>

      <Button onClick={onNext} className="mt-10 h-12 w-full text-base sm:w-auto sm:px-8">
        Começar organização
      </Button>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
