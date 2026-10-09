import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/action-plans")({
  beforeLoad: () => {
    throw redirect({ to: "/plano-acao" });
  },
});
