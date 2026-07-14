import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { ChangePasswordClient } from './ChangePasswordClient';
import { ChangePasswordAntd } from './ChangePasswordAntd';
export const dynamic = 'force-dynamic';

import { auth } from "@/auth";

export default async function AccountSettingsPage() {
  const session = await auth();

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: session?.user?.id || "" }),
      reauthorizeResource: async () => ({ facilityId: (session?.user as any)?.activeFacilityId || "global" }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };

    const decision = await evaluateScopedCapability({
      capability: "antd-admin-settings",
      resourceId: (session?.user as any)?.activeFacilityId || "global"
    }, deps);

    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  return (
    <div style={useAntd ? { padding: '24px' } : undefined} className={useAntd ? "" : "p-6"}>
      {!useAntd && (
        <>
          <ScreenHeader />
          <p className="text-vin-text2 mb-8">
            Manage your personal account settings.
          </p>
        </>
      )}

      {useAntd && (
         <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Tài khoản cá nhân
            </h2>
            <div style={{ color: 'gray', fontSize: '12px' }}>
              Quản lý cài đặt tài khoản cá nhân của bạn.
            </div>
         </div>
      )}

      {useAntd ? <ChangePasswordAntd /> : <ChangePasswordClient />}
    </div>
  );
}
