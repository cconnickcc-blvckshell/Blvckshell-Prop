import Image from "next/image";
import Link from "next/link";
import { company } from "@/config/marketing-site";
import { brandAssets, brandAssetDimensions } from "@/config/brand-assets";

export type BrandLogoVariant = "header" | "primary" | "crest";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
  /** When false, logo is decorative inside a linked parent. */
  link?: boolean;
};

const variantConfig: Record<
  BrandLogoVariant,
  { src: string; width: number; height: number; imgClass: string }
> = {
  header: {
    src: brandAssets.headerLogo,
    width: brandAssetDimensions.headerLogo.width,
    height: brandAssetDimensions.headerLogo.height,
    imgClass:
      "h-10 w-auto max-w-[min(72vw,17.5rem)] object-contain object-left sm:h-11 md:h-12",
  },
  primary: {
    src: brandAssets.primaryLogo,
    width: brandAssetDimensions.primaryLogo.width,
    height: brandAssetDimensions.primaryLogo.height,
    imgClass: "h-auto w-full max-w-[15rem] object-contain object-left sm:max-w-[17.5rem]",
  },
  crest: {
    src: brandAssets.crest,
    width: brandAssetDimensions.crest.width,
    height: brandAssetDimensions.crest.height,
    imgClass: "h-10 w-10 object-contain sm:h-11 sm:w-11",
  },
};

export default function BrandLogo({
  variant = "header",
  className = "",
  priority = false,
  link = true,
}: BrandLogoProps) {
  const cfg = variantConfig[variant];

  const image = (
    <Image
      src={cfg.src}
      alt=""
      width={cfg.width}
      height={cfg.height}
      className={cfg.imgClass}
      priority={priority}
      sizes={
        variant === "header"
          ? "(max-width: 640px) 72vw, 280px"
          : variant === "primary"
            ? "(max-width: 640px) 240px, 280px"
            : "44px"
      }
    />
  );

  const inner = (
    <>
      {image}
      <span className="sr-only">{company.brandName}</span>
    </>
  );

  if (!link) {
    return <span className={`inline-flex items-center ${className}`}>{inner}</span>;
  }

  return (
    <Link
      href="/"
      className={`inline-flex min-w-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-black)] ${className}`}
      aria-label={`${company.brandName} home`}
    >
      {inner}
    </Link>
  );
}
