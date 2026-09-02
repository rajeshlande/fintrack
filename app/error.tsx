"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="app-bg min-h-dvh flex flex-col items-center justify-center p-6 safe-area-padding">
      <div className="glass-panel-strong w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-[#1a1d23]">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">
          We couldn&apos;t load this page. Your data is safe — please try again.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="mt-4 text-xs text-left text-red-600 bg-red-50 rounded-lg p-3 break-words">
            {error.message}
          </p>
        )}
        <button type="button" onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
