import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { Metadata } from "next";
import { getUserPermissionsAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { HisConsoleClient } from "./components/HisConsoleClient";
import { prisma } from "@/app/db";

export const metadata: Metadata = {
  title: "HIS Integration Console",
};

export default async function AdminHisPage() {
  const { permissions } = await getUserPermissionsAction();
  if (!permissions.includes("his.manage")) {
    redirect("/");
  }

  // Fetch initial data
  const config = await prisma.hisConnectionConfig.findFirst({
    orderBy: { createdAt: "desc" }
  }) || {
    mode: "disabled",
    baseUrl: "",
    authMode: "none",
  };

  const safeConfig = { ...config } as any;
  if (safeConfig.apiKeyEncrypted) safeConfig.apiKeyEncrypted = "********";
  if (safeConfig.bearerTokenEncrypted) safeConfig.bearerTokenEncrypted = "********";
  if (safeConfig.basicPasswordEncrypted) safeConfig.basicPasswordEncrypted = "********";
  if (safeConfig.hmacSecretEncrypted) safeConfig.hmacSecretEncrypted = "********";

  const logs = await prisma.hisApiCallLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Basic stats for overview
  const recentLogs = logs.map(l => ({
    id: l.id,
    createdAt: l.createdAt,
    direction: l.direction,
    path: l.path,
    success: l.success,
    accessionNumber: l.accessionNumber,
  }));

  const conflicts = await prisma.hisConflict.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });

  const mappings = await prisma.hisFieldMapping.findMany({
    where: { isActive: true },
  });

  return (
    <div className="flex h-full w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <div className="flex-1 overflow-auto bg-vin-shell p-6">
        <div className="mb-6">
          <ScreenHeader />
          <p className="text-vin-muted text-sm">
            Manage inbound and outbound API integrations with the Hospital Information System.
          </p>
        </div>
        <HisConsoleClient
          initialConfig={safeConfig}
          initialLogs={recentLogs}
          initialConflicts={conflicts}
          initialMappings={mappings}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
