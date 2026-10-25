import Image from "next/image";
import Link from "next/link";
import { company } from "@/config/marketing-site";

type BrandLogoProps = {
  variant?: "lockup" | "emblem";
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  variant = "lockup",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const isEmblem = variant === "emblem";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-black)] ${className}`}
      aria-label={`${company.brandName} home`}
    >
      <Image
        src={isEmblem ? "/brand/blvckshell-emblem.png" : "/brand/blvckshell-lockup.jpg"}
        alt=""
        width={isEmblem ? 40 : 160}
        height={isEmblem ? 40 : 40}
        className={isEmblem ? "h-9 w-9 object-contain" : "h-9 w-auto max-w-[140px] object-contain sm:max-w-[180px] sm:h-10"}
        priority={priority}
      />
      <span className="sr-only">{company.brandName}</span>
    </Link>
  );
}
