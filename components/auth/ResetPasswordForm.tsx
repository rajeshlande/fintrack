"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { AuthFormSkeleton } from "@/components/ui/AuthFormSkeleton";
import { extensionSafeFormProps, extensionSafeInputProps } from "@/lib/form-props";

const initialState: AuthActionState = { error: null };

function ResetPasswordFormInner() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state?.success, state?.redirectTo]);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4" {...extensionSafeFormProps}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            className="input-glass"
            {...extensionSafeInputProps}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Re-enter password"
            className="input-glass"
            {...extensionSafeInputProps}
          />
        </div>

        {state?.error && <p className="alert-error">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Updating…" : "Update Password"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Link expired?{" "}
        <Link href="/forgot-password" className="link-accent">
          Request a new one
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <ClientOnly fallback={<AuthFormSkeleton />}>
      <ResetPasswordFormInner />
    </ClientOnly>
  );
}
