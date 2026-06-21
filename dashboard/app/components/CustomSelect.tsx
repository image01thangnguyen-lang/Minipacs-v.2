"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  mono?: boolean;
  /** Compact sizing for filter bars */
  compact?: boolean;
};

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  disabled = false,
  className = "",
  name,
  mono = false,
  compact = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || highlightIndex < 0 || !listRef.current) return;
    const items = listRef.current.children;
    if (items[highlightIndex]) {
      (items[highlightIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, isOpen]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    const idx = options.findIndex((opt) => opt.value === value);
    setHighlightIndex(idx >= 0 ? idx : 0);
  }, [disabled, options, value]);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown"
        ) {
          event.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1,
          );
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < options.length) {
            selectOption(options[highlightIndex].value);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          break;
        default:
          break;
      }
    },
    [disabled, highlightIndex, isOpen, openDropdown, options, selectOption],
  );

  const triggerHeight = compact ? "h-[2.25rem]" : "h-10";
  const triggerPadding = compact ? "px-2.5 py-1.5" : "px-3 py-2";
  const fontSize = compact ? "text-[11px]" : "text-sm";
  const baseBgBorder = compact
    ? "border-white/10 bg-transparent"
    : "border-vin-border bg-vin-shell";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value ?? ""} />}

      {/* Trigger button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-md border ${baseBgBorder} ${triggerPadding} ${triggerHeight} ${fontSize} text-left outline-none transition
          ${mono ? "font-mono" : ""}
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-vin-borderStrong"}
          ${isOpen ? "border-vin-accent bg-vin-root/20" : ""}
          ${selectedOption ? "text-vin-text" : "text-vin-faint"}
        `}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-vin-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 z-50 mt-1 max-h-60 w-full min-w-[160px] overflow-auto rounded-md border border-white/10 bg-vin-shell shadow-xl shadow-black/30 scr-dark"
          style={{ animation: "customSelectFadeIn 0.12s ease-out" }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option.value);
                }}
                className={`cursor-pointer select-none px-4 py-2 text-[12px] transition-colors duration-75
                  ${mono ? "font-mono" : ""}
                  ${isHighlighted ? "bg-white/5" : ""}
                  ${isSelected ? "text-vin-accent font-semibold" : "text-vin-text2"}
                  ${!isHighlighted && !isSelected ? "hover:bg-white/5" : ""}
                `}
              >
                {option.label}
              </li>
            );
          })}
          {options.length === 0 && (
            <li className="px-4 py-3 text-center text-[11px] text-vin-faint">
              Không có tùy chọn
            </li>
          )}
        </ul>
      )}

      <style>{`
        @keyframes customSelectFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
