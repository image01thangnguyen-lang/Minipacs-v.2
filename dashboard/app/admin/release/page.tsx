import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { ArrowRight, CheckCircle, ClipboardCheck, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Release Center | MiniPACS", description: "Release, UAT, final acceptance and operations handoff." };

export default async function ReleaseCenterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "release.read", session.user.permissions)) redirect("/");
  const [activeReleases, releasedReleases, openUatRuns, pendingHandoffs, latestRelease] = await Promise.all([
    prisma.releaseCandidate.count({ where: { status: { in: ["DRAFT", "TESTING", "BLOCKED", "READY_FOR_SIGNOFF", "APPROVED"] } } }),
    prisma.releaseCandidate.count({ where: { status: "RELEASED" } }),
    prisma.uatRun.count({ where: { status: "IN_PROGRESS" } }),
    prisma.releaseHandoffRecord.count({ where: { status: { in: ["DRAFT", "READY"] } } }),
    prisma.releaseCandidate.findFirst({ orderBy: { createdAt: "desc" }, include: { handoff: { select: { status: true } }, signOffs: { select: { status: true } } } }),
  ]);

  const cards = [
    { label: "Active releases", value: activeReleases, href: "/admin/release/go-live", icon: FlaskConical, detail: "Testing, blocked hoặc đang sign-off" },
    { label: "UAT đang chạy", value: openUatRuns, href: "/admin/release/uat", icon: CheckCircle, detail: "Các run cần hoàn tất" },
    { label: "Handoff chờ xử lý", value: pendingHandoffs, href: latestRelease ? `/admin/release/go-live/${latestRelease.id}/handoff` : "/admin/release/go-live", icon: ClipboardCheck, detail: "Hồ sơ DRAFT hoặc READY" },
  ];
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <header className="border-b border-slate-700 pb-5"><h1 className="text-2xl font-bold">Release Center</h1><p className="mt-1 text-sm text-slate-400">UAT, readiness, sign-off, release notes và operations handoff trên một luồng.</p></header>
      <section className="grid gap-4 md:grid-cols-3">{cards.map(({ label, value, href, icon: Icon, detail }) => <Link key={label} href={href} className="rounded-md border border-slate-700 bg-slate-900/40 p-5 hover:border-cyan-500"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-cyan-300" /><span className="text-2xl font-bold">{value}</span></div><h2 className="mt-3 font-semibold">{label}</h2><p className="mt-1 text-sm text-slate-400">{detail}</p></Link>)}</section>
      {latestRelease && <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-400">Release gần nhất</p><h2 className="mt-1 text-xl font-bold">{latestRelease.version}: {latestRelease.title || "Untitled"}</h2><p className="mt-1 text-sm">{latestRelease.status} · {latestRelease.targetEnvironment} · {latestRelease.signOffs.filter(item => item.status === "APPROVED").length}/4 sign-off · Handoff {latestRelease.handoff?.status || "MISSING"}</p></div><Link href={`/admin/release/go-live/${latestRelease.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400">Mở Command Center <ArrowRight className="h-4 w-4" /></Link></div></section>}
      <p className="text-sm text-slate-500">Tổng số release đã phát hành: {releasedReleases}</p>
    </main>
  );
}
