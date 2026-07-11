import React from "react";
import { FolderOpen, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import type { AccessDeniedStateProps, EmptyStateProps, ErrorStateProps, LoadingSkeletonProps } from "./shared-contracts";

/**
 * EmptyState Primitive
 */
export function EmptyState({ 
  title = "Không có dữ liệu", 
  message = "Chưa có bản ghi nào để hiển thị trong mục này.", 
  icon: Icon = FolderOpen,
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-vin-panel2 p-4 mb-4" aria-hidden="true">
        <Icon className="h-8 w-8 text-vin-muted" />
      </div>
      <h3 className="text-lg font-medium text-vin-text">{title}</h3>
      <p className="text-sm text-vin-muted mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * ErrorState Primitive
 */
export function ErrorState({ 
  title = "Đã xảy ra lỗi", 
  message = "Không thể tải dữ liệu. Vui lòng thử lại sau.", 
  retry
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-vin-status-danger-bg p-4 mb-4" aria-hidden="true">
        <AlertTriangle className="h-8 w-8 text-vin-text" />
      </div>
      <h3 className="text-lg font-medium text-vin-text">{title}</h3>
      <p className="text-sm text-vin-text2 mt-1 max-w-sm">{message}</p>
      {retry && (
        <button 
          type="button"
          onClick={retry.onClick}
          className="mt-6 px-4 py-2 bg-vin-panel border border-vin-border rounded-md text-sm font-medium hover:bg-vin-panel2 transition-colors"
        >
          {retry.label}
        </button>
      )}
    </div>
  );
}

/**
 * AccessDeniedState Primitive
 */
export function AccessDeniedState({ 
  title = "Từ chối truy cập",
  message = "Bạn không có quyền truy cập vào tài nguyên này." 
}: AccessDeniedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-vin-status-danger-bg p-4 mb-4" aria-hidden="true">
        <ShieldAlert className="h-8 w-8 text-vin-text" />
      </div>
      <h3 className="text-lg font-medium text-vin-text">{title}</h3>
      <p className="text-sm text-vin-text2 mt-1 max-w-sm">{message}</p>
    </div>
  );
}

/**
 * LoadingSkeleton Primitive
 */
export function LoadingSkeleton({ 
  rows = 5,
  label = "Đang tải dữ liệu"
}: LoadingSkeletonProps) {
  const safeRows = Number.isFinite(rows) ? Math.min(50, Math.max(0, Math.floor(rows))) : 5;
  return (
    <div role="status" aria-label={label} aria-busy="true" className="w-full space-y-4 p-4 animate-pulse">
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-vin-muted animate-spin" />
      </div>
      {Array.from({ length: safeRows }).map((_, i) => (
        <div key={i} aria-hidden="true" className="h-10 bg-vin-panel rounded-md w-full" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
