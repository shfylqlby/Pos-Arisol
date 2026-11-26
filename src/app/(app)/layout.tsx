import { Providers } from "@/providers/Providers";
import { AppShell } from "@/shell/AppShell";
import { AuthGate } from "@/features/auth/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </Providers>
  );
}
