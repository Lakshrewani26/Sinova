"use server";

import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/session";
import {
  AuthResult,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { prisma } from "@/lib/prisma";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signupAction(
  _previousState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const name = getFormValue(formData, "name").trim();
  const email = normalizeEmail(getFormValue(formData, "email"));
  const password = getFormValue(formData, "password");
  const confirmPassword = getFormValue(formData, "confirmPassword");
  const role = getFormValue(formData, "role").trim() || "BUYER";
  const manufacturerId = getFormValue(formData, "manufacturerId").trim() || null;

  const fieldErrors: AuthResult["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "Name is required.";
  }

  const emailError = validateEmail(email);
  if (emailError) {
    fieldErrors.email = emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    fieldErrors.password = passwordError;
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (role === "SUPPLIER") {
    if (!manufacturerId) {
      fieldErrors.manufacturerId = "Please select your associated manufacturer/factory.";
    } else {
      const m = await prisma.manufacturer.findUnique({
        where: { id: manufacturerId },
      });
      if (!m) {
        fieldErrors.manufacturerId = "Invalid manufacturer selected.";
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password, 12),
        role: role === "SUPPLIER" ? "SUPPLIER" : "BUYER",
        manufacturerId: role === "SUPPLIER" ? manufacturerId : null,
      },
    });

    await createSession(user.id);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        fieldErrors: {
          email: "An account with this email already exists.",
        },
      };
    }

    console.error("Signup failed", error);
    return {
      error: "We could not create your account right now. Please try again.",
    };
  }

  if (user.role === "SUPPLIER") {
    redirect("/supplier/rfqs");
  }

  redirect("/dashboard");
}

export async function loginAction(
  _previousState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = normalizeEmail(getFormValue(formData, "email"));
  const password = getFormValue(formData, "password");

  const fieldErrors: AuthResult["fieldErrors"] = {};

  const emailError = validateEmail(email);
  if (emailError) {
    fieldErrors.email = emailError;
  }

  if (!password) {
    fieldErrors.password = "Password is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || !(await compare(password, user.passwordHash))) {
      return {
        error: "Invalid email or password.",
      };
    }

    await createSession(user.id);
    if (user.role === "SUPPLIER") {
      redirect("/supplier/rfqs");
    }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Login failed", error);
    return {
      error: "We could not sign you in right now. Please try again.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
