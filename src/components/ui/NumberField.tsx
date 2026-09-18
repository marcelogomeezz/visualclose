"use client";

import { useState } from "react";

export function NumberField({
  label,
  value,
  onCommit,
  step = 0.1,
  min = 0.01,
  suffix,
  disabled,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(String(value));
  }
  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n) && n >= min && n !== value) onCommit(n);
    else setText(String(value));
  };
  return (
    <label className="block">
      <span className="t-label block mb-1">{label}</span>
      <span className="relative block">
        <input
          className="vc-input mono pr-9"
          type="number"
          step={step}
          min={min}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setText(String(value));
          }}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-warm-grey t-mono">{suffix}</span>}
      </span>
    </label>
  );
}
