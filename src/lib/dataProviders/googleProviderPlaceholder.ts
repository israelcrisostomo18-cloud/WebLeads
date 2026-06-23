import type { DataProvider } from "@/lib/dataProviders/types";

export const googleProviderPlaceholder: DataProvider = {
  id: "google",
  label: "Google Places",
  async search() {
    throw new Error("Google Places ainda não está configurado. A estrutura já está preparada para implementação futura.");
  },
};
