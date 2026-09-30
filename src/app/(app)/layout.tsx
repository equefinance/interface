import { AppShell } from '@/components/app-shell';
import { AppProviders } from './providers';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-svh bg-eque-bg text-eque-text">
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </div>
  );
}
