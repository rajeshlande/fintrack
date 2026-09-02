"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  updateProfileAction,
  type SettingsActionState,
} from "@/lib/settings/actions";

const initialState: SettingsActionState = { error: null };

type ProfileFormProps = {
  fullName: string;
  email: string;
  phone: string;
  currency: string;
};

export function ProfileForm({
  fullName,
  email,
  phone,
  currency,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          defaultValue={fullName}
          className="input-glass"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="input-glass opacity-60 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
          Mobile
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 min-h-[3rem] bg-black/[0.03] border border-black/5 border-r-0 rounded-l-[0.875rem] text-sm text-gray-500 font-medium">
            +91
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            defaultValue={phone}
            placeholder="9876543210"
            maxLength={10}
            pattern="[0-9]{10}"
            className="input-glass rounded-l-none flex-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1.5">
          Currency
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue={currency}
          className="input-glass appearance-none cursor-pointer"
        >
          <option value="INR">INR — Indian Rupee (₹)</option>
        </select>
      </div>

      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && state.message && (
        <p className="alert-success">{state.message}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState
  );

  return (
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
      {state?.success && state.message && (
        <p className="alert-success">{state.message}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="w-full sm:w-auto px-6 min-h-[3rem] rounded-[0.875rem] text-sm font-semibold text-red-600 bg-red-50/80 border border-red-100 hover:bg-red-50 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
