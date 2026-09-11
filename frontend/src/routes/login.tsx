import { createFileRoute } from "@tanstack/react-router";

import { LoginForm } from "@/features/auth/login-form";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In to Your Tixora Account" },
      {
        name: "description",
        content: "Sign in to Tixora to access your tickets and bookings.",
      },
    ],
  }),
  component: LoginForm,
});