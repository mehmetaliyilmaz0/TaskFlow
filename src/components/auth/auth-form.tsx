"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type AuthFormState = {
  error: string | null;
  success: string | null;
};

type AuthFormProps = {
  mode: "login" | "register";
  action: (
    state: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
};

const initialState: AuthFormState = {
  error: null,
  success: null,
};

function SubmitButton({ mode }: { mode: AuthFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending
        ? mode === "login"
          ? "Signing in..."
          : "Creating account..."
        : mode === "login"
          ? "Sign in"
          : "Create account"}
    </button>
  );
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        TaskFlow Auth
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {isLogin ? "Sign in to TaskFlow" : "Create your TaskFlow account"}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {isLogin
          ? "Use your email and password to access the protected app routes."
          : "Create an account first. If email confirmation is enabled in Supabase, you may need to confirm before signing in."}
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={6}
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            placeholder="At least 6 characters"
          />
        </div>

        {state.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {state.success}
          </p>
        ) : null}

        <SubmitButton mode={mode} />
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {isLogin ? "Need an account?" : "Already registered?"}{" "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4"
        >
          {isLogin ? "Create one" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
