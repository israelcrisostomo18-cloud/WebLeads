"use client";

export function ColorEditor({
  primaryColor,
  accentColor,
  onPrimaryChange,
  onAccentChange,
}: {
  primaryColor: string;
  accentColor: string;
  onPrimaryChange: (value: string) => void;
  onAccentChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
        Cor principal
        <input className="field h-11" type="color" value={primaryColor} onChange={(event) => onPrimaryChange(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
        Cor de destaque
        <input className="field h-11" type="color" value={accentColor} onChange={(event) => onAccentChange(event.target.value)} />
      </label>
    </div>
  );
}
