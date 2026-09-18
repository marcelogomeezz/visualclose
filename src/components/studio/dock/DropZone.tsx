"use client";

import { useRef, useState, type ReactNode } from "react";

export function DropZone({
  onFiles,
  multiple = false,
  children,
  className = "",
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const accept = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        accept(e.dataTransfer.files);
      }}
      className={`cursor-pointer border transition-colors duration-150 ${over ? "border-champagne bg-champagne-soft" : "border-dashed border-line-strong hover:border-ivory/40"} ${compact ? "p-2" : "p-4"} ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
      />
      {children}
    </div>
  );
}
