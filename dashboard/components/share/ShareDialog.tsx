'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Link as LinkIcon,
  Copy,
  Trash2,
  Loader2,
  QrCode,
  ShieldAlert
} from 'lucide-react';
import { createShareLinkAction, getShareLinksAction, revokeShareLinkAction } from '@/app/share/actions';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scope: 'STUDY' | 'REPORT' | 'NON_DICOM_EXAM';
  resourceId: string;
}

export function ShareDialog({ isOpen, onClose, scope, resourceId }: ShareDialogProps) {
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [hidePatientInfo, setHidePatientInfo] = useState(true);

  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    const res = await getShareLinksAction(scope, resourceId);
    if (res.success && res.links) {
      setLinks(res.links);
    }
    setIsLoading(false);
  }, [resourceId, scope]);

  useEffect(() => {
    if (isOpen) {
      loadLinks();
    }
  }, [isOpen, loadLinks]);

  if (!isOpen) return null;

  if (scope === 'NON_DICOM_EXAM') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-[500px] overflow-hidden rounded-2xl border border-vin-border bg-vin-panel shadow-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Chia sẻ ca ngoài DICOM</h2>
            <button onClick={onClose} className="text-vin-muted hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <p className="text-vin-muted mb-4 text-sm">Tính năng tạo public link cho luồng dữ liệu Non-DICOM đang được hoàn thiện. Vui lòng quay lại sau.</p>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded bg-vin-shell border border-vin-border px-4 py-2 text-white hover:bg-white/10">Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  async function handleCreate() {
    setIsCreating(true);
    const res = await createShareLinkAction({
      scope,
      studyInstanceUid: scope === 'STUDY' ? resourceId : undefined,
      reportId: scope === 'REPORT' ? resourceId : undefined,
      nonDicomExamId: scope === 'NON_DICOM_EXAM' ? resourceId : undefined,
      password: password || undefined,
      expiresInDays,
      hidePatientInfo,
      allowDownload: false,
      allowImages: true,
      allowReport: true,
      allowMeasurements: true,
    });

    if (res.success) {
      setPassword('');
      await loadLinks();

      // Auto copy the generated token link
      if (res.token) {
        const link = `${window.location.origin}/share/${res.token}`;
        navigator.clipboard.writeText(link);
        alert('Đã tạo và sao chép link chia sẻ: ' + link);
      }
    } else {
      alert(res.error || 'Lỗi tạo link');
    }
    setIsCreating(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm('Bạn có chắc muốn thu hồi link này?')) return;
    const res = await revokeShareLinkAction(id, 'User revoked');
    if (res.success) {
      await loadLinks();
    } else {
      alert(res.error || 'Lỗi thu hồi');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-vin-border bg-vin-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-vin-border px-5 py-4">
          <h2 className="text-lg font-bold text-white">Chia sẻ kết quả & Hình ảnh</h2>
          <button onClick={onClose} className="rounded-md p-1 text-vin-muted hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Create Section */}
          <div className="mb-6 rounded-lg border border-vin-border bg-vin-shell p-4">
            <h3 className="mb-3 text-sm font-semibold text-vin-text2">Tạo link chia sẻ mới</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-vin-muted">Thời hạn (ngày)</label>
                <select
                  value={expiresInDays}
                  onChange={e => setExpiresInDays(Number(e.target.value))}
                  className="w-full rounded border border-vin-border bg-vin-panel px-3 py-1.5 text-sm text-white focus:border-vin-accent outline-none"
                >
                  <option value={1}>1 ngày</option>
                  <option value={3}>3 ngày</option>
                  <option value={7}>7 ngày</option>
                  <option value={30}>30 ngày</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-vin-muted">Mật khẩu bảo vệ (tùy chọn)</label>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Để trống nếu không cần"
                  className="w-full rounded border border-vin-border bg-vin-panel px-3 py-1.5 text-sm text-white focus:border-vin-accent outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="hidePatientInfo"
                checked={hidePatientInfo}
                onChange={e => setHidePatientInfo(e.target.checked)}
                className="rounded border-vin-border bg-vin-panel text-vin-accent"
              />
              <label htmlFor="hidePatientInfo" className="text-sm text-vin-text2">Ẩn thông tin bệnh nhân (Tên, PID, Ngày sinh)</label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex items-center gap-2 rounded-lg bg-vin-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-vin-accentHover disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                Tạo link chia sẻ
              </button>
            </div>
          </div>

          {/* Existing Links */}
          <h3 className="mb-3 text-sm font-semibold text-vin-text2">Các link đã tạo</h3>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-vin-border">
            {isLoading ? (
              <div className="flex h-20 items-center justify-center text-vin-muted">
                <Loader2 className="h-5 w-5 animate-spin text-vin-accent" />
              </div>
            ) : links.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-vin-muted">
                Chưa có link chia sẻ nào.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-vin-shell text-sm text-vin-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Trạng thái</th>
                    <th className="px-4 py-2 font-medium">Hết hạn</th>
                    <th className="px-4 py-2 font-medium">Lượt xem</th>
                    <th className="px-4 py-2 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vin-border">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-white/5">
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded px-2 py-0.5 text-sm font-bold ${
                          link.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                          link.status === 'REVOKED' ? 'bg-red-500/20 text-red-400' :
                          link.status === 'EXPIRED' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {link.status}
                        </span>
                        {link.passwordRequired && (
                          <span title="Có mật khẩu">
                            <ShieldAlert className="ml-2 inline h-3 w-3 text-amber-400" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-vin-text2">
                        {new Date(link.expiresAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-2 text-sm text-vin-text2">
                        {link.accessCount}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {link.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevoke(link.id)}
                            className="text-vin-muted hover:text-red-400"
                            title="Thu hồi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
