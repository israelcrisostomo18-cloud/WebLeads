"use client";

import type * as Leaflet from "leaflet";
import { useRouter } from "next/navigation";
import {
  Building2,
  Copy,
  Download,
  FilePlus2,
  Layers3,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PremiumLandingGeneratorModal } from "@/components/landing/PremiumLandingGeneratorModal";
import citiesData from "@/data/brazil-cities.json";
import { NICHES } from "@/data/niches";
import { WHATSAPP_MESSAGE } from "@/lib/format";
import { makeLeadWhatsappUrl } from "@/lib/sites";
import { buildLandingVariations, type LandingVariation } from "@/templates/landing";
import type {
  BusinessLead,
  DataProviderSource,
  GeneratedSite,
  LandingButtonStyle,
  LandingTemplateType,
  LandingVisualStyle,
  SearchResponse,
  StateWithCities,
} from "@/types";

const STATES = citiesData as StateWithCities[];
const DATA_SOURCE_OPTIONS: Array<{
  value: DataProviderSource;
  label: string;
  helper: string;
}> = [
  { value: "osm", label: "Fonte gratuita: OpenStreetMap", helper: "Overpass API" },
  { value: "foursquare", label: "Fonte avançada: Foursquare", helper: "Places API" },
  { value: "google", label: "Fonte premium: Google Places", helper: "em breve" },
];
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const QUICK_RADIUS_OPTIONS = [1, 3, 5, 10, 25, 50];
const CACHE_TTL_MS = 30 * 60 * 1000;
const SEARCH_CACHE_PREFIX = "wl_search";
const SAVED_LEADS_KEY = "wl_saved_leads";
const ASSISTANT_MESSAGES_KEY = "wl_ai_assistant_messages";

type SiteDraft = {
  templateType: LandingTemplateType;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  title: string;
  subtitle: string;
  description: string;
  services: string;
  benefits: string;
  ctaText: string;
  ctaFinal: string;
  phone: string;
  address: string;
  primaryColor: string;
  accentColor: string;
  showMap: boolean;
  showAbout: boolean;
  showBenefits: boolean;
};

type GeneratorState = {
  lead: BusinessLead;
  variations: LandingVariation[];
  draft: SiteDraft;
  previewSite: GeneratedSite | null;
};

type SiteHistory = Record<string, GeneratedSite[]>;

type MapCenter = {
  lat: number;
  lng: number;
};

type SavedLead = BusinessLead & {
  savedAt: string;
};

type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
};

type AssistantContext = {
  selectedLead: BusinessLead | null;
  selectedNiche: string;
  selectedCity: string;
  selectedState: string;
  savedLeadsCount: number;
  visibleLeadsCount: number;
  totalLeadsCount: number;
  latestSite: GeneratedSite | null;
};

function leadKey(lead: BusinessLead) {
  return `${lead.osmType}-${lead.osmId}`;
}

function isValidCoordinate(lat: unknown, lng: unknown) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn("WebLeads storage read failed:", key, error);
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("WebLeads storage write failed:", key, error);
  }
}

function siteBuilderKey(lead: BusinessLead) {
  return `${lead.source ?? "osm"}-${lead.id ?? leadKey(lead)}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120) || leadKey(lead);
}

function variationToDraft(variation: LandingVariation, lead: BusinessLead): SiteDraft {
  return {
    templateType: variation.type,
    visualStyle: variation.visualStyle,
    buttonStyle: variation.buttonStyle,
    title: variation.title,
    subtitle: variation.subtitle,
    description: variation.description,
    services: variation.services.join("\n"),
    benefits: variation.benefits.join("\n"),
    ctaText: variation.ctaText,
    ctaFinal: variation.ctaFinal,
    phone: lead.phone ?? "",
    address: lead.address,
    primaryColor: variation.primaryColor,
    accentColor: variation.accentColor,
    showMap: true,
    showAbout: true,
    showBenefits: true,
  };
}

function siteToDraft(site: GeneratedSite): SiteDraft {
  return {
    templateType: site.templateType,
    visualStyle: site.visualStyle,
    buttonStyle: site.buttonStyle,
    title: site.title,
    subtitle: site.subtitle,
    description: site.description,
    services: site.services.join("\n"),
    benefits: site.benefits.join("\n"),
    ctaText: site.ctaText,
    ctaFinal: site.ctaFinal,
    phone: site.phone ?? "",
    address: site.address,
    primaryColor: site.primaryColor,
    accentColor: site.accentColor,
    showMap: site.showMap,
    showAbout: site.showAbout,
    showBenefits: site.showBenefits,
  };
}

function siteMessage(site: GeneratedSite) {
  return site.whatsappMessage;
}

function normalizeRadiusKm(value: number | string) {
  const radius = typeof value === "string" ? Number(value.replace(",", ".")) : value;

  if (!Number.isFinite(radius)) {
    return MIN_RADIUS_KM;
  }

  return Math.min(Math.max(Math.round(radius), MIN_RADIUS_KM), MAX_RADIUS_KM);
}

function makeSearchCacheKey(args: {
  provider: DataProviderSource;
  state: string;
  city: string;
  niche: string;
  radiusKm: number;
}) {
  return `${SEARCH_CACHE_PREFIX}_${args.provider}_${args.niche}_${args.city}_${args.state}_${args.radiusKm}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

function readSearchCache(key: string): SearchResponse | null {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { data: SearchResponse; timestamp: number };

    if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeSearchCache(key: string, data: SearchResponse) {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

function makeLeadClipboardText(lead: BusinessLead) {
  return `${lead.name} | ${lead.address || "Endereço não informado"} | ${lead.phone ?? "Telefone não disponível"}`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getPricingForNiche(niche: string, city: string) {
  const premiumCities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Brasília", "Manaus", "Porto Alegre"];
  const multiplier = premiumCities.includes(city) ? 1.25 : 1;
  const baseByNiche: Record<string, number> = {
    barbearia: 1200,
    "salão de beleza": 1400,
    "clínica odontológica": 2200,
    "oficina mecânica": 1600,
    restaurante: 1800,
    pizzaria: 1800,
    academia: 2000,
    estética: 1800,
    "pet shop": 1500,
    "loja de roupas": 1400,
    "lava jato": 1200,
    imobiliária: 2600,
    escola: 2400,
    mercadinho: 1500,
    farmácia: 1900,
    supermercado: 2400,
    padaria: 1400,
    dentista: 2200,
    veterinário: 2100,
    contabilidade: 1700,
  };
  const base = Math.round((baseByNiche[niche] ?? 1500) * multiplier);

  return {
    basic: base,
    pro: base + 900,
    premium: base + 2200,
    discount: Math.round(base * 0.12),
  };
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function leadLabel(lead: BusinessLead | null, fallbackNiche: string, fallbackCity: string) {
  if (!lead) {
    return `${fallbackNiche} em ${fallbackCity || "sua cidade"}`;
  }

  return `${lead.name} (${lead.niche} em ${lead.city})`;
}

function generateAssistantReply(message: string, context: AssistantContext) {
  const normalized = message.toLocaleLowerCase("pt-BR");
  const lead = context.selectedLead;
  const niche = lead?.niche ?? context.selectedNiche;
  const city = lead?.city ?? context.selectedCity;
  const pricing = getPricingForNiche(niche, city);
  const target = leadLabel(lead, niche, city);

  if (normalized.includes("preç") || normalized.includes("precific") || normalized.includes("valor")) {
    return `Precificação recomendada para ${target}:

- Site básico: ${money(pricing.basic)}
- Site profissional com copy, fotos e WhatsApp: ${money(pricing.pro)}
- Site premium com páginas extras, SEO local e suporte de ativação: ${money(pricing.premium)}

Sugestão de negociação: se o cliente pedir desconto, ofereça ${money(pricing.discount)} de desconto somente para fechar hoje, mantendo um plano de manutenção mensal entre R$ 97 e R$ 197.

Oferta mais fácil de vender: comece pelo pacote profissional. Ele parece completo sem assustar no preço.`;
  }

  if (normalized.includes("mensagem") || normalized.includes("whatsapp") || normalized.includes("abordagem")) {
    const name = lead?.name ?? "sua empresa";
    return `Mensagens prontas para ${name}:

1. Abordagem leve:
Olá, tudo bem? Encontrei a ${name} no mapa e preparei uma ideia de site profissional para ajudar clientes a entenderem melhor os serviços e chamarem direto no WhatsApp. Posso te enviar o modelo?

2. Abordagem de valor:
Vi que muitos clientes procuram ${niche} pelo celular. Um site simples, rápido e com botão de WhatsApp pode transformar essa procura em contato. Quer ver um exemplo pronto?

3. Follow-up:
Passando só para confirmar se você conseguiu ver minha mensagem. Posso te mandar um modelo visual sem compromisso para você avaliar?`;
  }

  if (normalized.includes("estratég") || normalized.includes("venda") || normalized.includes("vender")) {
    return `Estratégia de venda para ${target}:

Prioridade 1: vender clareza. Mostre que o site organiza serviços, endereço, telefone e WhatsApp em um só lugar.

Prioridade 2: vender confiança. Negócio local sem site perde autoridade quando o cliente pesquisa antes de chamar.

Prioridade 3: vender velocidade. Prometa um modelo pronto para análise e personalização rápida, sem complicar com tecnologia.

Próximo passo sugerido: copie uma mensagem curta, envie no WhatsApp e salve o lead em "Meus Leads" para acompanhar depois.`;
  }

  if (normalized.includes("domínio") || normalized.includes("dns") || normalized.includes("hosped")) {
    return `Guia de domínio e hospedagem:

1. Compre ou confirme o domínio do cliente, de preferência em Registro.br ou no provedor escolhido.
2. Defina a hospedagem. Para site institucional, Vercel, Hostinger ou Hostgator resolvem bem.
3. Aponte o DNS para a hospedagem.
4. Ative HTTPS/SSL.
5. Crie um email profissional se o cliente quiser, como contato@empresa.com.br.

Texto para explicar ao cliente: "Depois da aprovação, eu conecto seu domínio próprio e deixo o site funcionando com HTTPS. O DNS pode levar algumas horas para propagar."`;
  }

  if (normalized.includes("entrega") || normalized.includes("documentação") || normalized.includes("cliente")) {
    return `Documentação de entrega para ${target}:

- Link do site: ${context.latestSite?.publicUrl ?? "adicione o link publicado"}
- WhatsApp principal: ${lead?.phone ?? "confirmar com o cliente"}
- Endereço: ${lead?.address || "confirmar endereço final"}
- Status: site pronto para revisão

Checklist antes de entregar:
1. Conferir nome final da empresa.
2. Validar telefone e WhatsApp.
3. Revisar endereço e mapa.
4. Trocar cores/fotos se o cliente pedir.
5. Enviar link final e proposta de ativação.`;
  }

  if (normalized.includes("como") || normalized.includes("usar") || normalized.includes("salvar") || normalized.includes("buscar")) {
    return `Como usar o WebLeads:

1. Escolha estado, cidade, nicho e raio.
2. Clique em Buscar.
3. Use "Somente sem site" para focar nos melhores leads.
4. No card do lead, clique em "Salvar" para guardar em Meus Leads.
5. Clique em "Gerar Site" para abrir o editor e criar uma proposta visual.
6. Use "Copiar" ou "Abrir WhatsApp" somente quando quiser abordar manualmente.

Contexto atual: ${context.visibleLeadsCount} leads visíveis e ${context.savedLeadsCount} leads salvos.`;
  }

  return `Posso ajudar com esse lead e com sua venda.

Contexto atual: ${target}
Leads visíveis: ${context.visibleLeadsCount}
Leads salvos: ${context.savedLeadsCount}

Você pode me pedir:
- Precificar site
- Gerar mensagem para WhatsApp
- Criar estratégia de venda
- Explicar como usar o WebLeads
- Montar checklist de domínio, hospedagem e entrega`;
}

export function LeadMapApp() {
  const router = useRouter();
  const [selectedState, setSelectedState] = useState("SP");
  const [selectedCity, setSelectedCity] = useState("São Paulo");
  const [selectedCityCoordinates, setSelectedCityCoordinates] = useState<MapCenter | null>(null);
  const [isLocatingCity, setIsLocatingCity] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<(typeof NICHES)[number]>("barbearia");
  const [selectedProvider, setSelectedProvider] = useState<DataProviderSource>("osm");
  const [searchMode, setSearchMode] = useState<"city" | "map">("city");
  const [manualCenter, setManualCenter] = useState<MapCenter | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [onlyWithoutSite, setOnlyWithoutSite] = useState(true);
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null);
  const [searchesRemaining, setSearchesRemaining] = useState<number | null>(null);
  const [source, setSource] = useState<SearchResponse["source"] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingSite, setIsSavingSite] = useState(false);
  const [generatingLandingKey, setGeneratingLandingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generator, setGenerator] = useState<GeneratorState | null>(null);
  const [siteHistory, setSiteHistory] = useState<SiteHistory>({});
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activePanel, setActivePanel] = useState<"results" | "saved">("results");
  const [lastSearchWasLocalCache, setLastSearchWasLocalCache] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);

  const state = useMemo(
    () => STATES.find((item) => item.uf === selectedState) ?? STATES[0],
    [selectedState],
  );

  const visibleLeads = useMemo(
    () => leads.filter((lead) => (onlyWithoutSite ? !lead.hasWebsite : true)),
    [leads, onlyWithoutSite],
  );

  const totals = useMemo(
    () => ({
      all: leads.length,
      withoutSite: leads.filter((lead) => !lead.hasWebsite).length,
    }),
    [leads],
  );

  useEffect(() => {
    setSavedLeads(safeReadJson<SavedLead[]>(SAVED_LEADS_KEY, []));
    setAssistantMessages(safeReadJson<AssistantMessage[]>(ASSISTANT_MESSAGES_KEY, []));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    safeWriteJson(SAVED_LEADS_KEY, savedLeads);
  }, [savedLeads, storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    safeWriteJson(ASSISTANT_MESSAGES_KEY, assistantMessages.slice(-30));
  }, [assistantMessages, storageReady]);

  const assistantContext = useMemo<AssistantContext>(() => {
    const latestSite =
      selectedLead ? (siteHistory[leadKey(selectedLead)] ?? [])[0] ?? null : null;

    return {
      selectedLead,
      selectedNiche,
      selectedCity,
      selectedState,
      savedLeadsCount: savedLeads.length,
      visibleLeadsCount: visibleLeads.length,
      totalLeadsCount: leads.length,
      latestSite,
    };
  }, [leads.length, savedLeads.length, selectedCity, selectedLead, selectedNiche, selectedState, siteHistory, visibleLeads.length]);

  const locateCity = useCallback(async (cityName = selectedCity, stateUf = selectedState) => {
    if (!cityName || !stateUf) {
      setSelectedCityCoordinates(null);
      return null;
    }

    setIsLocatingCity(true);

    try {
      const cityRecord =
        STATES.find((item) => item.uf === stateUf)?.cities.find((city) => city.name === cityName) ?? null;
      const response = await fetch("/api/geocode/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityName,
          state: stateUf,
          ibgeCode: cityRecord?.ibgeCode,
        }),
      });
      const payload = (await response.json()) as {
        latitude?: number;
        longitude?: number;
        error?: string;
      };

      if (!response.ok || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
        throw new Error(payload.error ?? "Não foi possível localizar essa cidade no mapa.");
      }

      const coordinates = {
        lat: Number(payload.latitude),
        lng: Number(payload.longitude),
      };
      setSelectedCityCoordinates(coordinates);
      return coordinates;
    } catch (locateError) {
      setSelectedCityCoordinates(null);
      setError(locateError instanceof Error ? locateError.message : "Não foi possível localizar essa cidade no mapa.");
      return null;
    } finally {
      setIsLocatingCity(false);
    }
  }, [selectedCity, selectedState]);

  useEffect(() => {
    if (searchMode !== "city") {
      return;
    }

    let ignore = false;

    async function locateSelectedCity() {
      const coordinates = await locateCity();

      if (ignore || !coordinates) {
        return;
      }
    }

    void locateSelectedCity();

    return () => {
      ignore = true;
    };
  }, [locateCity, searchMode, selectedCity, selectedState]);

  async function runSearch(refresh = false) {
    setIsSearching(true);
    setError(null);
    setSelectedLead(null);
    setLastSearchWasLocalCache(false);

    try {
      const cityName = selectedCity;

      if (!selectedNiche) {
        throw new Error("Preencha a cidade e o nicho.");
      }

      if (searchMode === "city" && !cityName) {
        throw new Error("Preencha a cidade e o nicho.");
      }

      const exactCity =
        searchMode === "city"
          ? state.cities.find((city) => city.name === cityName)
          : null;

      if (searchMode === "city" && !exactCity) {
        throw new Error("Não encontramos essa cidade. Verifique o nome.");
      }

      const cacheKey =
        searchMode === "city"
          ? makeSearchCacheKey({
              provider: selectedProvider,
              state: selectedState,
              city: exactCity?.name ?? cityName,
              niche: selectedNiche,
              radiusKm: normalizeRadiusKm(radiusKm),
            })
          : null;

      if (cacheKey && !refresh) {
        const cached = readSearchCache(cacheKey);

        if (cached) {
          setLeads(cached.businesses);
          setSearchesRemaining(cached.creditsRemaining);
          setSource("cache");
          setLastSearchWasLocalCache(true);
          setSiteHistory({});
          setActivePanel("results");
          return;
        }
      }

      if (exactCity && exactCity.name !== selectedCity) {
        setSelectedCity(exactCity.name);
      }

      const cityCoordinates =
        searchMode === "city"
          ? selectedCityCoordinates ?? (await locateCity(exactCity?.name ?? cityName, selectedState))
          : null;

      if (searchMode === "city" && !cityCoordinates) {
        throw new Error("Não encontramos essa cidade. Verifique o nome.");
      }

      if (searchMode === "map" && !manualCenter) {
        throw new Error("Clique no mapa para escolher uma área de busca.");
      }

      const response = await fetch("/api/osm/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          searchType: searchMode,
          state: searchMode === "city" ? selectedState : undefined,
          city: searchMode === "city" ? exactCity?.name ?? cityName : undefined,
          niche: selectedNiche,
          radiusKm: normalizeRadiusKm(radiusKm),
          centerLat: searchMode === "map" ? manualCenter?.lat : cityCoordinates?.lat,
          centerLng: searchMode === "map" ? manualCenter?.lng : cityCoordinates?.lng,
          refresh,
        }),
      });

      const payload = (await response.json()) as SearchResponse & { error?: string };

      if (!response.ok) {
        const message = payload.error ?? "Não foi possível buscar empresas agora.";
        throw new Error(message.includes("demor") || message.includes("Timeout") ? "A busca demorou demais. Tente um raio menor." : message);
      }

      setLeads(payload.businesses);
      setSearchesRemaining(payload.creditsRemaining);
      setSource(payload.source);
      setSiteHistory({});
      setActivePanel("results");

      if (cacheKey) {
        writeSearchCache(cacheKey, payload);
      }
    } catch (searchError) {
      const message = searchError instanceof Error ? searchError.message : "Erro inesperado.";
      setError(message.includes("Failed to fetch") ? "Verifique sua conexão e tente novamente." : message);
    } finally {
      setIsSearching(false);
    }
  }

  async function fetchLeadSites(lead: BusinessLead) {
    const key = leadKey(lead);

    try {
      const response = await fetch(`/api/generated-sites?osmId=${lead.osmId}&osmType=${lead.osmType}`);
      const payload = (await response.json()) as { sites?: GeneratedSite[] };
      setSiteHistory((current) => ({ ...current, [key]: payload.sites ?? [] }));
      return payload.sites ?? [];
    } catch {
      setSiteHistory((current) => ({ ...current, [key]: [] }));
      return [];
    }
  }

  // Deprecated modal flow kept for compatibility while /site-builder owns the active site flow.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function openLandingGenerator(lead: BusinessLead, type: LandingTemplateType = "profissional") {
    const variations = buildLandingVariations(lead);
    const selected = variations.find((variation) => variation.type === type) ?? variations[0];
    setGenerator({
      lead,
      variations,
      draft: variationToDraft(selected, lead),
      previewSite: null,
    });
    await fetchLeadSites(lead);
  }

  function openSiteBuilder(lead: BusinessLead) {
    const businessId = siteBuilderKey(lead);
    try {
      sessionStorage.setItem(`site-builder:${businessId}`, JSON.stringify(lead));
    } catch (storageError) {
      console.warn("WebLeads session storage write failed:", storageError);
      setError("Não foi possível abrir o editor agora. Recarregue a página e tente novamente.");
      return;
    }
    router.push(`/site-builder/${businessId}`);
  }

  function openAiSiteCreator(lead: BusinessLead) {
    const businessId = siteBuilderKey(lead);
    try {
      sessionStorage.setItem(`site-builder:${businessId}`, JSON.stringify(lead));
    } catch (storageError) {
      console.warn("WebLeads session storage write failed:", storageError);
      setError("Não foi possível abrir o criador de site agora. Recarregue a página e tente novamente.");
      return;
    }
    router.push(`/criar-site/${businessId}`);
  }

  async function openSiteEditor(lead: BusinessLead, site: GeneratedSite) {
    const variations = buildLandingVariations(lead);
    setGenerator({
      lead,
      variations,
      draft: siteToDraft(site),
      previewSite: site,
    });
    await fetchLeadSites(lead);
  }

  function chooseVariation(variation: LandingVariation) {
    setGenerator((current) =>
      current
        ? {
            ...current,
            draft: variationToDraft(variation, current.lead),
            previewSite: null,
          }
        : current,
    );
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  }

  function sendAssistantMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    const now = new Date().toISOString();
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: now,
    };
    const assistantMessage: AssistantMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: generateAssistantReply(trimmed, assistantContext),
      createdAt: now,
    };

    setAssistantMessages((current) => [...current, userMessage, assistantMessage].slice(-30));
    setAssistantOpen(true);
  }

  function clearAssistantHistory() {
    setAssistantMessages([]);
    localStorage.removeItem(ASSISTANT_MESSAGES_KEY);
  }

  function saveLead(lead: BusinessLead) {
    setSavedLeads((current) => {
      if (current.some((saved) => leadKey(saved) === leadKey(lead))) {
        return current;
      }

      return [{ ...lead, savedAt: new Date().toISOString() }, ...current];
    });
    setCopiedKey(`save-${leadKey(lead)}`);
    window.setTimeout(() => setCopiedKey(null), 1600);
  }

  function removeSavedLead(lead: BusinessLead) {
    setSavedLeads((current) => current.filter((saved) => leadKey(saved) !== leadKey(lead)));
  }

  function exportSavedLeads() {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `webleads-${selectedNiche}-${selectedCity || "leads"}-${date}.csv`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.-]+/g, "-");

    downloadCsv(filename, [
      ["Nome", "Endereço", "Telefone", "Nicho", "Cidade", "Data"],
      ...savedLeads.map((lead) => [
        lead.name,
        lead.address,
        lead.phone ?? "",
        lead.niche,
        lead.city,
        new Date(lead.savedAt).toLocaleString("pt-BR"),
      ]),
    ]);
  }

  async function saveGeneratedSite() {
    if (!generator) {
      return;
    }

    setIsSavingSite(true);
    setError(null);

    try {
      const isEditing = Boolean(generator.previewSite);
      const response = await fetch(isEditing ? `/api/generated-sites/${generator.previewSite?.id}` : "/api/generated-sites", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? {} : { business: generator.lead }),
          templateType: generator.draft.templateType,
          visualStyle: generator.draft.visualStyle,
          buttonStyle: generator.draft.buttonStyle,
          title: generator.draft.title,
          subtitle: generator.draft.subtitle,
          description: generator.draft.description,
          services: generator.draft.services.split("\n").map((item) => item.trim()).filter(Boolean),
          benefits: generator.draft.benefits.split("\n").map((item) => item.trim()).filter(Boolean),
          ctaText: generator.draft.ctaText,
          ctaFinal: generator.draft.ctaFinal,
          phone: generator.draft.phone || null,
          address: generator.draft.address,
          primaryColor: generator.draft.primaryColor,
          accentColor: generator.draft.accentColor,
          showMap: generator.draft.showMap,
          showAbout: generator.draft.showAbout,
          showBenefits: generator.draft.showBenefits,
          status: "publicado",
        }),
      });

      const payload = (await response.json()) as { site?: GeneratedSite; error?: string };

      if (!response.ok || !payload.site) {
        throw new Error(payload.error ?? "Não foi possível salvar o site.");
      }

      setGenerator((current) => (current ? { ...current, previewSite: payload.site ?? null } : current));
      setSiteHistory((current) => ({
        ...current,
        [leadKey(generator.lead)]: isEditing
          ? (current[leadKey(generator.lead)] ?? []).map((site) =>
              site.id === payload.site?.id ? (payload.site as GeneratedSite) : site,
            )
          : [payload.site as GeneratedSite, ...(current[leadKey(generator.lead)] ?? [])],
      }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro inesperado.");
    } finally {
      setIsSavingSite(false);
    }
  }

  return (
    <main className="premium-shell flex min-h-screen flex-col">
      <header className="border-b border-white/10 bg-[#070a12]/82 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#6ee7ff]">
                <MapPin className="size-4" />
                OpenStreetMap + sites automáticos
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-normal text-white">Mapa de Leads Sem Site</h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Metric label="Leads" value={totals.all} />
              <Metric label="Sem site" value={totals.withoutSite} tone="hot" />
              <Metric label="Buscas" value={searchesRemaining ?? "Config."} />
            </div>
          </div>

          <div className="premium-panel-soft flex flex-wrap gap-2 rounded-xl p-1">
            <button
              className={`h-10 rounded-lg px-4 text-sm font-bold transition-colors ${searchMode === "city" ? "bg-[#6ee7ff] text-[#06101d] shadow-[0_10px_24px_rgba(33,212,253,0.18)]" : "text-[#9fb3c8] hover:bg-white/6 hover:text-white"}`}
              onClick={() => setSearchMode("city")}
            >
              Buscar por cidade
            </button>
            <button
              className={`h-10 rounded-lg px-4 text-sm font-bold transition-colors ${searchMode === "map" ? "bg-[#6ee7ff] text-[#06101d] shadow-[0_10px_24px_rgba(33,212,253,0.18)]" : "text-[#9fb3c8] hover:bg-white/6 hover:text-white"}`}
              onClick={() => setSearchMode("map")}
            >
              Selecionar no mapa
            </button>
          </div>

          <section
            className={`premium-panel rounded-2xl p-4 ${searchMode === "city" ? "grid gap-3 xl:grid-cols-[110px_minmax(220px,1fr)_180px_220px_minmax(180px,0.8fr)_auto]" : "grid gap-3 xl:grid-cols-[1fr_180px_1fr_auto_auto]"}`}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void runSearch(false);
              }
            }}
          >
            <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
              Fonte de dados
              <select
                className="field h-11"
                value={selectedProvider}
                onChange={(event) => setSelectedProvider(event.target.value as DataProviderSource)}
              >
                {DATA_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-xs font-medium text-[#8fa3ba]">
                {DATA_SOURCE_OPTIONS.find((option) => option.value === selectedProvider)?.helper}
              </span>
            </label>

            {searchMode === "city" ? (
              <>
                <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
                  Estado
                  <select
                    className="field h-11"
                    value={selectedState}
                    onChange={(event) => {
                      const nextState = event.target.value;
                      const nextCities = STATES.find((item) => item.uf === nextState)?.cities ?? [];
                      setSelectedState(nextState);
                      setSelectedCity(nextCities[0]?.name ?? "");
                      setSelectedCityCoordinates(null);
                    }}
                  >
                    {STATES.map((item) => (
                      <option key={item.uf} value={item.uf}>
                        {item.uf}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
                  Cidade
                  <select
                    className="field h-11"
                    value={selectedCity}
                    onChange={(event) => {
                      setSelectedCity(event.target.value);
                      setSelectedCityCoordinates(null);
                    }}
                  >
                    {state.cities.map((city) => (
                      <option key={city.ibgeCode} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-medium text-[#8fa3ba]">
                    {isLocatingCity
                      ? "Localizando cidade no mapa..."
                      : selectedCityCoordinates
                        ? `Cidade selecionada: ${selectedCity} - ${selectedState}`
                        : "Aguardando coordenadas da cidade."}
                  </span>
                </label>
              </>
            ) : (
              <div className="premium-panel-soft rounded-xl px-3 py-2 text-sm text-[#dceeff]">
                <div className="font-bold text-[#6ee7ff]">Clique no mapa para escolher a área de busca</div>
                <div className="mt-1">
                  {manualCenter
                    ? `Centro: ${manualCenter.lat.toFixed(5)}, ${manualCenter.lng.toFixed(5)}`
                    : "Nenhum ponto selecionado ainda."}
                </div>
                <div className="mt-1 text-[#95a7bd]">Buscando em um raio de {radiusKm} km.</div>
              </div>
            )}

            <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
              Nicho
              <select
                className="field h-11"
                value={selectedNiche}
                onChange={(event) => setSelectedNiche(event.target.value as (typeof NICHES)[number])}
              >
                {NICHES.map((niche) => {
                  return (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#b8c7da]">
              Raio: {radiusKm}km
              <input
                className="h-11 accent-[#6ee7ff]"
                min={MIN_RADIUS_KM}
                max={MAX_RADIUS_KM}
                step={1}
                type="range"
                value={radiusKm}
                onChange={(event) => setRadiusKm(normalizeRadiusKm(event.target.value))}
              />
            </label>

            {searchMode === "map" ? (
              <div className="grid gap-2">
                <input
                  aria-label="Raio de busca em km"
                  className="mt-6 accent-[#6ee7ff]"
                  min={MIN_RADIUS_KM}
                  max={MAX_RADIUS_KM}
                  step={1}
                  type="range"
                  value={radiusKm}
                  onChange={(event) => setRadiusKm(normalizeRadiusKm(event.target.value))}
                />
                <div className="flex flex-wrap gap-1">
                  {QUICK_RADIUS_OPTIONS.map((radius) => (
                    <button
                      key={radius}
                      className="rounded-md border border-[#6ee7ff]/20 bg-white/5 px-2 py-1 text-xs font-bold text-[#dceeff] transition-colors hover:border-[#6ee7ff]/45 hover:bg-[#6ee7ff]/10"
                      onClick={() => setRadiusKm(radius)}
                    >
                      {radius} km
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#6ee7ff]/30 bg-[#21d4fd] px-4 text-sm font-black text-[#06101d] shadow-[0_6px_0_#087392,0_18px_34px_rgba(33,212,253,0.18)] transition-colors hover:bg-[#6ee7ff] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 2xl:self-end"
              onClick={() => runSearch(false)}
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {isSearching ? "Buscando..." : "Buscar"}
            </button>

            <button
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#6ee7ff]/20 bg-white/5 px-4 text-sm font-semibold text-[#dceeff] transition-colors hover:border-[#6ee7ff]/45 hover:bg-white/10 2xl:self-end"
              onClick={() => runSearch(true)}
              disabled={isSearching}
              title="Ignora cache e conta no limite diário"
            >
              <RefreshCw className="size-4" />
              Atualizar busca
            </button>
          </section>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[3fr_2fr]">
        <div className="premium-panel min-h-[54vh] overflow-hidden rounded-2xl p-2 lg:min-h-0">
          <LeafletMap
            leads={visibleLeads}
            cityCenter={selectedCityCoordinates}
            hasSearched={Boolean(source)}
            isLoading={isSearching}
            manualCenter={manualCenter}
            manualMode={searchMode === "map"}
            radiusKm={radiusKm}
            selectedLead={selectedLead}
            onManualCenterChange={setManualCenter}
            onSelectLead={setSelectedLead}
          />
        </div>

        <aside className="premium-panel flex max-h-[calc(100vh-196px)] min-h-[480px] flex-col overflow-hidden rounded-2xl">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {activePanel === "saved" ? "Meus Leads" : "Leads encontrados"}
                </h2>
                <p className="mt-1 text-sm text-[#95a7bd]">
                  {lastSearchWasLocalCache || source === "cache"
                    ? "⚡ Cache local"
                    : source === "overpass"
                      ? "Dados novos do OpenStreetMap"
                      : source === "foursquare"
                        ? "Dados novos do Foursquare"
                        : source === "google"
                          ? "Google Places ainda não configurado"
                          : "Faça uma busca manual"}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  className={`h-10 rounded-lg border px-3 text-sm font-bold transition-colors ${activePanel === "results" ? "border-[#6ee7ff]/35 bg-[#6ee7ff]/12 text-[#dceeff]" : "border-[#6ee7ff]/14 bg-white/5 text-[#95a7bd] hover:bg-white/10"}`}
                  onClick={() => setActivePanel("results")}
                >
                  Resultados {visibleLeads.length ? `(${visibleLeads.length})` : ""}
                </button>
                <button
                  className={`h-10 rounded-lg border px-3 text-sm font-bold transition-colors ${activePanel === "saved" ? "border-[#6ee7ff]/35 bg-[#6ee7ff]/12 text-[#dceeff]" : "border-[#6ee7ff]/14 bg-white/5 text-[#95a7bd] hover:bg-white/10"}`}
                  onClick={() => setActivePanel("saved")}
                >
                  Meus Leads ({savedLeads.length})
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  onlyWithoutSite
                    ? "border-[#f472b6]/38 bg-[#f472b6]/14 text-[#ffd4e8]"
                    : "border-[#6ee7ff]/20 bg-white/5 text-[#dceeff] hover:border-[#6ee7ff]/42 hover:bg-white/10"
                }`}
                onClick={() => setOnlyWithoutSite((value) => !value)}
              >
                <SlidersHorizontal className="size-4" />
                Somente sem site
              </button>
              {lastSearchWasLocalCache ? (
                <button
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#6ee7ff]/20 bg-white/5 px-3 text-xs font-semibold text-[#dceeff] transition-colors hover:bg-white/10"
                  onClick={() => runSearch(true)}
                >
                  <RefreshCw className="size-4" />
                  Atualizar
                </button>
              ) : null}
              {activePanel === "saved" ? (
                <button
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#6ee7ff]/20 bg-white/5 px-3 text-xs font-semibold text-[#dceeff] transition-colors hover:bg-white/10 disabled:opacity-50"
                  disabled={!savedLeads.length}
                  onClick={exportSavedLeads}
                >
                  <Download className="size-4" />
                  Exportar CSV
                </button>
              ) : null}
            </div>
            {error ? (
              <div className="mt-3 rounded-md border border-[#f472b6]/35 bg-[#f472b6]/12 px-3 py-2 text-sm text-[#ffd4e8]">
                {error}
              </div>
            ) : null}
            {selectedLead ? (
              <div className="mt-3 rounded-lg border border-[#6ee7ff]/18 bg-[#07101f]/72 p-3 text-sm text-[#dceeff]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">{selectedLead.name}</div>
                    <div className="mt-1 text-xs text-[#95a7bd]">
                      {selectedLead.city} - {selectedLead.state} · {selectedLead.category ?? selectedLead.niche}
                    </div>
                  </div>
                  <button
                    className="rounded-md border border-[#6ee7ff]/20 px-2 py-1 text-xs font-bold text-[#dceeff] transition-colors hover:bg-white/10"
                    onClick={() => setSelectedLead(null)}
                  >
                    Fechar
                  </button>
                </div>
                <div className="mt-3 grid gap-2 text-xs">
                  <div><strong>Telefone:</strong> {selectedLead.phone ?? "Não disponível"}</div>
                  <div><strong>Endereço:</strong> {selectedLead.address || "Não informado"}</div>
                  <div><strong>Coordenadas:</strong> {selectedLead.latitude.toFixed(6)}, {selectedLead.longitude.toFixed(6)}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="scroll-stable min-h-0 flex-1 overflow-y-auto p-3">
            {activePanel === "saved" ? (
              savedLeads.length ? (
                <div className="grid gap-3">
                  {savedLeads.map((lead) => (
                    <SavedLeadCard
                      key={leadKey(lead)}
                      lead={lead}
                      copiedKey={copiedKey}
                      onCopy={(key, text) => copyText(key, text)}
                      onRemove={() => removeSavedLead(lead)}
                      onSelect={() => {
                        setSelectedLead(lead);
                        setActivePanel("results");
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="Nenhum lead salvo ainda." description="Salve leads úteis para montar sua lista de prospecção." />
              )
            ) : isSearching ? (
              <LeadSkeletonList />
            ) : visibleLeads.length ? (
              <div className="grid gap-3">
                {visibleLeads.map((lead) => {
                  const history = siteHistory[leadKey(lead)] ?? [];
                  const latestSite = history[0];

                  return (
                    <LeadCard
                      key={leadKey(lead)}
                      lead={lead}
                      selected={selectedLead?.osmId === lead.osmId && selectedLead?.osmType === lead.osmType}
                      latestSite={latestSite}
                      history={history}
                      copiedKey={copiedKey}
                      onSelect={() => {
                        setSelectedLead(lead);
                        void fetchLeadSites(lead);
                      }}
                      generatingAI={generatingLandingKey === leadKey(lead)}
                      onGenerateAI={() => openAiSiteCreator(lead)}
                      onGenerate={() => openSiteBuilder(lead)}
                      onModels={() => openSiteBuilder(lead)}
                      onEditSite={(site) => openSiteEditor(lead, site)}
                      onDuplicateSite={() => openSiteBuilder(lead)}
                      onCopy={(key, text) => copyText(key, text)}
                      onSave={() => saveLead(lead)}
                      saved={savedLeads.some((saved) => leadKey(saved) === leadKey(lead))}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Nenhum lead para exibir." description="Escolha cidade, nicho e raio, depois faça uma busca manual." />
            )}
          </div>
        </aside>
      </section>

      {generator ? (
        <PremiumLandingGeneratorModal
          generator={generator}
          history={siteHistory[leadKey(generator.lead)] ?? []}
          isSaving={isSavingSite}
          copiedKey={copiedKey}
          onClose={() => setGenerator(null)}
          onChooseVariation={chooseVariation}
          onDraftChange={(draft) => setGenerator((current) => (current ? { ...current, draft } : current))}
          onSave={saveGeneratedSite}
          onCopy={(key, text) => copyText(key, text)}
        />
      ) : null}

      <AIAssistantWidget
        context={assistantContext}
        copiedKey={copiedKey}
        isOpen={assistantOpen}
        messages={assistantMessages}
        onClear={clearAssistantHistory}
        onClose={() => setAssistantOpen(false)}
        onCopy={(key, text) => copyText(key, text)}
        onOpen={() => setAssistantOpen(true)}
        onSend={sendAssistantMessage}
      />
    </main>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#6ee7ff]/22 bg-white/5 p-8 text-center">
      <div>
        <Building2 className="mx-auto size-9 text-[#6ee7ff]" />
        <p className="mt-3 text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-[#95a7bd]">{description}</p>
      </div>
    </div>
  );
}

function LeadSkeletonList() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="min-h-[180px] animate-pulse rounded-xl border border-[#6ee7ff]/14 bg-white/5 p-4">
          <div className="h-4 w-2/3 rounded bg-white/12" />
          <div className="mt-4 h-3 w-full rounded bg-white/10" />
          <div className="mt-2 h-3 w-4/5 rounded bg-white/10" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="h-9 rounded bg-white/10" />
            <div className="h-9 rounded bg-white/10" />
            <div className="h-9 rounded bg-white/10" />
            <div className="h-9 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedLeadCard({
  lead,
  copiedKey,
  onCopy,
  onRemove,
  onSelect,
}: {
  lead: SavedLead;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  return (
    <article className="rounded-xl border border-[#6ee7ff]/18 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">{lead.name}</h3>
          <p className="mt-1 text-xs leading-5 text-[#95a7bd]">{lead.address || "Endereço não informado"}</p>
          <p className="mt-1 text-xs font-semibold text-[#6ee7ff]">{lead.city} · {lead.niche}</p>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-black ${lead.hasWebsite ? "neon-badge" : "danger-badge"}`}>
          {lead.hasWebsite ? "TEM SITE" : "SEM SITE"}
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button className="mini-action" onClick={() => onCopy(`saved-copy-${leadKey(lead)}`, makeLeadClipboardText(lead))}>
          {copiedKey === `saved-copy-${leadKey(lead)}` ? "Copiado" : "Copiar"}
        </button>
        <button className="mini-action" onClick={onSelect}>Ver no mapa</button>
        <button className="mini-action border-[#f472b6]/28 text-[#ffd4e8]" onClick={onRemove}>
          <Trash2 className="size-3" />
          Remover
        </button>
      </div>
    </article>
  );
}

function AIAssistantWidget({
  context,
  copiedKey,
  isOpen,
  messages,
  onClear,
  onClose,
  onCopy,
  onOpen,
  onSend,
}: {
  context: AssistantContext;
  copiedKey: string | null;
  isOpen: boolean;
  messages: AssistantMessage[];
  onClear: () => void;
  onClose: () => void;
  onCopy: (key: string, text: string) => void;
  onOpen: () => void;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const suggestions = [
    "Precificar site",
    "Gerar mensagem",
    "Estratégia de venda",
    "Configurar domínio",
    "Como usar WebLeads",
  ];
  const intro = context.selectedLead
    ? `Analisando ${context.selectedLead.name}`
    : `${context.visibleLeadsCount} leads visíveis`;

  function submitMessage(message = draft) {
    onSend(message);
    setDraft("");
  }

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-[900] grid h-14 w-14 place-items-center rounded-2xl border border-[#6ee7ff]/35 bg-[#6366f1] text-white shadow-[0_18px_42px_rgba(99,102,241,0.38)] transition-transform hover:-translate-y-0.5"
        onMouseDown={onOpen}
        onClick={onOpen}
        onTouchStart={onOpen}
        style={{ bottom: 20, height: 56, right: 20, width: 56, zIndex: 900 }}
        title="Abrir Assistente IA"
      >
        <Sparkles className="size-6" />
      </button>

      {isOpen ? (
        <section
          className="fixed inset-x-0 bottom-0 z-[910] max-h-[92vh] overflow-hidden rounded-t-2xl border border-[#6ee7ff]/18 bg-[#07101f] shadow-2xl md:inset-y-4 md:left-auto md:right-4 md:w-[35vw] md:min-w-[420px] md:rounded-2xl"
          style={{ zIndex: 910 }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-[#6ee7ff]">
                <Sparkles className="size-4" />
                Assistente IA WebLeads
              </div>
              <p className="mt-1 text-xs text-[#95a7bd]">{intro} · {context.savedLeadsCount} salvos</p>
            </div>
            <div className="flex gap-2">
              <button className="mini-action" onClick={onClear}>Limpar</button>
              <button className="grid size-9 place-items-center rounded-lg border border-[#6ee7ff]/18 bg-white/5 text-[#dceeff]" onClick={onClose}>
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="scroll-stable max-h-[calc(92vh-190px)] overflow-y-auto p-4">
            <div className="grid gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-lg border border-[#6ee7ff]/16 bg-white/5 px-3 py-2 text-left text-xs font-bold text-[#dceeff] transition-colors hover:bg-[#6ee7ff]/10"
                  onClick={() => submitMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              {messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl border p-3 text-sm leading-6 ${
                      message.role === "assistant"
                        ? "border-[#6ee7ff]/18 bg-[#0b1728] text-[#dceeff]"
                        : "border-[#6366f1]/24 bg-[#6366f1]/12 text-white"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === "assistant" ? (
                      <button
                        className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-[#6ee7ff]/18 px-2 text-xs font-bold text-[#dceeff] transition-colors hover:bg-white/10"
                        onClick={() => onCopy(`ai-${message.id}`, message.content)}
                      >
                        <Copy className="size-3" />
                        {copiedKey === `ai-${message.id}` ? "Copiado" : "Copiar"}
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#6ee7ff]/20 bg-white/5 p-4 text-sm leading-6 text-[#95a7bd]">
                  Selecione um lead ou faça uma busca. Depois peça preço, mensagem, estratégia, domínio ou guia de entrega.
                </div>
              )}
            </div>
          </div>

          <form
            className="border-t border-white/10 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage();
            }}
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="field h-11"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Pergunte sobre preço, venda, domínio..."
              />
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6ee7ff] px-4 text-sm font-black text-[#06101d]" type="submit">
                <Send className="size-4" />
                Enviar
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone?: "hot" }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${tone === "hot" ? "border-[#f472b6]/30 bg-[#f472b6]/12" : "border-[#6ee7ff]/18 bg-white/5"}`}>
      <div className="text-xs font-medium text-[#95a7bd]">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function LeafletMap({
  leads,
  cityCenter,
  hasSearched,
  isLoading,
  manualCenter,
  manualMode,
  radiusKm,
  selectedLead,
  onManualCenterChange,
  onSelectLead,
}: {
  leads: BusinessLead[];
  cityCenter: MapCenter | null;
  hasSearched: boolean;
  isLoading: boolean;
  manualCenter: MapCenter | null;
  manualMode: boolean;
  radiusKm: number;
  selectedLead: BusinessLead | null;
  onManualCenterChange: (center: MapCenter) => void;
  onSelectLead: (lead: BusinessLead) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const manualLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const lastAreaKeyRef = useRef<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const L = await import("leaflet");
        leafletRef.current = L;

        if (!containerRef.current || cancelled || mapRef.current) {
          return;
        }

        const map = L.map(containerRef.current, {
          center: [-23.55052, -46.633308],
          zoom: 12,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        layerRef.current = L.layerGroup().addTo(map);
        manualLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      } catch (error) {
        setMapError(error instanceof Error ? error.message : "Não foi possível carregar o mapa.");
      }
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !manualMode) {
      return;
    }

    const handleClick = (event: Leaflet.LeafletMouseEvent) => {
      onManualCenterChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [manualMode, onManualCenterChange]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = manualLayerRef.current;

    if (!L || !map || !layer) {
      return;
    }

    layer.clearLayers();

    const activeCenter = manualMode ? manualCenter : cityCenter;

    if (!activeCenter) {
      lastAreaKeyRef.current = null;
      return;
    }

    const center: Leaflet.LatLngExpression = [activeCenter.lat, activeCenter.lng];
    const circle = L.circle(center, {
      radius: radiusKm * 1000,
      color: "#6ee7ff",
      weight: 2,
      opacity: 0.85,
      fillColor: "#a78bfa",
      fillOpacity: 0.1,
    });

    circle.addTo(layer);

    if (manualMode) {
      const marker = L.marker(center, {
        draggable: true,
        title: "Centro da busca",
        icon: L.divIcon({
          className: "manual-search-marker",
          html: '<span class="manual-search-marker-dot"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      });

      marker.on("dragend", () => {
        const next = marker.getLatLng();
        onManualCenterChange({ lat: next.lat, lng: next.lng });
      });

      marker.addTo(layer);
    }

    const areaKey = `${manualMode ? "map" : "city"}:${activeCenter.lat.toFixed(5)}:${activeCenter.lng.toFixed(5)}`;

    if (lastAreaKeyRef.current !== areaKey) {
      lastAreaKeyRef.current = areaKey;
      const zoom = manualMode ? Math.max(map.getZoom(), 14) : 12;
      map.flyTo(center, zoom, { duration: 0.7 });
    }
  }, [cityCenter, manualCenter, manualMode, onManualCenterChange, radiusKm]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!L || !map || !layer) {
      return;
    }

    layer.clearLayers();

    const drawableLeads = leads.filter((lead) => isValidCoordinate(lead.latitude, lead.longitude));

    if (!drawableLeads.length) {
      return;
    }

    const bounds = L.latLngBounds([]);

    drawableLeads.forEach((lead) => {
      const selected =
        selectedLead?.osmId === lead.osmId && selectedLead?.osmType === lead.osmType;
      const latitude = Number(lead.latitude);
      const longitude = Number(lead.longitude);
      const marker = L.circleMarker([latitude, longitude], {
        radius: selected ? 10 : 8,
        fillColor: lead.hasWebsite ? "#6ee7ff" : "#f472b6",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      });

      marker.bindTooltip(lead.name);
      marker.on("click", () => onSelectLead(lead));
      marker.addTo(layer);
      bounds.extend([latitude, longitude]);
    });

    if (drawableLeads.length === 1) {
      map.setView([Number(drawableLeads[0].latitude), Number(drawableLeads[0].longitude)], 16);
    } else {
      map.fitBounds(bounds, { padding: [42, 42] });
    }
  }, [leads, onSelectLead, selectedLead]);

  return (
    <div className="relative h-full min-h-[54vh] w-full overflow-hidden rounded-xl bg-[#0b1220]">
      <div ref={containerRef} className="h-full min-h-[54vh] w-full" />
      {mapError ? (
        <div className="absolute inset-4 grid place-items-center rounded-xl border border-[#f472b6]/35 bg-[#111827]/95 p-6 text-center backdrop-blur">
          <div>
            <MapPin className="mx-auto size-10 text-[#f472b6]" />
            <p className="mt-3 font-semibold text-white">Mapa indisponível</p>
            <p className="mt-2 max-w-md text-sm text-[#95a7bd]">{mapError}</p>
          </div>
        </div>
      ) : null}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-lg border border-[#6ee7ff]/20 bg-[#09111f]/90 p-2 text-xs font-medium text-[#dceeff] shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur">
        <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-[#f472b6]" />Sem site</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-[#6ee7ff]" />Com site</span>
      </div>
      {manualMode ? (
        <div className="absolute left-4 top-4 max-w-xs rounded-lg border border-[#6ee7ff]/22 bg-[#09111f]/90 p-3 text-xs font-semibold text-[#dceeff] shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur">
          {manualCenter
            ? `Área selecionada: ${manualCenter.lat.toFixed(5)}, ${manualCenter.lng.toFixed(5)} · raio ${radiusKm} km`
            : "Clique no mapa para escolher a área de busca"}
        </div>
      ) : null}
      {isLoading ? (
        <div className="absolute inset-0 z-[450] grid place-items-center bg-[#06101d]/28 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-lg border border-[#6ee7ff]/24 bg-[#09111f]/90 px-4 py-3 text-sm font-bold text-[#dceeff] shadow-2xl">
            <Loader2 className="size-4 animate-spin text-[#6ee7ff]" />
            Buscando leads no mapa...
          </div>
        </div>
      ) : null}
      {!isLoading && hasSearched && !leads.length ? (
        <div className="absolute left-1/2 top-1/2 z-[440] w-[min(360px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#f472b6]/30 bg-[#09111f]/94 p-5 text-center text-sm text-[#dceeff] shadow-2xl">
          <div className="font-black text-white">Nenhum lead encontrado nessa área.</div>
          <div className="mt-2 text-[#95a7bd]">Tente aumentar o raio ou mudar o nicho.</div>
        </div>
      ) : null}
    </div>
  );
}

function LeadCard({
  lead,
  selected,
  latestSite,
  history,
  copiedKey,
  generatingAI,
  onSelect,
  onGenerateAI,
  onGenerate,
  onModels,
  onEditSite,
  onDuplicateSite,
  onCopy,
  onSave,
  saved,
}: {
  lead: BusinessLead;
  selected: boolean;
  latestSite: GeneratedSite | undefined;
  history: GeneratedSite[];
  copiedKey: string | null;
  generatingAI: boolean;
  onSelect: () => void;
  onGenerateAI: () => void;
  onGenerate: () => void;
  onModels: () => void;
  onEditSite: (site: GeneratedSite) => void;
  onDuplicateSite: () => void;
  onCopy: (key: string, text: string) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const message = latestSite?.whatsappMessage ?? WHATSAPP_MESSAGE;
  const whatsappUrl = makeLeadWhatsappUrl(lead.phone, message);
  const leadDetails = [
    lead.name,
    lead.address ? `Endereço: ${lead.address}` : null,
    lead.phone ? `Telefone: ${lead.phone}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    `Cidade: ${lead.city} - ${lead.state}`,
    `Nicho: ${lead.niche}`,
    `Coordenadas: ${lead.latitude.toFixed(6)}, ${lead.longitude.toFixed(6)}`,
  ].filter(Boolean).join("\n");

  return (
    <article
      className={`min-h-[236px] rounded-xl border p-4 transition-colors ${
        selected
          ? "premium-card premium-card-selected"
          : lead.hasWebsite
            ? "premium-card"
            : "border-[#f472b6]/28 bg-[linear-gradient(145deg,rgba(42,20,44,0.78),rgba(11,16,30,0.88))] shadow-[0_14px_38px_rgba(0,0,0,0.3)]"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{lead.name}</h3>
          <p className="mt-1 text-xs leading-5 text-[#95a7bd]">{lead.address || "Endereço não informado"}</p>
          <p className="mt-1 text-xs font-medium text-[#6ee7ff]">{lead.city} · {lead.category ?? lead.niche}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
            lead.hasWebsite ? "neon-badge" : "danger-badge"
          }`}
        >
          {lead.hasWebsite ? "COM SITE" : "SEM SITE"}
        </span>
      </div>
      <div className="mt-2 inline-flex rounded-md border border-[#6ee7ff]/18 bg-white/5 px-2 py-1 text-[11px] font-bold uppercase tracking-normal text-[#95a7bd]">
        {lead.source === "foursquare" ? "Foursquare" : lead.source === "google" ? "Google Places" : "OpenStreetMap"}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-[#7f93aa]">Telefone</dt>
          <dd className="font-medium text-[#dceeff]">{lead.phone ?? "Não disponível"}</dd>
        </div>
        <div>
          <dt className="text-[#7f93aa]">Email</dt>
          <dd className="break-all font-medium text-[#dceeff]">{lead.email ?? "Não disponível"}</dd>
        </div>
      </dl>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button className="lead-action" onClick={(event) => { event.stopPropagation(); void onCopy(`lead-${leadKey(lead)}`, makeLeadClipboardText(lead)); }}>
          <Copy className="size-4" />
          {copiedKey === `lead-${leadKey(lead)}` ? "Copiado" : "Copiar"}
        </button>
        <button className="lead-action" onClick={(event) => { event.stopPropagation(); onSave(); }}>
          <Save className="size-4" />
          {saved || copiedKey === `save-${leadKey(lead)}` ? "Salvo" : "Salvar"}
        </button>
        <button
          className="lead-action border-[#c4b5fd]/35 bg-[#6366f1]/18 text-[#ecebff]"
          disabled={generatingAI}
          onClick={(event) => {
            event.stopPropagation();
            onGenerateAI();
          }}
        >
          {generatingAI ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {generatingAI ? "Abrindo..." : "Criar site com IA"}
        </button>
        <button
          className="lead-action"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          <MapPin className="size-4" />
          Ver no mapa
        </button>
        <button className="lead-action border-[#6ee7ff]/32 bg-[#21d4fd] text-[#06101d]" onClick={(event) => { event.stopPropagation(); onGenerate(); }}>
          <FilePlus2 className="size-4" />
          Gerar site manual
        </button>
        <button className="lead-action" onClick={(event) => { event.stopPropagation(); onModels(); }}>
          <Layers3 className="size-4" />
          Editar página
        </button>
        <button
          className="lead-action"
          disabled={!latestSite}
          onClick={(event) => {
            event.stopPropagation();
            if (latestSite) onEditSite(latestSite);
          }}
        >
          <Layers3 className="size-4" />
          Ver preview
        </button>
        <button
          className="lead-action"
          disabled={!latestSite}
          onClick={(event) => {
            event.stopPropagation();
            if (latestSite) void onCopy(`link-${latestSite.id}`, latestSite.publicUrl);
          }}
        >
          <Copy className="size-4" />
          {latestSite && copiedKey === `link-${latestSite.id}` ? "Link copiado" : "Copiar link"}
        </button>
        <button className="lead-action" onClick={(event) => { event.stopPropagation(); void onCopy(`msg-${leadKey(lead)}`, message); }}>
          <Copy className="size-4" />
          {copiedKey === `msg-${leadKey(lead)}` ? "Copiado" : "Copiar mensagem"}
        </button>
        <button
          className="lead-action"
          onClick={(event) => {
            event.stopPropagation();
            void onCopy(`phone-${leadKey(lead)}`, lead.phone ?? "Telefone não disponível");
          }}
        >
          <Copy className="size-4" />
          {copiedKey === `phone-${leadKey(lead)}` ? "Copiado" : "Copiar telefone"}
        </button>
        <button
          className="lead-action"
          onClick={(event) => {
            event.stopPropagation();
            void onCopy(`address-${leadKey(lead)}`, lead.address || `${lead.latitude}, ${lead.longitude}`);
          }}
        >
          <Copy className="size-4" />
          {copiedKey === `address-${leadKey(lead)}` ? "Copiado" : "Copiar endereço"}
        </button>
        <button
          className="lead-action"
          onClick={(event) => {
            event.stopPropagation();
            void onCopy(`details-${leadKey(lead)}`, leadDetails);
          }}
        >
          <Copy className="size-4" />
          {copiedKey === `details-${leadKey(lead)}` ? "Dados copiados" : "Copiar dados"}
        </button>
        {whatsappUrl ? (
          <a
            className="lead-action border-[#20b15a]/30 bg-[#20b15a]/18 text-[#d7ffe5]"
            href={whatsappUrl}
            rel="noreferrer"
            onClick={(event) => {
              event.stopPropagation();
              void navigator.clipboard.writeText([lead.phone, message].filter(Boolean).join("\n\n"));
            }}
          >
            <Send className="size-4" />
            Abrir WhatsApp
          </a>
        ) : (
          <button className="lead-action" onClick={(event) => { event.stopPropagation(); void onCopy(`msg-${leadKey(lead)}`, message); }}>
            <Copy className="size-4" />
            Sem telefone: copiar mensagem
          </button>
        )}
      </div>

      {history.length ? (
        <div className="mt-3 rounded-md border border-[#6ee7ff]/16 bg-white/5 p-3">
          <div className="text-xs font-semibold text-[#dceeff]">Histórico de sites</div>
          <div className="mt-2 grid gap-2">
            {history.slice(0, 3).map((site) => (
              <div key={site.id} className="grid gap-2 rounded-md bg-[#07101f]/70 p-2 text-xs text-[#dceeff]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{site.templateType}</span>
                  <span className="rounded bg-white/8 px-2 py-1">{site.status}</span>
                </div>
                <div className="text-[#95a7bd]">{new Date(site.createdAt).toLocaleDateString("pt-BR")}</div>
                <div className="grid grid-cols-4 gap-2">
                  <button className="mini-action" onClick={(event) => { event.stopPropagation(); void onCopy(`hist-link-${site.id}`, site.publicUrl); }}>Link</button>
                  <button className="mini-action" onClick={(event) => { event.stopPropagation(); void onCopy(`hist-msg-${site.id}`, siteMessage(site)); }}>Msg</button>
                  <button className="mini-action" onClick={(event) => { event.stopPropagation(); onEditSite(site); }}>Editar</button>
                  <button className="mini-action" onClick={(event) => { event.stopPropagation(); onDuplicateSite(); }}>Duplicar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

// Deprecated modal kept temporarily for compatibility while the premium modal owns the active flow.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LandingGeneratorModal({
  generator,
  history,
  isSaving,
  copiedKey,
  onClose,
  onChooseVariation,
  onDraftChange,
  onSave,
  onCopy,
}: {
  generator: GeneratorState;
  history: GeneratedSite[];
  isSaving: boolean;
  copiedKey: string | null;
  onClose: () => void;
  onChooseVariation: (variation: LandingVariation) => void;
  onDraftChange: (draft: SiteDraft) => void;
  onSave: () => void;
  onCopy: (key: string, text: string) => void;
}) {
  const { lead, draft, previewSite, variations } = generator;
  const services = draft.services.split("\n").map((item) => item.trim()).filter(Boolean);
  const benefits = draft.benefits.split("\n").map((item) => item.trim()).filter(Boolean);
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lead.longitude - 0.006}%2C${lead.latitude - 0.006}%2C${lead.longitude + 0.006}%2C${lead.latitude + 0.006}&layer=mapnik&marker=${lead.latitude}%2C${lead.longitude}`;
  const whatsappUrl = previewSite ? makeLeadWhatsappUrl(draft.phone, previewSite.whatsappMessage) : null;

  function update<K extends keyof SiteDraft>(key: K, value: SiteDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid bg-[#171a16]/55 p-4 xl:grid-cols-[520px_1fr]">
      <section className="min-h-0 overflow-y-auto rounded-l-md bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#171a16]">Gerar site</h2>
            <p className="mt-1 text-sm text-[#66705f]">{lead.name} · {lead.city} · {lead.hasWebsite ? "com site" : "sem site"}</p>
          </div>
          <button className="grid size-9 place-items-center rounded-md border border-[#d9ddd2]" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2 rounded-md border border-[#d9ddd2] bg-[#f8faf6] p-3 text-sm">
          <div><strong>Nicho:</strong> {lead.niche}</div>
          <div><strong>Endereço:</strong> {lead.address || "Não informado"}</div>
          <div><strong>Telefone:</strong> {lead.phone ?? "Não informado"}</div>
        </div>

        <h3 className="mt-5 text-sm font-semibold text-[#171a16]">Escolha um modelo</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {variations.map((variation) => (
            <button
              key={variation.type}
              className={`rounded-md border p-3 text-left text-xs transition ${
                draft.templateType === variation.type ? "border-[#1f7a62] bg-[#f1faf6]" : "border-[#d9ddd2] bg-white"
              }`}
              onClick={() => onChooseVariation(variation)}
            >
              <div className="font-semibold text-[#171a16]">{variation.name}</div>
              <div className="mt-2 h-2 rounded" style={{ backgroundColor: variation.primaryColor }} />
              <div className="mt-1 h-2 w-2/3 rounded" style={{ backgroundColor: variation.accentColor }} />
              <p className="mt-2 text-[#66705f]">{variation.subtitle}</p>
              <span className="mt-3 inline-flex rounded bg-white px-2 py-1 font-semibold">Usar este modelo</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Título"><input className="field" value={draft.title} onChange={(event) => update("title", event.target.value)} /></Field>
          <Field label="Subtítulo"><input className="field" value={draft.subtitle} onChange={(event) => update("subtitle", event.target.value)} /></Field>
          <Field label="Descrição"><textarea className="field min-h-28" value={draft.description} onChange={(event) => update("description", event.target.value)} /></Field>
          <Field label="Serviços"><textarea className="field min-h-28" value={draft.services} onChange={(event) => update("services", event.target.value)} /></Field>
          <Field label="Benefícios"><textarea className="field min-h-28" value={draft.benefits} onChange={(event) => update("benefits", event.target.value)} /></Field>
          <Field label="CTA principal"><input className="field" value={draft.ctaText} onChange={(event) => update("ctaText", event.target.value)} /></Field>
          <Field label="CTA final"><input className="field" value={draft.ctaFinal} onChange={(event) => update("ctaFinal", event.target.value)} /></Field>
          <Field label="WhatsApp"><input className="field" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cor principal"><input className="field h-11" type="color" value={draft.primaryColor} onChange={(event) => update("primaryColor", event.target.value)} /></Field>
            <Field label="Cor de destaque"><input className="field h-11" type="color" value={draft.accentColor} onChange={(event) => update("accentColor", event.target.value)} /></Field>
          </div>
        </div>

        <button
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1f7a62] px-4 text-sm font-semibold text-white hover:bg-[#17624f] disabled:opacity-60"
          disabled={isSaving}
          onClick={onSave}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
          Publicar site
        </button>

        {previewSite ? (
          <div className="mt-3 grid gap-2">
            <button className="lead-action" onClick={() => onCopy(`modal-link-${previewSite.id}`, previewSite.publicUrl)}>
              <Copy className="size-4" />
              {copiedKey === `modal-link-${previewSite.id}` ? "Link copiado" : "Copiar link da página"}
            </button>
            <button className="lead-action" onClick={() => onCopy(`modal-msg-${previewSite.id}`, previewSite.whatsappMessage)}>
              <Copy className="size-4" />
              {copiedKey === `modal-msg-${previewSite.id}` ? "Mensagem copiada" : "Copiar mensagem"}
            </button>
            {whatsappUrl ? (
              <a className="lead-action bg-[#f1faf6] text-[#17624f]" href={whatsappUrl} rel="noreferrer">
                <Send className="size-4" />
                Enviar no WhatsApp
              </a>
            ) : (
              <div className="rounded-md border border-[#e5b7a4] bg-[#fff5f0] px-3 py-2 text-xs text-[#8a2f13]">
                Este lead não possui telefone cadastrado. Copie a mensagem e envie manualmente.
              </div>
            )}
          </div>
        ) : null}

        {history.length ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Histórico deste lead</h3>
            <div className="mt-2 grid gap-2">
              {history.map((site) => (
                <div key={site.id} className="rounded-md border border-[#e1e5dc] p-3 text-xs">
                  <div className="flex justify-between gap-2"><strong>{site.templateType}</strong><span>{site.status}</span></div>
                  <div className="mt-1 text-[#66705f]">{new Date(site.createdAt).toLocaleString("pt-BR")}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button className="mini-action" onClick={() => onCopy(`modal-hist-link-${site.id}`, site.publicUrl)}>Link</button>
                    <button className="mini-action" onClick={() => onCopy(`modal-hist-msg-${site.id}`, site.whatsappMessage)}>Msg</button>
                    <a className="mini-action text-center" href={site.publicUrl} rel="noreferrer">Editar</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="min-h-0 overflow-y-auto rounded-r-md bg-[#fbfcf8] p-4">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-md border border-[#d9ddd2] bg-white shadow-sm">
          <div className="px-6 py-12 text-white" style={{ backgroundColor: draft.primaryColor }}>
            <p className="text-sm font-semibold" style={{ color: draft.accentColor }}>{lead.niche} · {draft.templateType}</p>
            <h3 className="mt-3 max-w-3xl text-4xl font-semibold">{draft.title}</h3>
            <p className="mt-4 max-w-2xl text-lg text-white/80">{draft.subtitle}</p>
            <a className="mt-6 inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-[#1d1a12]" style={{ backgroundColor: draft.accentColor }}>
              <MessageCircle className="size-4" />
              {draft.ctaText}
            </a>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
            <div>
              <h4 className="text-xl font-semibold text-[#171a16]">Sobre {lead.name}</h4>
              <p className="mt-3 leading-7 text-[#50594b]">{draft.description}</p>
              <h4 className="mt-8 text-xl font-semibold text-[#171a16]">Serviços</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {services.map((service) => <div key={service} className="rounded-md border border-[#d9ddd2] bg-[#f8faf6] p-3 text-sm font-medium">{service}</div>)}
              </div>
              <h4 className="mt-8 text-xl font-semibold text-[#171a16]">Benefícios</h4>
              <ul className="mt-3 grid gap-2">
                {benefits.map((benefit) => <li key={benefit} className="rounded-md bg-[#fff7ed] px-3 py-2 text-sm text-[#5e3a17]">{benefit}</li>)}
              </ul>
            </div>
            <div className="rounded-md border border-[#d9ddd2] bg-[#fbfcf8] p-4">
              <h4 className="font-semibold text-[#171a16]">Localização</h4>
              <p className="mt-3 text-sm text-[#50594b]">{lead.address || "Endereço a confirmar"}</p>
              <p className="mt-2 text-sm font-medium text-[#171a16]">{draft.phone || "Telefone a confirmar"}</p>
              <iframe className="mt-4 h-48 w-full rounded-md border border-[#d9ddd2]" src={mapEmbedUrl} title={`Mapa de ${lead.name}`} loading="lazy" />
            </div>
          </div>
          <div className="px-6 py-8 text-center" style={{ backgroundColor: draft.accentColor }}>
            <h4 className="text-2xl font-semibold text-[#1d1a12]">{draft.ctaFinal}</h4>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-[#40463d]">
      {label}
      {children}
    </label>
  );
}

