import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Crown,
  MapPinned,
  MessageCircle,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

const benefits = [
  {
    title: "Mapa de leads interno",
    text: "Pesquise por cidade, nicho e raio sem depender de abas externas para analisar os resultados.",
  },
  {
    title: "Leads com prioridade comercial",
    text: "Filtre empresas sem site, com telefone e endereço para focar nas oportunidades mais fáceis de abordar.",
  },
  {
    title: "Site pronto para proposta",
    text: "Gere uma landing page com IA, copie a proposta e envie o link para o cliente em poucos cliques.",
  },
];

const steps = [
  { icon: Search, title: "Busque", text: "Escolha estado, cidade, segmento e raio para encontrar negócios locais." },
  { icon: MapPinned, title: "Analise", text: "Veja pinos, contatos, site, telefone e endereço dentro do WebLeads." },
  { icon: Sparkles, title: "Crie", text: "Transforme um lead em uma landing page pronta para apresentação." },
  { icon: MessageCircle, title: "Venda", text: "Copie mensagens profissionais e conduza o atendimento pelo WhatsApp." },
];

const plans = [
  { name: "Mensal", price: "R$47,98", detail: "para testar e vender os primeiros sites" },
  { name: "2 Meses", price: "R$67,89", detail: "mais tempo para validar cidades e nichos" },
  { name: "6 Meses", price: "R$154,00", detail: "ideal para rotina constante de prospecção" },
  { name: "Anual", price: "R$187,90", detail: "melhor custo-benefício", featured: true },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#edf4f8] text-[#142033]">
      <header className="border-b border-[#c9d8e3] bg-[#f7fbfd]/90 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="flex items-center gap-2 text-base font-black text-[#15243a]" href="/">
            <span className="grid size-10 place-items-center rounded-xl bg-[#155eef] text-white shadow-[0_12px_28px_rgba(21,94,239,0.24)]">
              <Bot className="size-5" />
            </span>
            WebLeads
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-bold text-[#52657a] md:flex">
            <a className="hover:text-[#155eef]" href="#beneficios">Benefícios</a>
            <a className="hover:text-[#155eef]" href="#como-funciona">Como funciona</a>
            <a className="hover:text-[#155eef]" href="#planos">Planos</a>
          </nav>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#155eef] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(21,94,239,0.24)] transition-colors hover:bg-[#0f49c8]"
            href="/mapa"
          >
            Acessar mapa
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="px-5 py-12 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bdd0df] bg-white px-3 py-1 text-sm font-black text-[#155eef] shadow-sm">
              <Sparkles className="size-4" />
              Prospecção local com IA para vender sites
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] tracking-normal text-[#101828] md:text-6xl">
              Encontre empresas, gere leads e crie oportunidades de venda em poucos cliques.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52657a]">
              O WebLeads mostra negócios locais no mapa, ajuda a priorizar empresas sem site e cria modelos de páginas
              profissionais para você transformar pesquisa em proposta.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#155eef] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(21,94,239,0.26)] transition-colors hover:bg-[#0f49c8]"
                href="/mapa"
              >
                Acessar Mapa de Leads
                <ArrowRight className="size-4" />
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#bdd0df] bg-white px-5 text-sm font-black text-[#15243a] transition-colors hover:bg-[#eef6fb]"
                href="#planos"
              >
                Ver planos
              </a>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#bdd0df] bg-white px-5 text-sm font-black text-[#15243a] transition-colors hover:bg-[#eef6fb]"
                href="/prospeccao-manual"
              >
                <UsersRound className="size-4" />
                Prospecção manual
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#c9d8e3] bg-white p-4 shadow-[0_24px_70px_rgba(28,52,84,0.14)]">
            <div className="rounded-2xl bg-[#f1f7fb] p-4">
              <div className="rounded-2xl border border-[#d8e4ec] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#155eef]">Busca ativa</p>
                    <h2 className="mt-1 text-2xl font-black text-[#101828]">Barbearias sem site</h2>
                  </div>
                  <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-black text-[#166534]">ao vivo</span>
                </div>
                <div className="mt-5 grid gap-3">
                  {["12 leads sem site", "8 com WhatsApp", "3 sites gerados", "1 proposta pronta"].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-[#d8e4ec] bg-[#f8fbfd] p-3 text-sm font-bold text-[#31465d]">
                      <CheckCircle2 className="size-5 text-[#16a34a]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="px-5 py-10 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-[#c9d8e3] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-[#101828]">{benefit.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#52657a]">{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="px-5 py-12 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#155eef]">Como funciona</p>
            <h2 className="mt-3 text-3xl font-black text-[#101828] md:text-4xl">Da pesquisa ao contato comercial.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-[#c9d8e3] bg-white p-5 shadow-sm">
                <step.icon className="size-7 text-[#155eef]" />
                <h3 className="mt-4 font-black text-[#101828]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#52657a]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="px-5 py-12 md:px-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-[#c9d8e3] bg-[#f7fbfd] p-5 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#155eef]">Planos</p>
              <h2 className="mt-3 text-3xl font-black text-[#101828] md:text-4xl">Escolha o tempo de uso.</h2>
            </div>
            <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-[#101828] px-5 text-sm font-black text-white transition-colors hover:bg-[#243149]" href="/mapa">
              Começar agora
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-2xl border p-5 ${
                  plan.featured
                    ? "border-[#155eef] bg-[#155eef] text-white shadow-[0_18px_46px_rgba(21,94,239,0.22)]"
                    : "border-[#c9d8e3] bg-white text-[#101828]"
                }`}
              >
                {plan.featured ? (
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-1 text-xs font-black">
                    <Crown className="size-3" />
                    Melhor custo-benefício
                  </div>
                ) : null}
                <h3 className="text-lg font-black">{plan.name}</h3>
                <p className="mt-4 text-3xl font-black">{plan.price}</p>
                <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-[#dce9ff]" : "text-[#52657a]"}`}>{plan.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
