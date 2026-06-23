"use client";

import type { EditableSectionKey } from "@/components/site-builder/SectionManager";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
      {label}
      {children}
    </label>
  );
}

export function SectionEditor({
  selected,
  values,
  onChange,
}: {
  selected: EditableSectionKey;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (selected === "hero") {
    return (
      <div className="grid gap-3">
        <Field label="Título principal"><textarea className="field min-h-24" value={values.title} onChange={(event) => onChange("title", event.target.value)} /></Field>
        <Field label="Subtítulo"><textarea className="field min-h-24" value={values.subtitle} onChange={(event) => onChange("subtitle", event.target.value)} /></Field>
        <Field label="CTA principal"><input className="field" value={values.ctaText} onChange={(event) => onChange("ctaText", event.target.value)} /></Field>
      </div>
    );
  }

  if (selected === "services") {
    return <Field label="Serviços, um por linha"><textarea className="field min-h-40" value={values.services} onChange={(event) => onChange("services", event.target.value)} /></Field>;
  }

  if (selected === "benefits") {
    return <Field label="Benefícios, um por linha"><textarea className="field min-h-40" value={values.benefits} onChange={(event) => onChange("benefits", event.target.value)} /></Field>;
  }

  if (selected === "about") {
    return <Field label="Texto sobre"><textarea className="field min-h-40" value={values.description} onChange={(event) => onChange("description", event.target.value)} /></Field>;
  }

  if (selected === "differentials") {
    return <Field label="Diferenciais, um por linha"><textarea className="field min-h-40" value={values.differentials} onChange={(event) => onChange("differentials", event.target.value)} /></Field>;
  }

  if (selected === "gallery") {
    return <Field label="Blocos da galeria, um por linha"><textarea className="field min-h-32" value={values.gallery} onChange={(event) => onChange("gallery", event.target.value)} /></Field>;
  }

  if (selected === "faq") {
    return <Field label="Perguntas no formato pergunta|resposta"><textarea className="field min-h-40" value={values.questions} onChange={(event) => onChange("questions", event.target.value)} /></Field>;
  }

  if (selected === "finalCta") {
    return <Field label="CTA final"><textarea className="field min-h-24" value={values.ctaFinal} onChange={(event) => onChange("ctaFinal", event.target.value)} /></Field>;
  }

  return (
    <div className="rounded-lg border border-[#6ee7ff]/16 bg-white/5 p-3 text-sm text-[#95a7bd]">
      Esta seção usa dados gerais do lead, como endereço, telefone, cidade e nome da empresa.
    </div>
  );
}
