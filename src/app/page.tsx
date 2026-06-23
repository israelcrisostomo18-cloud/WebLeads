import Link from "next/link";
import { ArrowRight, Bot, MapPinned, MessageCircle, Search, Sparkles } from "lucide-react";

const benefits = [
  "Encontre empresas locais por cidade, nicho e raio.",
  "Veja tudo em um mapa interno com OpenStreetMap.",
  "Salve leads, copie contatos e organize sua prospecção.",
  "Gere landing pages profissionais com IA sem expor sua chave.",
];

const steps = [
  { icon: Search, title: "Pesquise", text: "Escolha cidade, segmento e raio para buscar leads locais." },
  { icon: MapPinned, title: "Analise", text: "Veja pinos, dados do negócio, telefone, site e status no próprio WebLeads." },
  { icon: Sparkles, title: "Gere", text: "Crie uma landing page com IA usando os dados do lead." },
  { icon: MessageCircle, title: "Venda", text: "Copie a proposta ou chame no WhatsApp quando quiser abordar." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070a12] text-white">
      <section className="relative overflow-hidden px-5 py-10 md:px-10">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 80% 10%, #6366f1, transparent 30%), radial-gradient(circle at 20% 20%, #21d4fd, transparent 26%)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div className="py-10 md:py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6ee7ff]/24 bg-white/5 px-3 py-1 text-sm font-bold text-[#6ee7ff]">
              <Bot className="size-4" />
              WebLeads para revendedores de sites
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] md:text-6xl">
              Encontre negócios sem site e gere páginas prontas para vender.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#b8c7da]">
              Plataforma de prospecção local com mapa interno, busca por raio, leads salvos e geração de landing pages com IA.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#21d4fd] px-5 text-sm font-black text-[#06101d] shadow-[0_8px_0_#087392,0_22px_42px_rgba(33,212,253,0.24)]"
                href="/mapa"
              >
                Acessar Mapa de Leads
                <ArrowRight className="size-4" />
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#6ee7ff]/22 bg-white/5 px-5 text-sm font-bold text-[#dceeff]"
                href="#como-funciona"
              >
                Como funciona
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[#6ee7ff]/18 bg-[#0b1220]/86 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
            <div className="rounded-xl border border-white/10 bg-[#07101f] p-4">
              <div className="grid gap-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="rounded-lg border border-[#6ee7ff]/14 bg-white/5 p-3 text-sm font-semibold text-[#dceeff]">
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-t border-white/10 px-5 py-14 md:px-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black md:text-4xl">Como funciona</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step) => (
              <article key={step.title} className="rounded-xl border border-[#6ee7ff]/16 bg-white/5 p-5">
                <step.icon className="size-6 text-[#6ee7ff]" />
                <h3 className="mt-4 font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#95a7bd]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
