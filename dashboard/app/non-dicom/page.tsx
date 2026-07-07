"use client";

import { useEffect, useState } from "react";
import { getNonDicomExams } from "./actions";
import { Loader2, RefreshCcw, Camera } from "lucide-react";
import Link from "next/link";
import { CustomSelect } from "@/app/components/CustomSelect";

function formatDistanceToNow(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NonDicomQueuePage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await getNonDicomExams({ status: statusFilter, search });
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex">
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-none p-4 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Non-DICOM Queue</h1>
            <p className="text-sm text-slate-400 mt-1">Quản lý các ca siêu âm, nội soi, chụp ảnh ngoài DICOM</p>
          </div>
          <div className="flex items-center gap-3">
            <CustomSelect
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "REQUESTED", label: "Chờ thực hiện (REQUESTED)" },
                { value: "CAPTURING", label: "Đang chụp (CAPTURING)" },
                { value: "COMPLETED", label: "Hoàn tất (COMPLETED)" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Lọc trạng thái"
              className="w-48"
            />
            <input 
              type="text" 
              placeholder="Tìm tên, mã BN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadExams()}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors w-48"
            />
            <button
              onClick={loadExams}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors border border-slate-700 flex items-center justify-center disabled:opacity-50"
              disabled={loading}
              title="Làm mới"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900/80 text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Case Code / Bệnh nhân</th>
                    <th className="px-4 py-3 font-medium">Giới tính / NS</th>
                    <th className="px-4 py-3 font-medium">Chỉ định</th>
                    <th className="px-4 py-3 font-medium">Ngày tạo</th>
                    <th className="px-4 py-3 font-medium">Media</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-800/80 transition-colors group">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          exam.status === 'REQUESTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          exam.status === 'CAPTURING' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          exam.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {exam.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{exam.patientName || "Không tên"}</div>
                        <div className="text-xs text-slate-400">{exam.patientId} • {exam.caseCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-300">{exam.patientSex === 'M' ? 'Nam' : exam.patientSex === 'F' ? 'Nữ' : 'Khác'}</div>
                        <div className="text-xs text-slate-400">{exam.patientBirthDate ? new Date(exam.patientBirthDate).getFullYear() : '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {exam.indication || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(exam.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {exam._count?.media || 0} files
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          href={`/non-dicom/${exam.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-300 rounded-md transition-colors text-xs font-medium"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Capture
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Camera className="w-10 h-10 text-slate-600 mb-3" />
                          <p>Không có ca Non-DICOM nào</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {loading && exams.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                          <p>Đang tải danh sách...</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
