"use client";

import { paletteOptions } from "@/lib/siteThemes/palettes";

export function ThemeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {paletteOptions.map((palette) => (
        <button
          key={palette.key}
          className={`rounded-xl border p-3 text-left transition-colors ${value === palette.key ? "border-[#6ee7ff]/55 bg-[#6ee7ff]/12" : "border-[#6ee7ff]/16 bg-white/5 hover:bg-white/10"}`}
          onClick={() => onChange(palette.key)}
          type="button"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-white">{palette.name}</span>
            <span className="flex gap-1">
              {[palette.primary, palette.secondary, palette.accent].map((color) => (
                <span key={color} className="size-4 rounded-full border border-white/20" style={{ backgroundColor: color }} />
              ))}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
