import Link from "next/link";
import { AuthShell } from "@/app/auth/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account help"
      title="Password reset is not configured yet."
      subtitle="Email-based password recovery will be added when outbound email is configured."
    >
      <div className="auth-note">
        <p>No reset email has been sent.</p>
        <Link className="auth-button secondary" href="/login">
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}
