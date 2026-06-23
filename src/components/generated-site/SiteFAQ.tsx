import type { GeneratedSiteRenderData } from "@/components/generated-site/types";
import { getGeneratedFAQByNiche } from "@/lib/siteGenerator/faqByNiche";
import type { SitePalette } from "@/lib/siteThemes/palettes";

export function SiteFAQ({ data, palette }: { data: GeneratedSiteRenderData; palette: SitePalette }) {
  if (data.showFaq === false) return null;

  const faqs = data.faqs?.length ? data.faqs : getGeneratedFAQByNiche(data.niche);

  return (
    <section className="px-5 py-14 md:px-10" style={{ backgroundColor: palette.surfaceAlt, color: palette.text }}>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-black md:text-4xl">Perguntas frequentes</h2>
        <div className="mt-7 grid gap-3">
          {faqs.slice(0, 5).map((faq) => (
            <details key={faq.question} className="rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
              <summary className="cursor-pointer font-black">{faq.question}</summary>
              <p className="mt-3 leading-7" style={{ color: palette.muted }}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
