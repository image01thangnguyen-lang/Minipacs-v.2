"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWorklistAction, worklistSchema } from "../actions";
import { z } from "zod";
import { useState } from "react";
import { Loader2, PlusCircle, CheckCircle2, AlertCircle } from "lucide-react";

type FormValues = z.infer<typeof worklistSchema>;

export default function NewWorklistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(worklistSchema),
    defaultValues: {
      patientName: "",
      patientId: "",
      dob: "",
      gender: "O",
      referringPhysician: "",
      modality: "CR",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await createWorklistAction(data);
      if (res.success) {
        setSuccessMsg(`Tạo Order thành công! Accession: ${res.accessionNumber}`);
        reset();
      } else {
        setErrorMsg(res.error || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-8 sm:p-12 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <PlusCircle className="text-blue-500 h-8 w-8" />
            Tạo ca chụp mới
          </h1>
          <p className="text-slate-400 mt-2">
            Tạo Modalilty Worklist Order (MWL). Thông tin sẽ được gửi tới máy chụp X-quang/Siêu âm.
          </p>
        </div>

        <div className="bg-[#0d0d0f] border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8">
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Patient Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tên Bệnh Nhân *</label>
                <input
                  {...register("patientName")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="VD: NGUYEN VAN A"
                />
                {errors.patientName && <p className="text-red-400 text-xs mt-1">{errors.patientName.message}</p>}
              </div>

              {/* Patient ID */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Mã Bệnh Nhân (PID) *</label>
                <input
                  {...register("patientId")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  placeholder="VD: PID-12345"
                />
                {errors.patientId && <p className="text-red-400 text-xs mt-1">{errors.patientId.message}</p>}
              </div>

              {/* DOB */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ngày Sinh</label>
                <input
                  type="date"
                  {...register("dob")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Giới tính</label>
                <select
                  {...register("gender")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                  <option value="O">Khác</option>
                </select>
              </div>

              {/* Referring Physician */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Bác sĩ chỉ định</label>
                <input
                  {...register("referringPhysician")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="VD: bs_tuan"
                />
              </div>

              {/* Modality */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Loại máy chụp (Modality) *</label>
                <select
                  {...register("modality")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                >
                  <option value="CR">CR (X-quang số hóa)</option>
                  <option value="DX">DX (X-quang kỹ thuật số)</option>
                  <option value="US">US (Siêu âm)</option>
                  <option value="CT">CT (Cắt lớp vi tính)</option>
                  <option value="MR">MR (Cộng hưởng từ)</option>
                </select>
                {errors.modality && <p className="text-red-400 text-xs mt-1">{errors.modality.message}</p>}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-5 w-5" />
                    Tạo Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
