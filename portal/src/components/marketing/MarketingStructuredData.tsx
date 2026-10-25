import { company, servicesCatalog } from "@/config/marketing-site";
import { getVerifiedBusinessPhoneE164 } from "@/lib/business-phone";

const siteUrl = "https://www.blvckshell.com";

export default function MarketingStructuredData() {
  const telephone = getVerifiedBusinessPhoneE164();

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.legalName,
    alternateName: company.brandName,
    url: siteUrl,
    email: company.email,
    ...(telephone ? { telephone } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Leamington",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Windsor-Essex, Ontario",
    },
    description: company.commercialLine,
  };

  const serviceNodes = servicesCatalog
    .filter((s) => s.primary)
    .map((s) => ({
      "@type": "Service",
      name: s.title,
      description: s.shortDescription,
      url: `${siteUrl}${s.href}`,
      provider: { "@type": "LocalBusiness", name: company.brandName },
      areaServed: "Windsor-Essex, Ontario",
    }));

  const graph = {
    "@context": "https://schema.org",
    "@graph": [localBusiness, ...serviceNodes],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
