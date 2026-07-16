"use client";
import React from "react";
import { Tree } from "antd";
import type { DataNode } from "antd/es/tree";
import { DownOutlined } from "@ant-design/icons";

export function FacilityScopeTreeAntd({ facilities, value, onChange }: { facilities: { id: string; name: string; count: number }[]; value: string; onChange: (id: string) => void }) {
  const totalCount = facilities.reduce((n, f) => n + f.count, 0);

  const treeData: DataNode[] = [
    {
      title: (
        <div className="flex justify-between items-center w-full pr-2">
          <span>Tất cả cơ sở được phép</span>
          <span className="font-mono text-sm ml-2 text-gray-400">{totalCount}</span>
        </div>
      ),
      key: "ALL",
      children: facilities.map((f) => ({
        title: (
          <div className="flex justify-between items-center w-full pr-2">
            <span className="truncate">{f.name}</span>
            <span className="font-mono text-sm ml-2 text-gray-400">{f.count}</span>
          </div>
        ),
        key: f.id,
      })),
    },
  ];

  return (
    <section className="flex-1 overflow-auto p-3" aria-labelledby="facility-scope-heading">
      <h3 id="facility-scope-heading" className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-400">Phạm vi cơ sở</h3>
      
      {facilities.length > 0 ? (
        <Tree
          treeData={treeData}
          selectedKeys={[value]}
          onSelect={(selectedKeys) => {
            if (selectedKeys.length > 0) {
              onChange(selectedKeys[0] as string);
            }
          }}
          defaultExpandAll
          switcherIcon={<DownOutlined />}
          className="text-sm bg-transparent"
          blockNode
        />
      ) : (
        <p className="px-2 py-3 text-sm italic text-gray-500">Không có dữ liệu cơ sở trong danh sách hiện tại.</p>
      )}
    </section>
  );
}
