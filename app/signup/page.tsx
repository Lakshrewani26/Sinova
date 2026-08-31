import { redirect } from "next/navigation";
import { AuthForm } from "@/app/auth/AuthForm";
import { AuthShell } from "@/app/auth/AuthShell";
import { getCurrentUser } from "@/lib/session";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start sourcing smarter."
      subtitle="Create a SINOVA account with a secure password."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
