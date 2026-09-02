import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, reset } = await searchParams;
  const callbackError =
    error === "auth_callback_failed"
      ? "Sign in failed. Please try again."
      : null;
  const resetSuccess = reset === "success";

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to track your UPI spends and budgets"
    >
      {resetSuccess && (
        <p className="mb-4 alert-success">
          Password updated successfully. Sign in with your new password.
        </p>
      )}
      {callbackError && (
        <p className="mb-4 alert-error">{callbackError}</p>
      )}
      <LoginForm />
    </AuthLayout>
  );
}
