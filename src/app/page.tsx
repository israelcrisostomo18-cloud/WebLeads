import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  FileCode2,
  MapPin,
  Radar,
  Sparkles,
  Zap,
} from "lucide-react";

const leadCards = [
  { name: "Barbearia Prime", detail: "sem site", tone: "cyan" },
  { name: "Studio Bella", detail: "WhatsApp ativo", tone: "violet" },
  { name: "Oficina Central", detail: "site gerado", tone: "blue" },
];

const metrics = [
  { label: "Leads encontrados", value: "248" },
  { label: "Sem site", value: "71%" },
  { label: "Sites criados", value: "36" },
];

const buildings = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  height: [26, 42, 34, 58, 48, 30, 66, 40, 54, 28, 46, 60, 36, 52, 32, 44, 64, 38][index],
}));

export default function Home() {
  return (
    <main className="home-3d-shell min-h-screen overflow-hidden text-white">
      <section className="relative min-h-screen px-5 py-6 md:px-10">
        <div className="home-3d-grid" />
        <div className="home-3d-noise" />

        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3 font-black text-white" href="/">
            <span className="grid size-11 place-items-center rounded-2xl border border-cyan-300/35 bg-cyan-300/12 shadow-[0_0_30px_rgba(34,211,238,0.24)]">
              <Bot className="size-5 text-cyan-200" />
            </span>
            <span>WebLeads</span>
          </Link>
          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-bold text-slate-300 backdrop-blur md:flex">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.8)]" />
            Prospecção automatizada ativa
          </div>
        </header>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-12 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/24 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 shadow-[0_0_36px_rgba(34,211,238,0.12)] backdrop-blur">
              <Sparkles className="size-4" />
              Plataforma SaaS para vender sites a negócios locais
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[0.98] tracking-normal text-white md:text-6xl xl:text-7xl">
              Encontre empresas no mapa e gere sites profissionais em minutos
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Prospere negócios locais, encontre oportunidades reais e crie páginas profissionais para apresentar aos
              clientes com muito mais impacto.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="home-3d-primary-button inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-cyan-300 px-6 text-sm font-black text-slate-950 shadow-[0_20px_56px_rgba(34,211,238,0.28)] transition-colors hover:bg-white"
                href="/mapa"
              >
                Acessar mapa de leads
                <ArrowRight className="size-5" />
              </Link>
              <div className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-5 text-sm font-bold text-slate-200 backdrop-blur">
                <Radar className="size-5 text-violet-200" />
                OSM, Foursquare e Google Places
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <div className="text-2xl font-black text-white">{metric.value}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="home-3d-stage" aria-label="Visual 3D de automação de leads">
            <div className="home-3d-scene">
              <div className="home-3d-map">
                <div className="home-3d-road home-3d-road-a" />
                <div className="home-3d-road home-3d-road-b" />
                <div className="home-3d-road home-3d-road-c" />
                <div className="home-3d-buildings">
                  {buildings.map((building) => (
                    <span
                      key={building.id}
                      className="home-3d-building"
                      style={{ "--building-height": `${building.height}px` } as CSSProperties}
                    />
                  ))}
                </div>
                <span className="home-3d-pin home-3d-pin-a"><MapPin className="size-5" /></span>
                <span className="home-3d-pin home-3d-pin-b"><MapPin className="size-4" /></span>
                <span className="home-3d-pin home-3d-pin-c"><MapPin className="size-4" /></span>
                <span className="home-3d-signal home-3d-signal-a" />
                <span className="home-3d-signal home-3d-signal-b" />
                <span className="home-3d-signal home-3d-signal-c" />
              </div>

              <div className="home-3d-panel home-3d-panel-left">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
                  <BarChart3 className="size-4" />
                  Análise de leads
                </div>
                <div className="mt-4 space-y-3">
                  <div className="home-3d-chart-line w-[92%]" />
                  <div className="home-3d-chart-line w-[68%]" />
                  <div className="home-3d-chart-line w-[82%]" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <span className="home-3d-bar h-10" />
                  <span className="home-3d-bar h-16" />
                  <span className="home-3d-bar h-12" />
                </div>
              </div>

              <div className="home-3d-panel home-3d-panel-right">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-200">
                  <FileCode2 className="size-4" />
                  Site gerado
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/8 p-3">
                  <div className="h-3 w-2/3 rounded-full bg-cyan-200/80" />
                  <div className="mt-3 h-2 w-full rounded-full bg-white/18" />
                  <div className="mt-2 h-2 w-4/5 rounded-full bg-white/14" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <span className="h-12 rounded-lg bg-violet-300/20" />
                    <span className="h-12 rounded-lg bg-cyan-300/20" />
                  </div>
                </div>
              </div>

              <div className="home-3d-lead-stack">
                {leadCards.map((lead, index) => (
                  <div key={lead.name} className={`home-3d-lead-card home-3d-lead-card-${index + 1}`}>
                    <span className={`home-3d-lead-icon home-3d-lead-icon-${lead.tone}`}>
                      <Building2 className="size-4" />
                    </span>
                    <span>
                      <strong>{lead.name}</strong>
                      <small>{lead.detail}</small>
                    </span>
                    <CheckCircle2 className="ml-auto size-4 text-emerald-300" />
                  </div>
                ))}
              </div>

              <div className="home-3d-flow home-3d-flow-a"><Zap className="size-4" /></div>
              <div className="home-3d-flow home-3d-flow-b"><Zap className="size-4" /></div>
              <div className="home-3d-flow home-3d-flow-c"><Zap className="size-4" /></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
