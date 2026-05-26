import type { ReactNode } from "react";
import { Heart } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Heart className="h-7 w-7" fill="currentColor" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            {children}
          </div>

          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
      </main>

      <footer className="px-5 pb-6 text-center text-xs text-muted-foreground">
        Amparo · Cuidando de quem cuidou de você
      </footer>
    </div>
  );
}
