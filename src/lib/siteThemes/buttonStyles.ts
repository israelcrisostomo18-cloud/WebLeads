export type GeneratedButtonStyle = "whatsapp" | "primary" | "secondary" | "premium" | "dark" | "light";

export function getGeneratedButtonClass(style: GeneratedButtonStyle) {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition-colors transition-shadow transition-transform duration-150 focus:outline-none focus:ring-4 focus:ring-black/10 active:translate-y-px";

  const styles: Record<GeneratedButtonStyle, string> = {
    whatsapp: "bg-[#1fbf62] text-white shadow-[0_8px_0_#0d7d3b,0_18px_32px_rgba(31,191,98,0.2)] hover:bg-[#25d366]",
    primary: "text-white shadow-[0_8px_0_rgba(0,0,0,0.22),0_18px_34px_rgba(0,0,0,0.16)]",
    secondary: "border bg-white/10 shadow-sm backdrop-blur hover:bg-white/16",
    premium: "text-[#10131a] shadow-[0_8px_0_rgba(0,0,0,0.28),0_22px_42px_rgba(214,179,90,0.22)]",
    dark: "bg-[#111827] text-white shadow-[0_8px_0_#020617,0_18px_34px_rgba(0,0,0,0.22)] hover:bg-[#1f2937]",
    light: "border border-black/10 bg-white text-[#111827] shadow-sm hover:bg-[#f8fafc]",
  };

  return `${base} ${styles[style]}`;
}
