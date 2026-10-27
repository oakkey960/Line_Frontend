"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRef } from "react";

type Option = {
  value: string;
  label: string;
};

export default function RoundedSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <details className="rounded-select" ref={details}>
      <summary aria-label={ariaLabel}>
        <span>{selected?.label}</span>
        <ChevronDown size={17} />
      </summary>
      <div
        className="rounded-select-menu"
        role="listbox"
        aria-label={ariaLabel}
      >
        {options.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={option.value === value}
            className={option.value === value ? "selected" : ""}
            key={option.value}
            onClick={() => {
              onChange(option.value);
              details.current?.removeAttribute("open");
            }}
          >
            <span>{option.label}</span>
            {option.value === value && <Check size={16} />}
          </button>
        ))}
      </div>
    </details>
  );
}
