import { Button } from "@/components/ui/button";

export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
      <div className="flex justify-center">
        <WelcomeIllustration />
      </div>

      <h1 className="mt-8 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        A saúde da sua família em um só lugar
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-muted-foreground">
        Organize remédios, exames, consultas e histórico de quem você cuida.
      </p>

      <div className="mt-10 flex justify-center">
        <Button onClick={onNext} className="h-12 w-full text-base sm:w-auto sm:px-10">
          Começar organização
        </Button>
      </div>
    </div>
  );
}

function WelcomeIllustration() {
  return (
    <svg
      width="180"
      height="160"
      viewBox="0 0 180 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Família protegida com cuidado"
    >
      {/* Soft background circle */}
      <circle cx="90" cy="84" r="74" fill="var(--primary-soft)" />

      {/* Protective shield */}
      <path
        d="M90 28 L132 44 V92 C132 116 113 134 90 142 C67 134 48 116 48 92 V44 Z"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Heart */}
      <path
        d="M90 112 C90 112 70 100 70 84 C70 76 76 70 84 70 C87 70 89 71 90 73 C91 71 93 70 96 70 C104 70 110 76 110 84 C110 100 90 112 90 112 Z"
        fill="var(--primary)"
      />

      {/* Family figures */}
      <circle cx="70" cy="52" r="6" fill="var(--primary)" />
      <path d="M60 70 C60 64 64 60 70 60 C76 60 80 64 80 70 V72 H60 Z" fill="var(--primary)" />

      <circle cx="110" cy="52" r="6" fill="var(--primary)" />
      <path d="M100 70 C100 64 104 60 110 60 C116 60 120 64 120 70 V72 H100 Z" fill="var(--primary)" />

      <circle cx="90" cy="48" r="5" fill="var(--primary)" opacity="0.7" />
      <path d="M82 64 C82 59 85 56 90 56 C95 56 98 59 98 64 V66 H82 Z" fill="var(--primary)" opacity="0.7" />
    </svg>
  );
}
