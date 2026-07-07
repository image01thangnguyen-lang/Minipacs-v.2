import { AppShell } from "@/app/components/shell/AppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell contentClassName="flex w-full h-full bg-vin-root font-sans text-vin-text" contentOverflow="auto">
      {children}
    </AppShell>
  );
}
