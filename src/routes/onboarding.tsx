import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FamilyProvider } from "@/contexts/FamilyContext";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <ProtectedRoute>
      <FamilyProvider>
        <OnboardingFlow />
      </FamilyProvider>
    </ProtectedRoute>
  );
}
