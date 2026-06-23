"use client";

import { fontOptions } from "@/lib/siteThemes/fonts";

export function FontSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
      Fonte do site
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {fontOptions.map((font) => (
          <option key={font.key} value={font.key}>{font.name}</option>
        ))}
      </select>
    </label>
  );
}
