/**
 * Approved print identity for client documents.
 * Renderers read this module so names, phone, and registration text stay in one place.
 * Set COMPANY_HST_NUMBER to override the documented registration number.
 */
const DOCUMENTED_HST_NUMBER = "729655308RT0001";

export function companyHstNumber(): string {
  const fromEnv = process.env.COMPANY_HST_NUMBER?.trim();
  if (fromEnv) return fromEnv;
  return DOCUMENTED_HST_NUMBER;
}

export const companyPrint = {
  legalName: "Blvckshell Incorporated",
  phone: "519-613-6330",
  serviceArea: "Windsor-Essex County & Chatham",
  web: "blvckshell.com",
  websiteLabel: "www.blvckshell.com",
  signerName: "Chris Connick",
  signerTitle: "Founder",
  /** Optional file path for a signature image. Empty draws a blank line. */
  signatureImagePath: "",
  tagline: "Facilities Execution & Accountability",
  line: "People | Property | Performance | A Higher Standard",
} as const;

export type CompanyPrintView = {
  legalName: string;
  phone: string;
  serviceArea: string;
  web: string;
  websiteLabel: string;
  signerName: string;
  signerTitle: string;
  signatureImagePath: string;
  tagline: string;
  line: string;
  hstNumber: string;
  legalNameCaps: string;
  serviceAreaCaps: string;
  webCaps: string;
  taglineCaps: string;
  lineCaps: string;
  footerLeftCaps: string;
  footerRightCaps: string;
};

export function companyPrintView(): CompanyPrintView {
  const parts = companyPrint.line.split("|").map((part) => part.trim()).filter(Boolean);
  const footerRight = parts.length > 1 ? parts[parts.length - 1] : companyPrint.line;
  const footerLeft = parts.length > 1 ? parts.slice(0, -1).join("  |  ") : companyPrint.line;
  return {
    legalName: companyPrint.legalName,
    phone: companyPrint.phone,
    serviceArea: companyPrint.serviceArea,
    web: companyPrint.web,
    websiteLabel: companyPrint.websiteLabel,
    signerName: companyPrint.signerName,
    signerTitle: companyPrint.signerTitle,
    signatureImagePath: companyPrint.signatureImagePath,
    tagline: companyPrint.tagline,
    line: companyPrint.line,
    hstNumber: companyHstNumber(),
    legalNameCaps: companyPrint.legalName.toUpperCase(),
    serviceAreaCaps: companyPrint.serviceArea.toUpperCase(),
    webCaps: companyPrint.web.toUpperCase(),
    taglineCaps: companyPrint.tagline.toUpperCase(),
    lineCaps: companyPrint.line.toUpperCase(),
    footerLeftCaps: footerLeft.toUpperCase(),
    footerRightCaps: footerRight.toUpperCase(),
  };
}
