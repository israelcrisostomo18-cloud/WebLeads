export type SiteFontKey = "inter" | "poppins" | "montserrat" | "manrope" | "jakarta";

export type SiteFontPair = {
  key: SiteFontKey;
  name: string;
  headingClass: string;
  bodyClass: string;
};

export const siteFonts: Record<SiteFontKey, SiteFontPair> = {
  inter: {
    key: "inter",
    name: "Inter",
    headingClass: "font-sans",
    bodyClass: "font-sans",
  },
  poppins: {
    key: "poppins",
    name: "Poppins",
    headingClass: "font-sans",
    bodyClass: "font-sans",
  },
  montserrat: {
    key: "montserrat",
    name: "Montserrat",
    headingClass: "font-sans",
    bodyClass: "font-sans",
  },
  manrope: {
    key: "manrope",
    name: "Manrope",
    headingClass: "font-sans",
    bodyClass: "font-sans",
  },
  jakarta: {
    key: "jakarta",
    name: "Plus Jakarta Sans",
    headingClass: "font-sans",
    bodyClass: "font-sans",
  },
};

export const fontOptions = Object.values(siteFonts);
