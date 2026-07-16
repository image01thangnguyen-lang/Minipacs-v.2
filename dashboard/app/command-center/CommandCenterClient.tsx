"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";


import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useCommandCenterPolling } from "./useCommandCenterPolling";
import {
  fetchCommandCenterSummary,
  fetchLiveQueue,
  fetchDoctorMachineBacklog,
  fetchActiveAlerts,
  fetchSlaBreaches,
  fetchStuckWorkflow
} from "./actions";
import {
  CommandCenterQueueGrid,
  CommandCenterSlaGrid,
  CommandCenterStuckGrid,
  CommandCenterAlertsGrid
} from "./CommandCenterGrids";
import { FormInput, FormLabel, FormSelect, KpiCard, PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";

export function CommandCenterClient() {
  const [filters, setFilters] = useState<any>({});
  const [filterDraft, setFilterDraft] = useState<any>({});
  const [activeTab, setActiveTab] = useState("queue");

  const handleApplyFilters = () => setFilters(filterDraft);

  const [queuePage, setQueuePage] = useState(1);
  const [slaPage, setSlaPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const [stuckPage, setStuckPage] = useState(1);
  const [slaPrimed, setSlaPrimed] = useState(false);

  // Reset pagination when filters change
  useEffect(() => {
    setQueuePage(1);
    setSlaPage(1);
    setAlertsPage(1);
    setStuckPage(1);
    setSlaPrimed(false);
  }, [filters]);

  const enableSharedUI = true;

  const fetchSummary = useCallback(() => fetchCommandCenterSummary(filters), [filters]);
  const fetchQueue = useCallback(() => fetchLiveQueue(filters, { page: queuePage, pageSize: 50 }), [filters, queuePage]);
  const fetchAlerts = useCallback(() => fetchActiveAlerts(filters, { page: alertsPage, pageSize: 50 }), [filters, alertsPage]);
  const fetchBreaches = useCallback(() => fetchSlaBreaches(filters, { page: slaPage, pageSize: 50 }), [filters, slaPage]);
  const fetchBacklog = useCallback(() => fetchDoctorMachineBacklog(filters), [filters]);
  const fetchStuck = useCallback(() => fetchStuckWorkflow(filters, { page: stuckPage, pageSize: 50 }), [filters, stuckPage]);
  const handleSlaSuccess = useCallback(() => setSlaPrimed(true), []);

  const { data: summary, isLoading: isLoadingSummary } = useCommandCenterPolling({
    fetchFn: fetchSummary,
    intervalMs: 60000,
  });

  const { data: queue, isLoading: isLoadingQueue } = useCommandCenterPolling({
    fetchFn: fetchQueue,
    enabled: activeTab === "queue"
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useCommandCenterPolling({
    fetchFn: fetchAlerts,
    enabled: activeTab === "alerts"
  });

  const { data: breaches, isLoading: isLoadingBreaches } = useCommandCenterPolling({
    fetchFn: fetchBreaches,
    enabled: activeTab === "sla" || !slaPrimed,
    intervalMs: 60000,
    onSuccess: handleSlaSuccess,
  });

  const { data: backlog, isLoading: isLoadingBacklog } = useCommandCenterPolling({
    fetchFn: fetchBacklog,
    enabled: activeTab === "backlog"
  });

  const { data: stuck, isLoading: isLoadingStuck } = useCommandCenterPolling({
    fetchFn: fetchStuck,
    enabled: activeTab === "stuck"
  });

  const renderPagination = (page: number, setPage: (p: number) => void, total: number) => {
    const totalPages = Math.ceil((total || 0) / 50);
    if (totalPages <= 1) return null;
    return (
      <div className="mt-4 flex items-center justify-between text-sm text-vin-muted">
        <div>Trang {page} / {totalPages} (Tổng: {total})</div>
        <div className="space-x-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded border border-vin-border bg-vin-shell px-3 py-1 text-vin-text2 hover:border-vin-accent disabled:opacity-50"
          >
            Trước
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded border border-vin-border bg-vin-shell px-3 py-1 text-vin-text2 hover:border-vin-accent disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

  return (
    <PageCanvas className="min-h-0 overflow-y-auto p-4 sm:p-6">
      <ScreenHeader />

      {/* Filters */}
      <PagePanel className="mb-6 flex flex-wrap items-end gap-4 p-4">
        <div>
          <FormLabel>Từ ngày</FormLabel>
          <FormInput type="date"
            onChange={(e) => setFilterDraft({...filterDraft, dateFrom: e.target.value})}
            value={filterDraft.dateFrom || ''} />
        </div>
        <div>
          <FormLabel>Đến ngày</FormLabel>
          <FormInput type="date"
            onChange={(e) => setFilterDraft({...filterDraft, dateTo: e.target.value})}
            value={filterDraft.dateTo || ''} />
        </div>
        <div>
          <FormLabel>Modality</FormLabel>
          <FormSelect className="w-32"
            onChange={(e) => setFilterDraft({...filterDraft, modality: e.target.value || undefined})}
            value={filterDraft.modality || ''}>
            <option value="">Tất cả</option>
            <option value="CR">CR</option>
            <option value="DX">DX</option>
            <option value="CT">CT</option>
            <option value="MR">MR</option>
            <option value="US">US</option>
          </FormSelect>
        </div>
        <div>
          <FormLabel>Độ ưu tiên</FormLabel>
          <FormSelect className="w-32"
            onChange={(e) => setFilterDraft({...filterDraft, priority: e.target.value || undefined})}
            value={filterDraft.priority || ''}>
            <option value="">Tất cả</option>
            <option value="STAT">STAT</option>
            <option value="URGENT">URGENT</option>
            <option value="ROUTINE">ROUTINE</option>
          </FormSelect>
        </div>
        <button
          onClick={handleApplyFilters}
          className="h-9 rounded bg-vin-accent px-4 text-sm font-semibold text-white transition hover:bg-vin-accentHover"
        >
          Áp dụng
        </button>
      </PagePanel>

      {/* Summary Widgets */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Chờ chụp" value={summary?.WAITING_SCAN || 0} />
        <KpiCard label="Chờ đọc" value={summary?.WAITING_READ || 0} />
        <KpiCard label="Quá hạn SLA" value={slaPrimed && breaches ? breaches.total : "--"} tone="danger" />
        <KpiCard label="Lỗi HIS" value={summary?.HIS_FAILED || 0} tone="warning" />
        <KpiCard label="Alerts Open" value={summary?.ACTIVE_ALERTS || 0} tone="warning" />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex overflow-x-auto border-b border-vin-border" role="tablist" aria-label="Command center views">
        {['queue', 'sla', 'stuck', 'backlog', 'alerts'].map(tab => (
          <button
            key={tab}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider ${activeTab === tab ? 'border-vin-accent text-vin-accent' : 'border-transparent text-vin-muted hover:text-vin-text'}`}
            onClick={() => setActiveTab(tab)}
            role="tab" aria-selected={activeTab === tab}
          >
            {tab === 'queue' ? 'Live Queue' :
             tab === 'sla' ? 'SLA Breaches' :
             tab === 'stuck' ? 'Stuck Workflow' :
             tab === 'backlog' ? 'Workload' : 'Active Alerts'}
          </button>
        ))}
      </div>

      {/* Content */}
      <PagePanel className="min-h-[400px] overflow-hidden p-4">
        {activeTab === 'queue' && (
          <div>
            {enableSharedUI ? (
              <>
                <CommandCenterQueueGrid rows={queue?.data || []} isLoading={isLoadingQueue} />
                {renderPagination(queuePage, setQueuePage, queue?.total || 0)}
              </>
            ) : isLoadingQueue ? (
              <div className="text-center py-10">Đang tải...</div>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-vin-panel2 text-vin-text2">
                      <th className="py-2 px-2">Mã ca</th>
                      <th className="px-2">Nguồn</th>
                      <th className="px-2">Bệnh nhân</th>
                      <th className="px-2">Ưu tiên</th>
                      <th className="px-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue?.data?.map((study: any) => (
                      <tr key={study.id} className="border-b hover:bg-vin-panel2">
                        <td className="py-2 px-2">
                          {study.source === 'HIS' ? (
                            <Link href={`/worklist?orderId=${study.orderId || study.id}`} className="text-vin-accent hover:underline">
                              {study.accessionNumber}
                            </Link>
                          ) : study.uid ? (
                            <Link href={`/report/${study.uid}`} className="text-vin-accent hover:underline">
                              {study.accessionNumber}
                            </Link>
                          ) : (
                            study.accessionNumber
                          )}
                        </td>
                        <td className="px-2">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${study.source === 'HIS' ? 'bg-purple-100 text-purple-800' : 'bg-vin-accent/15 text-vin-accent'}`}>
                            {study.source}
                          </span>
                        </td>
                        <td className="px-2 font-medium">{study.patientName}</td>
                        <td className="px-2">{study.priority}</td>
                        <td className="px-2">{study.status}</td>
                      </tr>
                    ))}
                    {(!queue?.data || queue.data.length === 0) && (
                      <tr><td colSpan={5} className="py-8 text-center text-vin-muted">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
                {renderPagination(queuePage, setQueuePage, queue?.total || 0)}
              </>
            )}
          </div>
        )}

        {activeTab === 'sla' && (
          <div>
            {enableSharedUI ? (
              <>
                <CommandCenterSlaGrid rows={breaches?.data || []} isLoading={isLoadingBreaches} />
                {renderPagination(slaPage, setSlaPage, breaches?.total || 0)}
              </>
            ) : isLoadingBreaches ? (
              <div className="text-center py-10">Đang tải...</div>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-vin-panel2 text-vin-text2">
                      <th className="py-2 px-2">Bệnh nhân</th>
                      <th className="px-2">Chặng (Stage)</th>
                      <th className="px-2">Thời gian (phút)</th>
                      <th className="px-2">Ngưỡng</th>
                      <th className="px-2">Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breaches?.data?.map((breach: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-vin-panel2">
                        <td className="py-2 px-2">
                          {breach.studyInstanceUid ? (
                            <Link href={`/report/${breach.studyInstanceUid}`} className="text-vin-accent hover:underline">
                              {breach.patientName}
                            </Link>
                          ) : breach.patientName}
                        </td>
                        <td className="px-2">{breach.stage}</td>
                        <td className="px-2 text-red-500 font-medium">{Math.round(breach.durationMinutes)}</td>
                        <td className="px-2">{breach.thresholdMinutes}</td>
                        <td className="px-2">{breach.policyCode} <span className="text-sm text-vin-faint">({breach.source})</span></td>
                      </tr>
                    ))}
                    {(!breaches?.data || breaches.data.length === 0) && (
                      <tr><td colSpan={5} className="py-8 text-center text-vin-muted">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
                {renderPagination(slaPage, setSlaPage, breaches?.total || 0)}
              </>
            )}
          </div>
        )}

        {activeTab === 'stuck' && (
          <div>
            {enableSharedUI ? (
              <>
                <CommandCenterStuckGrid rows={stuck?.data || []} isLoading={isLoadingStuck} />
                {renderPagination(stuckPage, setStuckPage, stuck?.total || 0)}
              </>
            ) : isLoadingStuck ? (
              <div className="text-center py-10">Đang tải...</div>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-vin-panel2 text-vin-text2">
                      <th className="py-2 px-2">Mã ca</th>
                      <th className="px-2">Bệnh nhân</th>
                      <th className="px-2">Trạng thái</th>
                      <th className="px-2">Bị kẹt từ lúc</th>
                      <th className="px-2">Thời gian kẹt (giờ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stuck?.data?.map((study: any) => (
                      <tr key={study.id} className="border-b hover:bg-vin-panel2">
                        <td className="py-2 px-2">
                          {study.studyInstanceUid ? (
                            <Link href={`/report/${study.studyInstanceUid}`} className="text-vin-accent hover:underline">
                              {study.accessionNumber}
                            </Link>
                          ) : (
                            <span className="text-vin-text">{study.accessionNumber}</span>
                          )}
                        </td>
                        <td className="px-2 font-medium">{study.patientName}</td>
                        <td className="px-2">{study.status}</td>
                        <td className="px-2">{new Date(study.stuckSince).toLocaleString()}</td>
                        <td className="px-2 font-medium text-orange-500">{study.hoursStuck}h</td>
                      </tr>
                    ))}
                    {(!stuck?.data || stuck.data.length === 0) && (
                      <tr><td colSpan={5} className="py-8 text-center text-vin-muted">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
                {renderPagination(stuckPage, setStuckPage, stuck?.total || 0)}
              </>
            )}
          </div>
        )}

        {activeTab === 'backlog' && (
          <div className="grid grid-cols-2 gap-8 text-sm">
             <div>
               <h3 className="font-semibold mb-4 text-base">Bác sĩ (Chờ đọc/Đang đọc)</h3>
               {isLoadingBacklog ? <div>Đang tải...</div> : (
                 <ul className="space-y-2">
                   {backlog?.doctorBacklog?.map((d: any, idx: number) => (
                     <li key={idx} className="flex justify-between items-center bg-vin-panel2 p-3 rounded">
                       <span className="font-medium">{d.doctorName}</span>
                       <span className="font-medium bg-vin-accent/15 text-vin-accent px-2.5 py-0.5 rounded-full">{d.count}</span>
                     </li>
                   ))}
                   {(!backlog?.doctorBacklog || backlog.doctorBacklog.length === 0) && (
                     <li className="text-vin-muted">Không có dữ liệu</li>
                   )}
                 </ul>
               )}
             </div>
             <div>
               <h3 className="font-semibold mb-4 text-base">Máy chụp (Chờ chụp)</h3>
               {isLoadingBacklog ? <div>Đang tải...</div> : (
                 <ul className="space-y-2">
                   {backlog?.machineBacklog?.map((m: any, idx: number) => (
                     <li key={idx} className="flex justify-between items-center bg-vin-panel2 p-3 rounded">
                       <span className="font-medium">{m.machineName}</span>
                       <span className="font-medium bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">{m.count}</span>
                     </li>
                   ))}
                   {(!backlog?.machineBacklog || backlog.machineBacklog.length === 0) && (
                     <li className="text-vin-muted">Không có dữ liệu</li>
                   )}
                 </ul>
               )}
             </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            {enableSharedUI ? (
              <>
                {alerts?.truncated && (
                  <div className="mb-4 bg-orange-50 text-orange-800 p-2 rounded text-sm font-medium">
                    Có hơn 1000 Alerts đang chờ xử lý. Vui lòng sử dụng bộ lọc để thu hẹp phạm vi.
                  </div>
                )}
                <CommandCenterAlertsGrid rows={alerts?.data || []} isLoading={isLoadingAlerts} />
                {renderPagination(alertsPage, setAlertsPage, alerts?.total || 0)}
              </>
            ) : isLoadingAlerts ? (
              <div className="text-center py-10">Đang tải...</div>
            ) : (
              <>
                {alerts?.truncated && (
                  <div className="mb-4 bg-orange-50 text-orange-800 p-2 rounded text-sm font-medium">
                    Có hơn 1000 Alerts đang chờ xử lý. Vui lòng sử dụng bộ lọc để thu hẹp phạm vi.
                  </div>
                )}
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-vin-panel2 text-vin-text2">
                      <th className="py-2 px-2">Cảnh báo</th>
                      <th className="px-2">Độ nghiêm trọng</th>
                      <th className="px-2">Loại đối tượng</th>
                      <th className="px-2">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts?.data?.map((alert: any) => (
                      <tr key={alert.id} className="border-b hover:bg-vin-panel2">
                        <td className="py-2 px-2">
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm text-vin-muted truncate max-w-md">{alert.message}</div>
                        </td>
                        <td className="px-2">
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-2 text-vin-text2">{alert.entityType || 'SYSTEM'}</td>
                        <td className="px-2 text-vin-text2">{new Date(alert.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!alerts?.data || alerts.data.length === 0) && (
                      <tr><td colSpan={4} className="py-8 text-center text-vin-muted">Không có cảnh báo nào</td></tr>
                    )}
                  </tbody>
                </table>
                {renderPagination(alertsPage, setAlertsPage, alerts?.total || 0)}
              </>
            )}
          </div>
        )}
      </PagePanel>
    </PageCanvas>
  );
}
