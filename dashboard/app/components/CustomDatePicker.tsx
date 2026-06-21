"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CustomDatePickerProps = {
  value?: string;           // yyyy-mm-dd
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  title?: string;
  /** Compact sizing for filter bars */
  compact?: boolean;
};

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  return isNaN(date.getTime()) ? null : date;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value?: string): string {
  if (!value) return "";
  const date = parseDate(value);
  if (!date) return value;
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

function getCalendarDays(year: number, month: number, selectedDate: Date | null): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: CalendarDay[] = [];

  // Previous month fill
  for (let i = startDow - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date,
      inCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
    });
  }

  // Current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      inCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
    });
  }

  // Next month fill (pad to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      inCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
    });
  }

  return days;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  disabled = false,
  className = "",
  name,
  title,
  compact = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseDate(value), [value]);

  const [viewYear, setViewYear] = useState(() => selectedDate?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate?.getMonth() ?? new Date().getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth, selectedDate),
    [viewYear, viewMonth, selectedDate],
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const navigate = useCallback((direction: "prevYear" | "prevMonth" | "nextMonth" | "nextYear") => {
    switch (direction) {
      case "prevYear":
        setViewYear((y) => y - 1);
        break;
      case "prevMonth":
        setViewMonth((m) => {
          if (m === 0) {
            setViewYear((y) => y - 1);
            return 11;
          }
          return m - 1;
        });
        break;
      case "nextMonth":
        setViewMonth((m) => {
          if (m === 11) {
            setViewYear((y) => y + 1);
            return 0;
          }
          return m + 1;
        });
        break;
      case "nextYear":
        setViewYear((y) => y + 1);
        break;
    }
  }, []);

  const handleSelectDay = useCallback(
    (day: CalendarDay) => {
      onChange?.(formatDateValue(day.date));
      setIsOpen(false);
    },
    [onChange],
  );

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange?.(formatDateValue(now));
    setIsOpen(false);
  }, [onChange]);

  const triggerHeight = compact ? "h-[2.25rem]" : "h-10";
  const triggerPadding = compact ? "px-2.5 py-1.5" : "px-3 py-2";
  const fontSize = compact ? "text-[11px]" : "text-sm";
  const baseBgBorder = compact
    ? "border-white/10 bg-transparent"
    : "border-vin-border bg-vin-shell";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        title={title}
        onClick={() => {
          if (disabled) return;
          setIsOpen((o) => !o);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-md border ${baseBgBorder} ${triggerPadding} ${triggerHeight} ${fontSize} text-left outline-none transition
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-vin-borderStrong"}
          ${isOpen ? "border-vin-accent bg-vin-root/20" : ""}
          ${value ? "text-vin-text" : "text-vin-faint"}
        `}
      >
        <span className="min-w-0 truncate font-mono">
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="h-3.5 w-3.5 shrink-0 text-vin-faint" />
      </button>

      {/* Calendar popup */}
      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-1 w-[280px] rounded-lg border border-white/10 bg-vin-shell shadow-xl shadow-black/40"
          style={{ animation: "customDateFadeIn 0.15s ease-out" }}
        >
          {/* Header navigation */}
          <div className="flex items-center justify-between border-b border-white/10 px-2 py-2">
            <div className="flex items-center gap-0.5">
              <NavButton onClick={() => navigate("prevYear")} title="Năm trước">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </NavButton>
              <NavButton onClick={() => navigate("prevMonth")} title="Tháng trước">
                <ChevronLeft className="h-3.5 w-3.5" />
              </NavButton>
            </div>

            <span className="text-[12px] font-bold text-vin-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <div className="flex items-center gap-0.5">
              <NavButton onClick={() => navigate("nextMonth")} title="Tháng sau">
                <ChevronRight className="h-3.5 w-3.5" />
              </NavButton>
              <NavButton onClick={() => navigate("nextYear")} title="Năm sau">
                <ChevronsRight className="h-3.5 w-3.5" />
              </NavButton>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-white/10 px-2 py-1.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] font-bold uppercase tracking-wider text-vin-muted"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5 p-2">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelectDay(day);
                }}
                className={`relative flex h-8 w-full items-center justify-center rounded text-[11px] font-medium transition-colors duration-75
                  ${
                    day.isSelected
                      ? "border border-vin-accent bg-vin-accent/15 text-vin-accent font-bold"
                      : day.inCurrentMonth
                        ? "text-vin-text2 hover:bg-white/5"
                        : "text-vin-faint/40 hover:bg-white/5"
                  }
                `}
              >
                {day.date.getDate()}
                {/* Today indicator dot */}
                {day.isToday && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-vin-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                goToToday();
              }}
              className="text-[10px] font-bold text-vin-accent transition hover:text-vin-accentHover"
            >
              Hôm nay
            </button>
            {value && (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange?.("");
                  setIsOpen(false);
                }}
                className="text-[10px] font-semibold text-vin-muted transition hover:text-vin-text"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes customDateFadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="flex h-7 w-7 items-center justify-center rounded text-vin-muted transition hover:bg-white/5 hover:text-vin-text"
    >
      {children}
    </button>
  );
}
