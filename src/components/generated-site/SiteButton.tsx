import type { ReactNode } from "react";
import { getGeneratedButtonClass, type GeneratedButtonStyle } from "@/lib/siteThemes/buttonStyles";
import { getReadableTextColor } from "@/lib/siteThemes/palettes";

export function SiteButton({
  href,
  children,
  style = "primary",
  className = "",
  color,
}: {
  href: string;
  children: ReactNode;
  style?: GeneratedButtonStyle;
  className?: string;
  color?: string;
}) {
  return (
    <a
      className={`${getGeneratedButtonClass(style)} ${className}`}
      href={href}
      rel="noreferrer"
      style={style === "primary" && color ? { backgroundColor: color, color: getReadableTextColor(color) } : undefined}
    >
      {children}
    </a>
  );
}
