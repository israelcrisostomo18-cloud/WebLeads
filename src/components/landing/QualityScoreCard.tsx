export type QualityInput = {
  title: string;
  ctaText: string;
  phone: string;
  services: string[];
  benefits: string[];
  address: string;
  hasMap: boolean;
  publicUrl?: string;
};

export function calculateQuality(input: QualityInput) {
  const checks = [
    { label: "Título forte preenchido", passed: input.title.trim().length >= 18 },
    { label: "CTA principal preenchido", passed: input.ctaText.trim().length >= 4 },
    { label: "Telefone/WhatsApp disponível", passed: input.phone.trim().length >= 8 },
    { label: "Serviços preenchidos", passed: input.services.length >= 3 },
    { label: "Benefícios preenchidos", passed: input.benefits.length >= 3 },
    { label: "Endereço preenchido", passed: input.address.trim().length >= 5 },
    { label: "Mapa configurado", passed: input.hasMap },
    { label: "Página mobile responsiva", passed: true },
    { label: "Link público gerado", passed: Boolean(input.publicUrl) },
  ];
  const passed = checks.filter((check) => check.passed).length;
  const ratio = passed / checks.length;
  const label = ratio >= 0.9 ? "Premium" : ratio >= 0.72 ? "Profissional" : ratio >= 0.5 ? "Bom" : "Básico";

  return { checks, passed, total: checks.length, label };
}

export function QualityScoreCard({ input }: { input: QualityInput }) {
  const score = calculateQuality(input);

  return (
    <section className="rounded-lg border border-[#d9ddd2] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#171a16]">Score do site</h3>
          <p className="mt-1 text-xs text-[#66705f]">{score.passed}/{score.total} itens prontos para publicar</p>
        </div>
        <span className="rounded-md bg-[#f1faf6] px-3 py-2 text-sm font-bold text-[#17624f]">{score.label}</span>
      </div>
      <div className="mt-3 grid gap-2">
        {score.checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2 text-xs">
            <span className={`size-2 rounded-full ${check.passed ? "bg-[#20b15a]" : "bg-[#d85f1d]"}`} />
            <span className={check.passed ? "text-[#2d332b]" : "text-[#8a2f13]"}>{check.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

