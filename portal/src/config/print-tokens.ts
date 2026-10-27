/** Option B print palette and US Letter geometry. Shared by every pdfkit document. */

export const PRINT = {
  ink: "#1A222B",
  body: "#57616C",
  gold: "#B88A2E",
  goldDeep: "#8C6A2A",
  panel: "#F6F4F0",
  row: "#FAFAF8",
  rule: "#E2E5E7",
  lightHead: "#F8F6F1",
  white: "#FFFFFF",
  page: { width: 612, height: 792 },
  marginX: 42,
  contentTop: 176,
  contentBottom: 724,
  footerRuleY: 732,
  /** Crest behind letterhead pages. Off until the pale treatment is revisited. */
  showWatermark: false as boolean,
} as const;

export const CONTENT_WIDTH = PRINT.page.width - PRINT.marginX * 2;
