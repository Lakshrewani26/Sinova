import { redirect } from "next/navigation";
import { AuthForm } from "@/app/auth/AuthForm";
import { AuthShell } from "@/app/auth/AuthShell";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Secure access"
      title="Welcome back."
      subtitle="Sign in to continue to your SINOVA dashboard."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
