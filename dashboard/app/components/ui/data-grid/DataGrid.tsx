import React, { forwardRef } from 'react';

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
        <table className="w-full min-w-max text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          {children}
        </table>
      </div>
    );
  }
);
DataGridRoot.displayName = 'DataGridRoot';

export const DataGridHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <thead className={`sticky top-0 z-20 bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2 ${className}`}>
      {children}
    </thead>
  );
};

export const DataGridBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <tbody className={`text-[11px] ${className}`}>{children}</tbody>;
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
        className={`group cursor-pointer select-none transition-colors border-b border-white/5 last:border-b-0 outline-none
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
  
  const py = compact ? 'py-1' : 'py-2';
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
