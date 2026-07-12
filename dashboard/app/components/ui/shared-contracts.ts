import type { ReactNode } from 'react';

export const SHARED_UI_CONTRACT_VERSION = 1 as const;

export const STATUS_BADGE_DOMAINS = [
  'study',
  'report',
  'consultation',
  'his',
  'admin',
  'archive',
  'destructive',
  'storage',
  'catalog',
] as const;

export type StatusBadgeDomain = (typeof STATUS_BADGE_DOMAINS)[number];
export type GridDensity = 'compact' | 'comfortable';
export type SortDirection = 'asc' | 'desc';

/**
 * Shared DataGrid Column Definition
 */
export interface ColumnDef<T> {
  /** Stable technical ID. Never use a translated label as an ID. */
  id: string;
  header: ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  pinned?: 'left' | 'right';
  pinnedOffset?: number | string;
}

/**
 * Shared DataGrid Properties
 * Handles density, pagination, sorting, and row selection in a standardized way.
 */
export interface SharedDataGridProps<T> {
  data: readonly T[];
  columns: readonly ColumnDef<T>[];
  getRowId: (item: T) => string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  errorState?: ReactNode;
  ariaLabel?: string;
  
  // Selection
  onRowClick?: (item: T) => void;
  onRowDoubleClick?: (item: T) => void;
  selectedIds?: readonly string[];
  onSelectionChange?: (ids: readonly string[]) => void;
  
  // Sorting
  sortConfig?: { key: string; direction: SortDirection };
  onSort?: (key: string) => void;
  
  // Presentation
  density?: GridDensity;
  stickyHeader?: boolean;
  containerClassName?: string;
  tableClassName?: string;
  /** Maximum rendered rows; this is a render cap, not true virtualization. */
  renderLimit?: number;
  /** @deprecated Use renderLimit; retained for adapter compatibility. */
  virtualizationThreshold?: number;
}

/**
 * Domain-specific StatusBadge Properties
 * Enforces strong domain typing rather than a generic status taxonomy.
 */
export interface StatusBadgeProps {
  domain: StatusBadgeDomain;
  status: string;
  label?: string; // Optional manual override for localization/formatting
  size?: 'sm' | 'md';
  className?: string;
}

export interface StateActionProps {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ElementType;
  action?: ReactNode;
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: StateActionProps;
}

export interface AccessDeniedStateProps {
  title?: string;
  message?: string;
}

export interface LoadingSkeletonProps {
  rows?: number;
  label?: string;
}

/**
 * FilterBar Properties
 * Shared workspace/page filter header structure.
 */
export interface FilterBarProps {
  /** Controlled value; URL state remains owned by the route. */
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  onReset?: () => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  facets?: ReactNode; // For domain-specific selects
  datePreset?: ReactNode;
  actions?: ReactNode; // For primary actions (e.g. Create new)
  className?: string;
}

/**
 * Workspace Header Properties
 */
export interface WorkspaceHeaderProps {
  title: string;
  subtitle?: ReactNode;
  extraContent?: ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
}
