export const dynamic = 'force-dynamic';
import React from 'react';
import { ChangePasswordClient } from './ChangePasswordClient';

export default function AccountSettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <p className="text-gray-600 mb-8">
        Manage your personal account settings.
      </p>

      <ChangePasswordClient />
    </div>
  );
}

