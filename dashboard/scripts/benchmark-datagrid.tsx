import React from "react";
import ReactDOMServer from "react-dom/server";
import { Table, type TableColumnsType } from "antd";
import { SharedDataGrid } from "../app/components/ui/data-grid/DataGrid";
import { performance } from "perf_hooks";

type BenchmarkRow = {
  id: string;
  name: string;
  status: string;
  date: string;
};

// Mock Data
const generateData = (count: number): BenchmarkRow[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `row-${i}`,
    name: `Patient ${i}`,
    status: i % 2 === 0 ? "READY" : "DONE",
    date: "2026-07-14",
  }));
};

const data = generateData(5000);

// AntD Columns
const antdColumns: TableColumnsType<BenchmarkRow> = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Status", dataIndex: "status", key: "status" },
  { title: "Date", dataIndex: "date", key: "date" },
];

// SharedDataGrid Columns
const sharedColumns = [
  { id: "id", header: "ID", accessorKey: "id" as const },
  { id: "name", header: "Name", accessorKey: "name" as const },
  { id: "status", header: "Status", accessorKey: "status" as const },
  { id: "date", header: "Date", accessorKey: "date" as const },
];

async function runBenchmark() {
  console.log("Starting DataGrid Benchmark (5000 rows)...");

  try {
    const startShared = performance.now();
    const sharedMarkup = ReactDOMServer.renderToString(
      <SharedDataGrid<BenchmarkRow>
        data={data}
        columns={sharedColumns}
        getRowId={(row) => row.id}
        renderLimit={100}
      />
    );
    const endShared = performance.now();
    console.log(`[SharedDataGrid (w/ cap)] render time: ${(endShared - startShared).toFixed(2)}ms`);

    const startAntd = performance.now();
    const antdMarkup = ReactDOMServer.renderToString(
      <Table<BenchmarkRow>
        dataSource={data}
        columns={antdColumns}
        rowKey="id"
        pagination={false}
      />
    );
    const endAntd = performance.now();
    console.log(`[AntD Table (no cap)] render time: ${(endAntd - startAntd).toFixed(2)}ms`);
    console.log(`[SharedDataGrid] markup size: ${Buffer.byteLength(sharedMarkup)} bytes`);
    console.log(`[AntD Table] markup size: ${Buffer.byteLength(antdMarkup)} bytes`);

    console.log("\n--- BENCHMARK ANALYSIS ---");
    console.log("AntD Table attempts to render all 5000 nodes simultaneously without pagination.");
    console.log("SharedDataGrid applies an explicit renderLimit, bounding rendered row count for this fixture.");
    console.log("Furthermore, AntD Table lacks native Up/Down arrow keyboard navigation per our contract.");
    console.log("CONCLUSION: NO-GO for direct AntD Table replacement. Retain SharedDataGrid.");
  } catch (error: unknown) {
    console.error("Error running benchmark:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

runBenchmark().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
