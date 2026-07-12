import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
export const dynamic = 'force-dynamic';
import React from 'react';
import { ChangePasswordClient } from './ChangePasswordClient';

export default function AccountSettingsPage() {
  return (
    <div className="p-6">
      <ScreenHeader />
      <p className="text-vin-text2 mb-8">
        Manage your personal account settings.
      </p>

      <ChangePasswordClient />
    </div>
  );
}

