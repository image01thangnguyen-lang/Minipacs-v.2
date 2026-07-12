"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { useState } from "react";
import { LegacyMatrixTab } from "./components/LegacyMatrixTab";
import { ScopeMatrixTab } from "./components/ScopeMatrixTab";

export default function PermissionMatrixPage() {
  const [activeTab, setActiveTab] = useState<"SCOPE" | "LEGACY">("SCOPE");

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-vin-root text-vin-text">
      <ScreenHeader />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex w-max space-x-1 rounded-lg border border-vin-border bg-vin-shell p-1" role="tablist" aria-label="Loại ma trận phân quyền">
            <button
              className={`rounded-lg px-6 py-2 text-sm font-medium leading-5 transition ${
                activeTab === "SCOPE"
                  ? "bg-vin-tableSelected text-white shadow"
                  : "text-vin-muted hover:bg-vin-panel hover:text-vin-text"
              }`}
              onClick={() => setActiveTab("SCOPE")}
              role="tab" aria-selected={activeTab === "SCOPE"}
            >
              Phạm vi tổ chức (Scope)
            </button>
            <button
              className={`rounded-lg px-6 py-2 text-sm font-medium leading-5 transition ${
                activeTab === "LEGACY"
                  ? "bg-vin-tableSelected text-white shadow"
                  : "text-vin-muted hover:bg-vin-panel hover:text-vin-text"
              }`}
              onClick={() => setActiveTab("LEGACY")}
              role="tab" aria-selected={activeTab === "LEGACY"}
            >
              Thiết bị (Legacy)
            </button>
          </div>

          <div className="rounded-lg border border-vin-border bg-vin-panel p-4 shadow-sm sm:p-6">
            {activeTab === "SCOPE" ? <ScopeMatrixTab /> : <LegacyMatrixTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
