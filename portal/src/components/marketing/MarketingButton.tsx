import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-gold)] text-[var(--brand-black)] hover:bg-[var(--brand-gold-light)] shadow-sm",
  secondary:
    "border border-zinc-600 text-[var(--brand-white)] hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold-light)]",
  ghost: "text-zinc-300 hover:text-white",
};

type BaseProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type LinkProps = BaseProps & { href: string; type?: never };
type ButtonProps = BaseProps & { type: "button" | "submit"; href?: never; disabled?: boolean };

export default function MarketingButton(props: LinkProps | ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-black)] disabled:opacity-50";
  const variant = props.variant ?? "primary";
  const classes = `${base} ${variantClass[variant]} ${props.className ?? ""}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {props.children}
      </Link>
    );
  }

  const { type, disabled, children } = props as ButtonProps;
  return (
    <button type={type} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
