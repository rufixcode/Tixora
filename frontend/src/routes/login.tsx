import { createFileRoute } from "@tanstack/react-router";

import { LoginForm } from "@/features/auth/login-form";
import { loginSearch } from "@/lib/login-return";

export const Route = createFileRoute("/login")({
  validateSearch: loginSearch,
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
