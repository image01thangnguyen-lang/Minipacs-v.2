import React, { forwardRef, KeyboardEvent, useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { SharedDataGridProps } from '../shared-contracts';

export interface DataGridRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DataGridRoot = forwardRef<HTMLDivElement, DataGridRootProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`min-h-0 flex-1 overflow-auto scr-dark relative ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DataGridRoot.displayName = 'DataGridRoot';

export const DataGridHeader = ({ children, className = '', sticky = true }: { children: React.ReactNode; className?: string; sticky?: boolean }) => {
  return (
    <thead className={`${sticky ? 'sticky top-0 z-20' : ''} bg-vin-panel2 text-sm font-semibold uppercase tracking-wider text-vin-text2 ${className}`}>
      {children}
    </thead>
  );
};

export const DataGridBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <tbody className={`text-sm ${className}`}>{children}</tbody>;
};

export interface DataGridRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isSelected?: boolean;
  isFocused?: boolean; // For keyboard nav
}

export const DataGridRow = forwardRef<HTMLTableRowElement, DataGridRowProps>(
  ({ className = '', isSelected, isFocused, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={`group cursor-pointer select-none transition-colors border-b border-white/5 last:border-b-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vin-accent
          ${isSelected ? 'bg-vin-tableSelected text-white border-l-2 border-l-vin-accent' : 'bg-vin-tableAlt border-l-2 border-l-transparent text-vin-text2 hover:bg-vin-tableHover group-even:bg-vin-table'}
          ${isFocused ? 'ring-1 ring-inset ring-vin-accent ring-opacity-50' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
DataGridRow.displayName = 'DataGridRow';

export interface DataGridCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  pinned?: 'left' | 'right';
  pinnedOffset?: number;
  isHeader?: boolean;
  shadow?: boolean;
  compact?: boolean;
}

export const DataGridCell = ({ children, pinned, pinnedOffset = 0, isHeader, shadow, compact, className = '', style, ...props }: DataGridCellProps) => {
  const Component = isHeader ? 'th' : 'td';

  const py = compact ? 'py-2' : 'py-2.5';
  const baseClasses = isHeader ? `${py} px-2 border-b border-white/10` : `${py} px-2`;

  let pinnedClasses = '';
  if (pinned) {
    pinnedClasses = 'sticky z-10 bg-inherit'; // bg-inherit so row bg applies
    if (isHeader) {
      pinnedClasses += ' z-30 bg-vin-panel2'; // header pinned needs higher z-index
    }
    if (shadow) {
      if (pinned === 'left') pinnedClasses += ' drop-shadow-[2px_0_4px_rgba(0,0,0,0.5)]';
      if (pinned === 'right') pinnedClasses += ' drop-shadow-[-2px_0_4px_rgba(0,0,0,0.5)]';
    }
  }

  return (
    <Component
      className={`${baseClasses} ${pinnedClasses} ${className}`}
      style={{
        ...style,
        ...(pinned === 'left' ? { left: pinnedOffset } : {}),
        ...(pinned === 'right' ? { right: pinnedOffset } : {}),
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export function SharedDataGrid<T>({
  data,
  columns,
  getRowId,
  isLoading,
  emptyState,
  errorState,
  ariaLabel = 'Bảng dữ liệu',
  onRowClick,
  onRowDoubleClick,
  selectedIds,
  onSelectionChange,
  sortConfig,
  onSort,
  density = 'comfortable',
  stickyHeader = true,
  containerClassName = '',
  tableClassName = '',
  renderLimit,
  virtualizationThreshold,
}: SharedDataGridProps<T>) {
  const isCompact = density === 'compact';
  const gridRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const shouldFocusSelectedRow = useRef(false);

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, index: number, item: T) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(renderData.length - 1, index + delta));
      const nextItem = renderData[nextIndex];
      const nextId = getRowId(nextItem);
      shouldFocusSelectedRow.current = true;
      onRowClick?.(nextItem);
      onSelectionChange?.([nextId]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowDoubleClick?.(item);
    }
  };

  useEffect(() => {
    if (activeRowRef.current && gridRef.current) {
      const container = gridRef.current;
      const row = activeRowRef.current;
      const containerRect = container.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();

      if (rowRect.top < containerRect.top + 40) {
        container.scrollTop += rowRect.top - containerRect.top - 40;
      } else if (rowRect.bottom > containerRect.bottom) {
        container.scrollTop += rowRect.bottom - containerRect.bottom;
      }

      if (shouldFocusSelectedRow.current) {
        activeRowRef.current.focus({ preventScroll: true });
        shouldFocusSelectedRow.current = false;
      }
    }
  }, [selectedIds]);

  const configuredRenderLimit = renderLimit ?? virtualizationThreshold;
  const safeRenderLimit = configuredRenderLimit == null ? data.length : Math.max(1, Math.floor(configuredRenderLimit));
  const renderData = useMemo(() => data.slice(0, safeRenderLimit), [data, safeRenderLimit]);

  return (
    <DataGridRoot ref={gridRef} className={containerClassName} aria-busy={isLoading || undefined}>
      <table aria-label={ariaLabel} className={`w-full min-w-max text-left ${tableClassName}`} style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
      <DataGridHeader sticky={stickyHeader}>
        <tr>
          {columns.map((col) => (
            <DataGridCell
              key={col.id}
              isHeader
              compact={isCompact}
              pinned={col.pinned}
              pinnedOffset={col.pinnedOffset as number}
              shadow={!!col.pinned}
              scope="col"
              aria-sort={sortConfig?.key === col.id ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : undefined}
              style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth, textAlign: col.align }}
            >
              {col.sortable && onSort ? <button type="button" className="w-full text-inherit" onClick={() => onSort(col.id)}>{col.header}{sortConfig?.key === col.id ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}</button> : col.header}
            </DataGridCell>
          ))}
        </tr>
      </DataGridHeader>
      <DataGridBody>
        {isLoading ? (
          <tr>
            <td colSpan={columns.length} className="py-12 text-center text-vin-muted">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
              Đang tải dữ liệu...
            </td>
          </tr>
        ) : errorState ? (
          <tr><td colSpan={columns.length} role="alert" className="py-12 text-center text-red-300">{errorState}</td></tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="py-12 text-center text-vin-muted">
              {emptyState || 'Không có dữ liệu.'}
            </td>
          </tr>
        ) : (
          <>
            {renderData.map((item, index) => {
              const id = getRowId(item);
              const isSelected = selectedIds?.includes(id);
              const isFirstOrSelected = isSelected || (!selectedIds?.length && index === 0);

              return (
                <DataGridRow
                  key={id}
                  isSelected={isSelected}
                  aria-selected={isSelected}
                  tabIndex={isFirstOrSelected ? 0 : -1}
                  ref={isSelected ? activeRowRef : null}
                  onClick={(e) => {
                    onRowClick?.(item);
                    onSelectionChange?.([id]);
                    e.currentTarget.focus();
                  }}
                  onDoubleClick={() => onRowDoubleClick?.(item)}
                  onKeyDown={(e) => handleRowKeyDown(e, index, item)}
                >
                  {columns.map((col) => (
                    <DataGridCell
                      key={col.id}
                      compact={isCompact}
                      pinned={col.pinned}
                      pinnedOffset={col.pinnedOffset as number}
                      shadow={!!col.pinned}
                      style={{ textAlign: col.align }}
                    >
                      {col.cell ? col.cell(item, index) : col.accessorKey ? String(item[col.accessorKey] ?? '') : null}
                    </DataGridCell>
                  ))}
                </DataGridRow>
              );
            })}
            {data.length > safeRenderLimit && (
              <tr>
                <td colSpan={columns.length} className="py-4 text-center text-sm text-vin-muted font-medium bg-vin-panel2/50">
                  Hiển thị giới hạn {safeRenderLimit}/{data.length} dòng để tối ưu. Vui lòng dùng bộ lọc để thu hẹp kết quả.
                </td>
              </tr>
            )}
          </>
        )}
      </DataGridBody>
      </table>
    </DataGridRoot>
  );
}
