"use client";

import { Copy, ExternalLink, MessageCircle, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { leadsFixos, type ManualLead } from "@/data/manualLeads";

const BATCH_SIZE = 10;
const STORAGE_KEY = "wl_manual_prospecting_state";

type LeadStatus = "novo" | "chamado" | "respondeu" | "fechado" | "perdido" | "nao_contatar";
type SiteFilter = "todos" | "com_site" | "sem_site";

type LeadWorkState = {
  status: LeadStatus;
  message: string;
  notes: string;
};

type ManualProspectingState = {
  leads: Record<string, LeadWorkState>;
  activeBatchIds: string[];
  usedBatchIds: string[];
  generatedBatches: number;
};

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "chamado", label: "Chamado" },
  { value: "respondeu", label: "Respondeu" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
  { value: "nao_contatar", label: "Não contatar" },
];

const FINAL_STATUSES = new Set<LeadStatus>(["fechado", "perdido", "nao_contatar"]);

function initialMessage(lead: ManualLead) {
  if (lead.temSite === false) {
    return `Olá, tudo bem? Vi a empresa ${lead.nome} aqui em ${lead.cidade} e não encontrei um site profissional de vocês. Eu trabalho com criação de sites simples e bonitos para empresas locais receberem mais clientes pelo WhatsApp. Posso te enviar uma prévia gratuita de como poderia ficar?`;
  }

  if (lead.temSite === true) {
    return `Olá, tudo bem? Vi o site da ${lead.nome} e acredito que dá para melhorar a apresentação, velocidade e os botões de contato pelo WhatsApp. Posso te enviar uma sugestão rápida de melhoria?`;
  }

  return `Olá, tudo bem? Vi a empresa ${lead.nome} aqui em ${lead.cidade} e queria te mostrar uma ideia simples para melhorar a presença online e gerar mais contatos pelo WhatsApp. Posso te enviar uma prévia gratuita?`;
}

function emptyState(): ManualProspectingState {
  return {
    leads: {},
    activeBatchIds: [],
    usedBatchIds: [],
    generatedBatches: 0,
  };
}

function readStoredState(): ManualProspectingState {
  if (typeof window === "undefined") {
    return emptyState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...(JSON.parse(raw) as ManualProspectingState) } : emptyState();
  } catch {
    return emptyState();
  }
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function validatePhone(value: string) {
  const digits = normalizePhone(value);
  const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;

  if (withoutCountry.length < 10) {
    return { valid: false, digits, message: "Telefone sem DDD ou incompleto." };
  }

  if (withoutCountry.length > 11) {
    return { valid: false, digits, message: "Telefone inválido. Revise o número antes de abrir o WhatsApp." };
  }

  return { valid: true, digits: digits.startsWith("55") ? digits : `55${digits}`, message: "" };
}

function statusLabel(status: LeadStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Novo";
}

function formatRate(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.round(value * 100)}%`;
}

function getLeadState(state: ManualProspectingState, lead: ManualLead): LeadWorkState {
  return state.leads[lead.id] ?? {
    status: "novo",
    message: initialMessage(lead),
    notes: "",
  };
}

export function ManualProspectingApp() {
  const [state, setState] = useState<ManualProspectingState>(() => emptyState());
  const [storageReady, setStorageReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "todos">("todos");
  const [cityFilter, setCityFilter] = useState("todos");
  const [nicheFilter, setNicheFilter] = useState("todos");
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("todos");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setState(readStoredState());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, storageReady]);

  const cities = useMemo(
    () => Array.from(new Set(leadsFixos.map((lead) => lead.cidade).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [],
  );
  const niches = useMemo(
    () => Array.from(new Set(leadsFixos.map((lead) => lead.nicho).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [],
  );

  const metrics = useMemo(() => {
    const counts = {
      total: leadsFixos.length,
      novo: 0,
      chamado: 0,
      respondeu: 0,
      fechado: 0,
      perdido: 0,
      nao_contatar: 0,
    };

    for (const lead of leadsFixos) {
      counts[getLeadState(state, lead).status] += 1;
    }

    return {
      ...counts,
      responseRate: formatRate(counts.respondeu / counts.chamado),
      closeRate: formatRate(counts.fechado / counts.chamado),
    };
  }, [state]);

  const activeBatchLeads = useMemo(() => {
    const activeIds = new Set(state.activeBatchIds);
    const searchTerm = query.trim().toLowerCase();

    return leadsFixos
      .filter((lead) => activeIds.has(lead.id))
      .filter((lead) => {
        const leadState = getLeadState(state, lead);

        if (statusFilter !== "todos" && leadState.status !== statusFilter) return false;
        if (cityFilter !== "todos" && lead.cidade !== cityFilter) return false;
        if (nicheFilter !== "todos" && lead.nicho !== nicheFilter) return false;
        if (siteFilter === "com_site" && lead.temSite !== true) return false;
        if (siteFilter === "sem_site" && lead.temSite !== false) return false;

        if (!searchTerm) return true;

        return [lead.nome, lead.telefone, lead.nicho, lead.cidade]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm);
      });
  }, [cityFilter, nicheFilter, query, siteFilter, state, statusFilter]);

  const workableLeads = useMemo(
    () => leadsFixos.filter((lead) => !FINAL_STATUSES.has(getLeadState(state, lead).status)),
    [state],
  );

  const totalBatches = Math.max(1, Math.ceil(workableLeads.length / BATCH_SIZE));
  const currentBatchLabel = state.activeBatchIds.length ? Math.min(state.generatedBatches, totalBatches) : 0;

  function updateLead(lead: ManualLead, patch: Partial<LeadWorkState>) {
    setState((current) => ({
      ...current,
      leads: {
        ...current.leads,
        [lead.id]: {
          ...getLeadState(current, lead),
          ...patch,
        },
      },
    }));
  }

  function generateBatch() {
    setNotice(null);

    setState((current) => {
      const used = new Set(current.usedBatchIds);
      const candidates = leadsFixos.filter((lead) => {
        const leadState = getLeadState(current, lead);
        return !used.has(lead.id) && !FINAL_STATUSES.has(leadState.status);
      });
      const selected = candidates.slice(0, BATCH_SIZE);

      if (!selected.length) {
        setNotice("Não há novos leads disponíveis para este ciclo. Use Resetar lotes para começar novamente.");
        return current;
      }

      return {
        ...current,
        activeBatchIds: selected.map((lead) => lead.id),
        usedBatchIds: Array.from(new Set([...current.usedBatchIds, ...selected.map((lead) => lead.id)])),
        generatedBatches: current.generatedBatches + 1,
      };
    });
  }

  function resetBatches() {
    setState((current) => ({
      ...current,
      activeBatchIds: [],
      usedBatchIds: [],
      generatedBatches: 0,
    }));
    setNotice("Lotes resetados. Os status e observações foram mantidos.");
  }

  async function copyMessage(lead: ManualLead) {
    const leadState = getLeadState(state, lead);
    await navigator.clipboard.writeText(leadState.message);
    setCopiedId(lead.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  function openWhatsapp(lead: ManualLead) {
    const phone = validatePhone(lead.telefone);

    if (!phone.valid) {
      setNotice(phone.message);
      return;
    }

    const leadState = getLeadState(state, lead);
    const url = `https://wa.me/${phone.digits}?text=${encodeURIComponent(leadState.message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="premium-shell min-h-screen px-4 py-5 md:px-6">
      <header className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6ee7ff]/24 bg-white/5 px-3 py-1 text-sm font-bold text-[#6ee7ff]">
            <ShieldCheck className="size-4" />
            Prospecção manual sem disparo em massa
          </div>
          <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">Prospecção Manual</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#95a7bd] md:text-base">
            Trabalhe leads em lotes de 10, gere mensagens personalizadas, abra o WhatsApp manualmente e acompanhe o status de cada contato.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="lead-action border-[#6ee7ff]/32 bg-[#21d4fd] text-[#06101d]" onClick={generateBatch}>
            <RefreshCw className="size-4" />
            {state.activeBatchIds.length ? "Gerar próximo lote" : "Gerar lote de 10 leads"}
          </button>
          <button className="lead-action" onClick={resetBatches}>
            Resetar lotes
          </button>
        </div>
      </header>

      <section className="mx-auto mt-5 max-w-7xl">
        <div className="premium-panel-soft rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold text-[#dceeff]">
              Lote atual: {currentBatchLabel} de {totalBatches}
            </div>
            <div className="text-xs font-semibold text-[#95a7bd]">
              {state.activeBatchIds.length ? `${state.activeBatchIds.length} leads carregados neste lote` : "Nenhum lote ativo"}
            </div>
          </div>
          {notice ? (
            <div className="mt-3 rounded-lg border border-[#f472b6]/35 bg-[#f472b6]/12 px-3 py-2 text-sm text-[#ffd4e8]">
              {notice}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-4 grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total de leads" value={metrics.total} />
        <MetricCard label="Leads novos" value={metrics.novo} />
        <MetricCard label="Chamados" value={metrics.chamado} />
        <MetricCard label="Responderam" value={metrics.respondeu} />
        <MetricCard label="Fechados" value={metrics.fechado} />
        <MetricCard label="Perdidos" value={metrics.perdido} />
        <MetricCard label="Não contatar" value={metrics.nao_contatar} />
        <MetricCard label="Taxa de resposta" value={metrics.responseRate} />
        <MetricCard label="Taxa de fechamento" value={metrics.closeRate} />
      </section>

      <section className="premium-panel mx-auto mt-4 max-w-7xl rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_160px_160px_160px_160px]">
          <label className="grid gap-1 text-sm font-bold text-[#b8c7da]">
            Buscar
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#73859b]" />
              <input
                className="field pl-9"
                placeholder="Buscar por nome, telefone ou nicho"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>
          <FilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as LeadStatus | "todos")}>
            <option value="todos">Todos</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Cidade" value={cityFilter} onChange={setCityFilter}>
            <option value="todos">Cidade</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Nicho" value={nicheFilter} onChange={setNicheFilter}>
            <option value="todos">Nicho</option>
            {niches.map((niche) => (
              <option key={niche} value={niche}>{niche}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Site" value={siteFilter} onChange={(value) => setSiteFilter(value as SiteFilter)}>
            <option value="todos">Todos</option>
            <option value="com_site">Tem site</option>
            <option value="sem_site">Não tem site</option>
          </FilterSelect>
        </div>
      </section>

      <section className="mx-auto mt-4 grid max-w-7xl gap-4">
        {!state.activeBatchIds.length ? (
          <EmptyBatch />
        ) : activeBatchLeads.length ? (
          activeBatchLeads.map((lead) => (
            <ManualLeadCard
              key={lead.id}
              copied={copiedId === lead.id}
              lead={lead}
              state={getLeadState(state, lead)}
              onCopy={() => copyMessage(lead)}
              onMessageChange={(message) => updateLead(lead, { message })}
              onNotesChange={(notes) => updateLead(lead, { notes })}
              onOpenWhatsapp={() => openWhatsapp(lead)}
              onStatusChange={(status) => updateLead(lead, { status })}
            />
          ))
        ) : (
          <div className="premium-panel rounded-2xl p-8 text-center text-sm text-[#95a7bd]">
            Nenhum lead do lote atual combina com os filtros.
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="premium-card rounded-xl p-4">
      <div className="text-xs font-bold uppercase text-[#95a7bd]">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </article>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-[#b8c7da]">
      {label}
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function ManualLeadCard({
  copied,
  lead,
  onCopy,
  onMessageChange,
  onNotesChange,
  onOpenWhatsapp,
  onStatusChange,
  state,
}: {
  copied: boolean;
  lead: ManualLead;
  onCopy: () => void;
  onMessageChange: (message: string) => void;
  onNotesChange: (notes: string) => void;
  onOpenWhatsapp: () => void;
  onStatusChange: (status: LeadStatus) => void;
  state: LeadWorkState;
}) {
  return (
    <article className="premium-card rounded-2xl p-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">{lead.nome}</h2>
              <p className="mt-1 text-sm text-[#95a7bd]">{lead.nicho} · {lead.cidade}/{lead.estado}</p>
            </div>
            <span className="neon-badge rounded-full px-3 py-1 text-xs font-black">
              {statusLabel(state.status)}
            </span>
          </div>

          <dl className="mt-4 grid gap-2 text-sm text-[#dceeff] sm:grid-cols-2">
            <Info label="Telefone" value={lead.telefone || "Não informado"} />
            <Info label="Fonte" value={lead.fonte} />
            <Info label="Site" value={lead.temSite === true ? "Tem site" : lead.temSite === false ? "Não tem site" : "Não informado"} />
            <Info label="Endereço" value={lead.endereco || `${lead.cidade} - ${lead.estado}`} />
          </dl>

          {lead.site ? (
            <a className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#6ee7ff]" href={lead.site} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              {lead.site}
            </a>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="lead-action" onClick={onCopy}>
              <Copy className="size-4" />
              {copied ? "Copiado" : "Copiar mensagem"}
            </button>
            <button className="lead-action border-[#20b15a]/30 bg-[#20b15a]/18 text-[#d7ffe5]" onClick={onOpenWhatsapp}>
              <MessageCircle className="size-4" />
              Abrir WhatsApp
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STATUS_OPTIONS.filter((status) => status.value !== "novo").map((status) => (
              <button
                key={status.value}
                className={`mini-action ${state.status === status.value ? "border-[#6ee7ff]/55 bg-[#6ee7ff]/14 text-white" : ""}`}
                onClick={() => onStatusChange(status.value)}
              >
                {status.value === "nao_contatar" ? "Não contatar novamente" : `Marcar como ${status.label.toLowerCase()}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-sm font-bold text-[#b8c7da]">
            Mensagem personalizada
            <textarea
              className="field min-h-36 resize-y"
              value={state.message}
              onChange={(event) => onMessageChange(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-[#b8c7da]">
            Observação
            <textarea
              className="field min-h-24 resize-y"
              placeholder="Ex: Pediu para chamar amanhã"
              value={state.notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </label>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#6ee7ff]/12 bg-white/5 p-3">
      <dt className="text-xs font-bold uppercase text-[#7f93aa]">{label}</dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}

function EmptyBatch() {
  return (
    <div className="premium-panel grid min-h-[320px] place-items-center rounded-2xl p-8 text-center">
      <div className="max-w-md">
        <MessageCircle className="mx-auto size-10 text-[#6ee7ff]" />
        <h2 className="mt-4 text-2xl font-black text-white">Nenhum lote ativo</h2>
        <p className="mt-3 text-sm leading-6 text-[#95a7bd]">
          Clique em Gerar lote de 10 leads para carregar os próximos contatos e trabalhar um por vez.
        </p>
      </div>
    </div>
  );
}
