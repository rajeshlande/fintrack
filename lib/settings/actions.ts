"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  error: string | null;
  success?: boolean;
  message?: string;
};

export async function updateProfileAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const phoneRaw = (formData.get("phone") as string)?.replace(/\D/g, "") ?? "";
  const currency = (formData.get("currency") as string) || "INR";

  if (!fullName) {
    return { error: "Full name is required." };
  }

  if (phoneRaw && phoneRaw.length !== 10) {
    return { error: "Please enter a valid 10-digit Indian mobile number." };
  }

  const phone = phoneRaw ? `+91${phoneRaw}` : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update settings." };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone },
  });

  if (authError) {
    return { error: authError.message };
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    phone,
    currency,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");

  return {
    error: null,
    success: true,
    message: "Profile updated successfully.",
  };
}

export async function changePasswordAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Please enter and confirm your new password." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to change your password." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return {
    error: null,
    success: true,
    message: "Password updated successfully.",
  };
}
