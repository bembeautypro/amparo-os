import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHome } from "@/features/dashboard/DashboardHome";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <DashboardHome />
      </AppLayout>
    </ProtectedRoute>
  );
}
