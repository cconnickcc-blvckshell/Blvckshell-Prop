import { ImageResponse } from "next/og";
import { company } from "@/config/marketing-site";

export const runtime = "edge";
export const alt = "BLVCKSHELL — Commercial Cleaning Windsor–Essex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "linear-gradient(135deg, #090909 0%, #171717 50%, #090909 100%)",
          color: "#f7f7f7",
        }}
      >
        <div style={{ fontSize: 28, color: "#d4af37", letterSpacing: 4, textTransform: "uppercase" }}>
          {company.brandName}
        </div>
        <div style={{ fontSize: 52, fontWeight: 700, marginTop: 24, lineHeight: 1.15, maxWidth: 900 }}>
          Commercial Cleaning. Accountable by Design.
        </div>
        <div style={{ fontSize: 24, color: "#a3a3a3", marginTop: 24, maxWidth: 800 }}>
          {company.commercialLine}
        </div>
        <div style={{ fontSize: 18, color: "#d4af37", marginTop: 40 }}>{company.primaryRegion}</div>
      </div>
    ),
    { ...size }
  );
}
