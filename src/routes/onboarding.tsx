import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingFlow />
    </ProtectedRoute>
  );
}
