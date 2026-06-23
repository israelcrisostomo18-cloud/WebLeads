import { Eye } from "lucide-react";
import { Button3D } from "@/components/landing/Button3D";
import type { LandingVariation } from "@/templates/landing";

export function TemplatePreviewCard({
  variation,
  selected,
  onUse,
  onPreview,
}: {
  variation: LandingVariation;
  selected: boolean;
  onUse: () => void;
  onPreview: () => void;
}) {
  return (
    <article className={`rounded-xl border p-3 transition-colors ${selected ? "premium-card premium-card-selected" : "premium-card"}`}>
      <div className="overflow-hidden rounded-lg border border-[#6ee7ff]/12 bg-[#08111f]">
        <div className="h-16" style={{ background: `linear-gradient(135deg, ${variation.primaryColor}, ${variation.accentColor})` }} />
        <div className="grid gap-2 p-3">
          <div className="h-2 w-4/5 rounded bg-white/20" />
          <div className="h-2 w-2/3 rounded bg-white/10" />
          <div className="grid grid-cols-3 gap-1 pt-2">
            <div className="h-8 rounded bg-white/10 shadow-sm" />
            <div className="h-8 rounded bg-white/10 shadow-sm" />
            <div className="h-8 rounded bg-white/10 shadow-sm" />
          </div>
        </div>
      </div>
      <h3 className="mt-3 text-sm font-bold text-white">{variation.name}</h3>
      <p className="mt-1 text-xs font-semibold text-[#6ee7ff]">{variation.objective}</p>
      <p className="mt-2 text-xs leading-5 text-[#95a7bd]">{variation.bestFor}</p>
      <div className="mt-3 grid gap-2">
        <Button3D variant={variation.buttonStyle} className="min-h-9 px-3 py-2 text-xs" onClick={onUse}>
          Usar este modelo
        </Button3D>
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#6ee7ff]/20 bg-white/5 px-3 py-2 text-xs font-bold text-[#dceeff] transition-colors hover:border-[#6ee7ff]/45 hover:bg-white/10" onClick={onPreview}>
          <Eye className="size-3.5" />
          Pré-visualizar
        </button>
      </div>
    </article>
  );
}
