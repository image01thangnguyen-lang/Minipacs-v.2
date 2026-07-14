"use client";

import { Select } from "antd";
import type { BaseSelectRef } from "rc-select";
import { forwardRef } from "react";

export type SelectOption = { value: string; label: string };

export type CustomSelectProps = {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  mono?: boolean;
  /** Retained for compatibility; AntD controls always use compact small size. */
  compact?: boolean;
};

/** AntD adapter preserving the existing string and native FormData contract. */
export const CustomSelect = forwardRef<BaseSelectRef, CustomSelectProps>(
  function CustomSelect(
    { options, value, onChange, placeholder = "Chọn...", disabled = false, className = "", name, mono = false },
    ref,
  ) {
    return (
      <div className={className} data-ui-adapter="custom-select">
        {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
        <Select
          ref={ref}
          size="small"
          value={value}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(nextValue: string) => onChange?.(nextValue)}
          className={`w-full ${mono ? "font-mono" : ""}`}
          classNames={mono ? { popup: { root: "font-mono" } } : undefined}
          notFoundContent="Không có tùy chọn"
          getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
        />
      </div>
    );
  },
);
CustomSelect.displayName = "CustomSelect";