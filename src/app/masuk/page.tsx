import { Suspense } from "react";
import { ToastProvider } from "@/ui/Toast";
import { AuthScreen } from "@/features/auth/AuthScreen";

export default function MasukPage() {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-bg">
            <div className="border-primary/30 h-10 w-10 animate-spin rounded-full border-4 border-t-primary" />
          </div>
        }
      >
        <AuthScreen />
      </Suspense>
    </ToastProvider>
  );
}
