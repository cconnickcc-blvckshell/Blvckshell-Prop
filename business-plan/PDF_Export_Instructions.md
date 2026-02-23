# PDF Export — Blvckshell Business Plan

**Design system: Institutional Minimalism.** Four page types only: **Cover**, **Section break**, **Narrative content**, **Data / financial spread**. A4, 1.25 in margins. Footer locked at bottom with divider line.

## Critical print settings (required)

- **Margins:** **None**
- **Scale:** **100%**
- **Print backgrounds:** **ON** (cover is #0d0d0d)
- **Paper size:** **A4**
- **Headers and footers:** **Off** (document has its own footer)

## Quick steps

1. Open `Blvckshell_Business_Plan_PDF.html` in Chrome or Edge.
2. Print → **Save as PDF**.
3. Margins: **None**. Background graphics: **On**. Scale: **100%**.

## Page architecture

- **Cover:** Full-bleed intent, #0d0d0d, left-aligned. No footer.
- **Section break:** Full page, centered block; ghost number 20% opacity; H1 + uppercase subtitle. No footer.
- **Narrative content:** Statement / structured density; H2 with thin rule (optional accent rule); max-width 85ch. Footer: BLVCKSHELL - CONFIDENTIAL | Page.
- **Data spread:** Annual-report style. Number dominant (40px serif), label below (9px uppercase). `.data-grid` or `.scale-stack` for strict grid. Footer same as content.

## Typography

- **Serif:** Cormorant Garamond (headings). **Sans:** Inter (body).
- **H1:** 44px. **H2:** 24px, rule under. **H3:** 16px small caps. **Body:** 12px. **Meta:** 9px, tracking.
- **Financial numbers:** 36-40px serif, heavy weight.

## Tables

Thin grey row dividers (#e0e0e0), no vertical lines. Numbers right-aligned. Totals row: `tr.total` with heavier rule (2px #111).

## Footer

Absolute at bottom of each .page. Border-top 1px. Left: BLVCKSHELL — CONFIDENTIAL. Right: Page (number add in Acrobat if needed).

## Before sharing

- Update cover "Prepared by" if needed.
- Add page numbers in Acrobat (Document → Header & Footer) for formal submission.

## Formatting and encoding (lender-ready)

The HTML uses **ASCII-safe characters** so print-to-PDF does not show replacement characters (e.g.): hyphen-minus for ranges and dashes, `>=` for greater-than-or-equal, `~` for approximately. Do not reintroduce Unicode en-dash (–), em-dash (—), or symbol characters (≈, →, ×) in body or footer text; they can corrupt in some PDF pipelines.

## For institutional-grade output

Consider **Paged.js**, **Puppeteer**, or **PrinceXML** for fixed pagination and running footers.
