import { redirect } from "next/navigation";
import { AuthForm } from "@/app/auth/AuthForm";
import { AuthShell } from "@/app/auth/AuthShell";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "SUPPLIER") {
      redirect("/supplier/rfqs");
    } else {
      redirect("/dashboard");
    }
  }

  const manufacturers = await prisma.manufacturer.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start sourcing smarter."
      subtitle="Create a SINOVA account with a secure password."
    >
      <AuthForm mode="signup" manufacturers={manufacturers} />
    </AuthShell>
  );
}
