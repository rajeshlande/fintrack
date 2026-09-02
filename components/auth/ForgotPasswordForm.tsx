"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { forgotPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { AuthFormSkeleton } from "@/components/ui/AuthFormSkeleton";
import { extensionSafeFormProps, extensionSafeInputProps } from "@/lib/form-props";

const initialState: AuthActionState = { error: null };

function ForgotPasswordFormInner() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state?.success) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-black/[0.04] flex items-center justify-center text-2xl">
          ✉️
        </div>
        <h2 className="text-lg font-bold text-[#1a1d23]">Check your email</h2>
        <p className="text-sm text-gray-500">
          If an account exists for that email, we sent a password reset link.
          Open it on this device to set a new password.
        </p>
        <Link href="/login" className="inline-block link-accent text-sm py-3">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4" {...extensionSafeFormProps}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="you@example.com"
            className="input-glass"
            {...extensionSafeInputProps}
          />
        </div>

        {state?.error && <p className="alert-error">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Sending link…" : "Send Reset Link"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link href="/login" className="link-accent">Sign in</Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  return (
    <ClientOnly fallback={<AuthFormSkeleton />}>
      <ForgotPasswordFormInner />
    </ClientOnly>
  );
}
