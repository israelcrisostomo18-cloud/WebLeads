"use client";

export type EditableSectionKey = "hero" | "services" | "benefits" | "about" | "differentials" | "gallery" | "location" | "faq" | "finalCta" | "footer";

export const editableSections: Array<{ key: EditableSectionKey; label: string }> = [
  { key: "hero", label: "Hero" },
  { key: "services", label: "Serviços" },
  { key: "benefits", label: "Benefícios" },
  { key: "about", label: "Sobre" },
  { key: "differentials", label: "Diferenciais" },
  { key: "gallery", label: "Galeria" },
  { key: "location", label: "Localização" },
  { key: "faq", label: "Perguntas frequentes" },
  { key: "finalCta", label: "CTA final" },
  { key: "footer", label: "Rodapé" },
];

export function SectionManager({
  selected,
  visible,
  onSelect,
  onToggle,
}: {
  selected: EditableSectionKey;
  visible: Record<string, boolean>;
  onSelect: (section: EditableSectionKey) => void;
  onToggle: (section: EditableSectionKey, checked: boolean) => void;
}) {
  return (
    <div className="grid gap-2">
      {editableSections.map((section) => (
        <div key={section.key} className="flex items-center gap-2 rounded-lg border border-[#6ee7ff]/12 bg-white/5 p-2">
          <input
            checked={visible[section.key] !== false}
            type="checkbox"
            onChange={(event) => onToggle(section.key, event.target.checked)}
          />
          <button
            className={`min-h-8 flex-1 rounded-md px-2 text-left text-sm font-bold transition-colors ${selected === section.key ? "bg-[#6ee7ff] text-[#06101d]" : "text-[#dceeff] hover:bg-white/10"}`}
            onClick={() => onSelect(section.key)}
            type="button"
          >
            {section.label}
          </button>
        </div>
      ))}
    </div>
  );
}
