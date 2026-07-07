"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";


import { useState } from "react";
import { TreeEditor } from "./components/TreeEditor";
import { MachineMapping } from "./components/MachineMapping";
import { DataQualityPanel } from "./components/DataQualityPanel";

export default function FacilitiesPage() {
  const [activeTab, setActiveTab] = useState<"tree" | "machines" | "quality">("tree");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScreenHeader />
      </div>

      <div className="border-b border-vin-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("tree")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "tree"
                ? "border-vin-accent text-vin-accent"
                : "border-transparent text-vin-muted hover:text-white hover:border-vin-border"
            }`}
          >
            Cây tổ chức
          </button>
          <button
            onClick={() => setActiveTab("machines")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "machines"
                ? "border-vin-accent text-vin-accent"
                : "border-transparent text-vin-muted hover:text-white hover:border-vin-border"
            }`}
          >
            Máy chụp
          </button>
          <button
            onClick={() => setActiveTab("quality")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "quality"
                ? "border-vin-accent text-vin-accent"
                : "border-transparent text-vin-muted hover:text-white hover:border-vin-border"
            }`}
          >
            Chất lượng dữ liệu
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "tree" && <TreeEditor />}
        {activeTab === "machines" && <MachineMapping />}
        {activeTab === "quality" && <DataQualityPanel />}
      </div>
    </div>
  );
}
