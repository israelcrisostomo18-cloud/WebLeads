export type SitePaletteKey =
  | "professionalLight"
  | "premiumDark"
  | "localElegant"
  | "healthClean"
  | "beautySoft"
  | "foodWarm"
  | "autoStrong"
  | "institutional";

export type SitePalette = {
  key: SitePaletteKey;
  name: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  isDark: boolean;
};

export const sitePalettes: Record<SitePaletteKey, SitePalette> = {
  professionalLight: {
    key: "professionalLight",
    name: "Profissional claro",
    background: "#f6f8fb",
    surface: "#ffffff",
    surfaceAlt: "#eef4fb",
    text: "#111827",
    muted: "#5f6f82",
    primary: "#113a5c",
    secondary: "#2563eb",
    accent: "#38bdf8",
    border: "#d8e2ee",
    isDark: false,
  },
  premiumDark: {
    key: "premiumDark",
    name: "Premium escuro",
    background: "#080b12",
    surface: "#111827",
    surfaceAlt: "#172033",
    text: "#f8fbff",
    muted: "#a7b3c7",
    primary: "#6ee7ff",
    secondary: "#8b5cf6",
    accent: "#d6b35a",
    border: "rgba(255,255,255,0.13)",
    isDark: true,
  },
  localElegant: {
    key: "localElegant",
    name: "Elegante local",
    background: "#fbf7ee",
    surface: "#fffdf8",
    surfaceAlt: "#f2e7d2",
    text: "#241b12",
    muted: "#6f5d4b",
    primary: "#3f2a18",
    secondary: "#9a6a2f",
    accent: "#d6a84f",
    border: "#e5d5b8",
    isDark: false,
  },
  healthClean: {
    key: "healthClean",
    name: "Saude limpa",
    background: "#f4fbfb",
    surface: "#ffffff",
    surfaceAlt: "#e7f6f4",
    text: "#12313b",
    muted: "#55717b",
    primary: "#0f6b8f",
    secondary: "#19a7a1",
    accent: "#8ee4d8",
    border: "#cfe7e6",
    isDark: false,
  },
  beautySoft: {
    key: "beautySoft",
    name: "Beleza elegante",
    background: "#fff7f8",
    surface: "#ffffff",
    surfaceAlt: "#f7e8e9",
    text: "#332125",
    muted: "#7a5e64",
    primary: "#8d4b5c",
    secondary: "#c98291",
    accent: "#d5a955",
    border: "#edd1d7",
    isDark: false,
  },
  foodWarm: {
    key: "foodWarm",
    name: "Alimentacao quente",
    background: "#fff7ed",
    surface: "#fffdf8",
    surfaceAlt: "#ffe8c7",
    text: "#2b170d",
    muted: "#7b5540",
    primary: "#8f1d14",
    secondary: "#e25c19",
    accent: "#f8c96b",
    border: "#f0d4af",
    isDark: false,
  },
  autoStrong: {
    key: "autoStrong",
    name: "Automotivo forte",
    background: "#0a0c10",
    surface: "#151922",
    surfaceAlt: "#222936",
    text: "#f7f8fb",
    muted: "#b2bac8",
    primary: "#e11d2e",
    secondary: "#9ca3af",
    accent: "#f4f4f5",
    border: "rgba(244,244,245,0.16)",
    isDark: true,
  },
  institutional: {
    key: "institutional",
    name: "Institucional",
    background: "#f5f7fb",
    surface: "#ffffff",
    surfaceAlt: "#eef2f8",
    text: "#14213d",
    muted: "#607089",
    primary: "#183b75",
    secondary: "#315da8",
    accent: "#d4a72c",
    border: "#dbe2ef",
    isDark: false,
  },
};

export const paletteOptions = Object.values(sitePalettes);

function hexToRgb(color: string) {
  const normalized = color.replace("#", "");

  if (![3, 6].includes(normalized.length)) {
    return null;
  }

  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;
  const value = Number.parseInt(hex, 16);

  if (Number.isNaN(value)) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function getReadableTextColor(background: string) {
  const rgb = hexToRgb(background);

  if (!rgb) {
    return "#111827";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.58 ? "#111827" : "#ffffff";
}
