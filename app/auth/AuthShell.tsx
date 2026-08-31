import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
}: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="auth-brand" href="/index.html" aria-label="SINOVA AI home">
          <span className="auth-mark">
            <i />
            <i />
            <i />
          </span>
          SINOVA <em>AI</em>
        </Link>

        <p className="auth-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {children}
      </section>
    </main>
  );
}
