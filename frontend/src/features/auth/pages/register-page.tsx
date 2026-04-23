"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import useAuthStore from "@/store/auth";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must have at least 3 characters")
      .max(20, "Username must have at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers and underscores",
      ),
    password: z.string().min(6, "Password must have at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must have at least 6 characters"),
  })
  .refine((formData) => formData.password === formData.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Renders the register view and handles account creation flow.
 * @returns {ReactElement} Register view page
 */
export default function RegisterPage(): ReactElement {
  const router = useRouter();
  const [apiError, setApiError] = useState<string>("");
  const registerUser = useAuthStore((state) => state.register);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Sends registration data to backend and redirects to login on success.
   * @param {RegisterFormData} formData - Register form data
   * @returns {Promise<void>} Promise without result
   */
  const submitRegister = async (formData: RegisterFormData): Promise<void> => {
    setApiError("");
    const response = await registerUser({
      username: formData.username,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
    if (!response.isSuccess) {
      setApiError(response.errorMessage);
      return;
    }
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Enter your credentials to create a new account.
        </p>
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit(submitRegister)}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-medium text-zinc-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              suppressHydrationWarning
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              {...register("username")}
            />
            {errors.username?.message ? (
              <span className="text-sm text-red-600">{errors.username.message}</span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              suppressHydrationWarning
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              {...register("password")}
            />
            {errors.password?.message ? (
              <span className="text-sm text-red-600">{errors.password.message}</span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-zinc-700"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              suppressHydrationWarning
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword?.message ? (
              <span className="text-sm text-red-600">
                {errors.confirmPassword.message}
              </span>
            ) : null}
          </div>
          {apiError ? <div className="text-sm text-red-600">{apiError}</div> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            suppressHydrationWarning
            className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
          <p className="text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-zinc-900 underline">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
