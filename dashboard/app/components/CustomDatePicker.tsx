"use client";

import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { forwardRef, type ComponentRef } from "react";

export type CustomDatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  title?: string;
  /** Retained for compatibility; AntD controls always use compact small size. */
  compact?: boolean;
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse date-only values without Date/UTC conversion or an UTC+7 day shift. */
export function parseDateOnly(value?: string): Dayjs | null {
  if (!value || !DATE_ONLY_PATTERN.test(value)) return null;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format("YYYY-MM-DD") === value ? parsed : null;
}

/** AntD adapter preserving YYYY-MM-DD values and native FormData submission. */
export const CustomDatePicker = forwardRef<ComponentRef<typeof DatePicker>, CustomDatePickerProps>(
  function CustomDatePicker(
    { value, onChange, placeholder = "dd/mm/yyyy", disabled = false, className = "", name, title, compact = false },
    ref,
  ) {
    return (
      <div className={className} data-ui-adapter="custom-date-picker" data-compact={compact || undefined}>
        {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
        <DatePicker
          ref={ref}
          size="small"
          value={parseDateOnly(value)}
          format="DD/MM/YYYY"
          placeholder={placeholder}
          disabled={disabled}
          title={title}
          allowClear
          inputReadOnly
          className="w-full font-mono"
          onChange={(date) => onChange?.(date ? date.format("YYYY-MM-DD") : "")}
          getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
        />
      </div>
    );
  },
);
CustomDatePicker.displayName = "CustomDatePicker";