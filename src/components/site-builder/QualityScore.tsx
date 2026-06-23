"use client";

type ScoreInput = {
  title: string;
  subtitle: string;
  ctaText: string;
  phone: string;
  services: string[];
  benefits: string[];
  address: string;
  theme: string;
  publicUrl?: string;
};

export function calculateQualityScore(input: ScoreInput) {
  const checks = [
    Boolean(input.title.trim()),
    Boolean(input.subtitle.trim()),
    Boolean(input.ctaText.trim()),
    Boolean(input.phone.trim()),
    input.services.length >= 3,
    input.benefits.length >= 3,
    Boolean(input.address.trim()),
    Boolean(input.theme),
    true,
    Boolean(input.publicUrl),
  ];
  const points = checks.filter(Boolean).length;
  const label = points >= 9 ? "Premium" : points >= 7 ? "Profissional" : points >= 5 ? "Bom" : "Básico";

  return { points, total: checks.length, label };
}

export function QualityScore({ input }: { input: ScoreInput }) {
  const score = calculateQualityScore(input);

  return (
    <div className="rounded-xl border border-[#6ee7ff]/16 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-white">Score de qualidade</h3>
          <p className="mt-1 text-xs text-[#95a7bd]">{score.points}/{score.total} itens prontos</p>
        </div>
        <span className="rounded-full bg-[#6ee7ff] px-3 py-1 text-xs font-black text-[#06101d]">{score.label}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-[#6ee7ff]" style={{ width: `${(score.points / score.total) * 100}%` }} />
      </div>
    </div>
  );
}
