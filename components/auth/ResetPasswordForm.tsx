"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { error: null };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
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
