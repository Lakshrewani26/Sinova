"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction } from "@/app/auth/actions";
import type { AuthResult } from "@/lib/validation";

const initialState: AuthResult = {};

type AuthFormProps =
  | {
      mode: "login";
    }
  | {
      mode: "signup";
    };

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const action = isSignup ? signupAction : loginAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="auth-form" action={formAction} noValidate>
      {state.error ? (
        <p className="auth-alert" role="alert">
          {state.error}
        </p>
      ) : null}

      {isSignup ? (
        <label>
          Name
          <input
            autoComplete="name"
            name="name"
            placeholder="Your name"
            required
            type="text"
          />
          {state.fieldErrors?.name ? (
            <span>{state.fieldErrors.name}</span>
          ) : null}
        </label>
      ) : null}

      <label>
        Email
        <input
          autoComplete="email"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
        {state.fieldErrors?.email ? <span>{state.fieldErrors.email}</span> : null}
      </label>

      <label>
        Password
        <input
          autoComplete={isSignup ? "new-password" : "current-password"}
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
        {state.fieldErrors?.password ? (
          <span>{state.fieldErrors.password}</span>
        ) : null}
      </label>

      {isSignup ? (
        <label>
          Confirm password
          <input
            autoComplete="new-password"
            name="confirmPassword"
            placeholder="Repeat your password"
            required
            type="password"
          />
          {state.fieldErrors?.confirmPassword ? (
            <span>{state.fieldErrors.confirmPassword}</span>
          ) : null}
        </label>
      ) : null}

      <button className="auth-button" disabled={pending} type="submit">
        {pending ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
      </button>

      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "New to SINOVA?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>

      {!isSignup ? (
        <p className="auth-switch small-link">
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
      ) : null}
    </form>
  );
}
