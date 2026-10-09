import { createFileRoute } from "@tanstack/react-router";

import { RegisterForm } from "@/features/auth/register-form";
import { loginSearch } from "@/lib/login-return";

export const Route = createFileRoute("/register")({
  validateSearch: loginSearch,
  head: () => ({
    meta: [
      { title: "Create Your Tixora Account" },
      {
        name: "description",
        content: "Create a Tixora account to book tickets and save events.",
      },
    ],
  }),
  component: RegisterForm,
});
