export type City = {
  id: number;
  name: string;
  ibgeCode: string;
};

export type StateWithCities = {
  id: number;
  uf: string;
  name: string;
  cities: City[];
};

export type LeadStatus =
  | "novo"
  | "prospectado"
  | "interessado"
  | "vendido"
  | "recusado";

export type LandingTemplateType = "profissional" | "oferta" | "premium";

export type GeneratedSiteStatus =
  | "rascunho"
  | "enviado"
  | "visualizado"
  | "aceito"
  | "aguardando_pagamento"
  | "em_personalizacao"
  | "publicado_definitivo"
  | "publicado"
  | "vendido"
  | "recusado"
  | "expirado";

export type LandingButtonStyle = "whatsapp" | "primary" | "secondary" | "premium";

export type LandingVisualStyle =
  | "claro"
  | "escuro"
  | "minimalista"
  | "gradiente"
  | "cartao";

export type BusinessLead = {
  id?: string;
  source?: DataProviderSource;
  osmId: string;
  osmType: "node" | "way" | "relation";
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  osmUrl: string;
  city: string;
  state: string;
  niche: string;
  hasWebsite: boolean;
  rawTags: Record<string, string>;
};

export type DataProviderSource = "osm" | "foursquare" | "google";

export type NormalizedPlace = {
  id: string;
  source: DataProviderSource;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  has_website: boolean;
  raw_data: Record<string, unknown>;
};

export type SearchResponse = {
  source: "cache" | "overpass" | DataProviderSource;
  provider: DataProviderSource;
  access?: {
    mode: "limited" | "full";
    status: "visitor" | "aguardando_pagamento" | "ativo" | "vencido" | "cancelado";
    canViewLeadDetails: boolean;
    canCreateLandingPage: boolean;
  };
  creditsRemaining: number | null;
  totalResults: number;
  totalWithoutWebsite: number;
  businesses: BusinessLead[];
};

export type LandingTemplate = {
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  benefits: string[];
  finalCall: string;
};

export type GeneratedSite = {
  id: string;
  businessId: string | null;
  businessOsmId: string;
  businessOsmType: string;
  businessName: string;
  siteName?: string;
  niche: string;
  city: string;
  templateType: LandingTemplateType;
  visualStyle: LandingVisualStyle;
  buttonStyle: LandingButtonStyle;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  benefits: string[];
  differentials?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  gallery?: string[];
  ctaText: string;
  ctaFinal: string;
  whatsappMessage: string;
  publicUrl: string;
  publicToken?: string | null;
  status: GeneratedSiteStatus;
  expiresAt?: string | null;
  isPublic?: boolean;
  phone: string | null;
  address: string;
  latitude: number;
  longitude: number;
  osmUrl: string;
  primaryColor: string;
  accentColor: string;
  paletteKey?: string;
  fontKey?: string;
  cardRadius?: number;
  showMap: boolean;
  showAbout: boolean;
  showBenefits: boolean;
  showFaq?: boolean;
  createdAt: string;
  updatedAt: string;
};
