import { AppShell } from "@/app/components/shell/AppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell contentClassName="flex w-full h-full overflow-hidden bg-vin-root font-sans text-vin-text" contentOverflow="hidden">
      {children}
    </AppShell>
  );
}
