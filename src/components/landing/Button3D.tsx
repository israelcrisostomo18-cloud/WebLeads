import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import type { LandingButtonStyle } from "@/types";

type BaseProps = {
  children: ReactNode;
  variant?: LandingButtonStyle;
  className?: string;
};

type Button3DProps =
  | (BaseProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | (BaseProps & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>);

const variants: Record<LandingButtonStyle, string> = {
  whatsapp: "border-[#7dffb3]/30 bg-[#20b15a] text-white shadow-[0_6px_0_#11813f,0_18px_34px_rgba(32,177,90,0.2)] hover:bg-[#26c968]",
  primary: "border-[#6ee7ff]/30 bg-[#10243f] text-white shadow-[0_6px_0_#081426,0_18px_34px_rgba(33,212,253,0.16)] hover:bg-[#173257]",
  secondary: "border-[#6ee7ff]/24 bg-[#f7fbff] text-[#10243f] shadow-[0_6px_0_#b8c7d8,0_18px_34px_rgba(15,23,42,0.14)] hover:bg-white",
  premium: "border-[#c4b5fd]/35 bg-[#111827] text-white shadow-[0_6px_0_#05070d,0_18px_38px_rgba(167,139,250,0.18)] hover:bg-[#151f33]",
};

export function Button3D(props: Button3DProps) {
  const { children, variant = "primary", className = "" } = props;
  const classes = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold transition-colors duration-150 will-change-transform hover:-translate-y-px active:translate-y-px ${variants[variant]} ${className}`;

  if (typeof props.href === "string") {
    const anchorProps = props as BaseProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>;
    const rest = { ...anchorProps } as AnchorHTMLAttributes<HTMLAnchorElement> & Record<string, unknown>;
    delete rest.children;
    delete rest.variant;
    delete rest.className;
    delete rest.href;
    return (
      <a {...rest} href={anchorProps.href} className={classes}>
        {children}
      </a>
    );
  }

  const buttonProps = props as BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
  const rest = { ...buttonProps } as ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>;
  delete rest.children;
  delete rest.variant;
  delete rest.className;

  return (
    <button {...rest} className={classes}>
      {children}
    </button>
  );
}
