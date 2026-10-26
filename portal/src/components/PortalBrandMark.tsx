import BrandLogo from "@/components/marketing/BrandLogo";

type PortalBrandMarkProps = {
  variant?: "header" | "crest";
  className?: string;
};

/** Compact branding for portal shells (login, nav bars). */
export default function PortalBrandMark({ variant = "header", className = "" }: PortalBrandMarkProps) {
  return (
    <BrandLogo
      variant={variant}
      link={false}
      className={className}
      priority={variant === "header"}
    />
  );
}
