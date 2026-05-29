import { forwardRef, type ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof Button>;

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    { loading, loadingText, children, disabled, className, ...rest },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(className)}
        {...rest}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>{loadingText ?? "Aguarde..."}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);
