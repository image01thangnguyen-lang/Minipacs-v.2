"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { useState } from "react";
import { LegacyMatrixTab } from "./components/LegacyMatrixTab";
import { ScopeMatrixTab } from "./components/ScopeMatrixTab";

export default function PermissionMatrixPage() {
  const [activeTab, setActiveTab] = useState<"SCOPE" | "LEGACY">("SCOPE");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-vin-background">
      <ScreenHeader />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex space-x-1 rounded-xl bg-gray-200 p-1 w-max">
            <button
              className={`rounded-lg px-6 py-2 text-sm font-medium leading-5 transition ${
                activeTab === "SCOPE"
                  ? "bg-white text-vin-accent shadow"
                  : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("SCOPE")}
            >
              Phạm vi tổ chức (Scope)
            </button>
            <button
              className={`rounded-lg px-6 py-2 text-sm font-medium leading-5 transition ${
                activeTab === "LEGACY"
                  ? "bg-white text-vin-accent shadow"
                  : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("LEGACY")}
            >
              Thiết bị (Legacy)
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === "SCOPE" ? <ScopeMatrixTab /> : <LegacyMatrixTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
