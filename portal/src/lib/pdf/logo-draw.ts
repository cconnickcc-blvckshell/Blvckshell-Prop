import { LOGO_GROUPS, LOGO_VIEWBOX, type LogoGroup, type LogoOp } from "@/lib/pdf/logo-paths";
import type { PdfDoc } from "@/lib/pdf/types";

function applyOps(doc: PdfDoc, ops: LogoOp[]): void {
  for (const op of ops) {
    if (op.op === "translate") {
      doc.translate(op.nums[0] ?? 0, op.nums[1] ?? 0);
    } else {
      const sx = op.nums[0] ?? 1;
      doc.scale(sx, op.nums[1] ?? sx);
    }
  }
}

function drawGroup(doc: PdfDoc, group: LogoGroup): void {
  doc.save();
  applyOps(doc, group.transform);
  for (const shape of group.shapes) {
    if (shape.kind === "polygon") {
      const pairs: number[][] = [];
      for (let i = 0; i < shape.points.length; i += 2) {
        pairs.push([shape.points[i], shape.points[i + 1]]);
      }
      if (pairs.length >= 3) doc.polygon(...pairs).fill(shape.fill);
    } else if (shape.d) {
      doc.path(shape.d.replace(/\s+/g, " ")).fill(shape.fill);
    }
  }
  doc.restore();
}

/** SVG user-space point after the group's transform (rightmost operation first). */
function mapPoint(ops: LogoOp[], x: number, y: number): [number, number] {
  let px = x;
  let py = y;
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    if (op.op === "translate") {
      px += op.nums[0] ?? 0;
      py += op.nums[1] ?? 0;
    } else {
      const sx = op.nums[0] ?? 1;
      const sy = op.nums[1] ?? sx;
      px *= sx;
      py *= sy;
    }
  }
  return [px, py];
}

export function drawLogo(doc: PdfDoc, x: number, y: number, width: number): void {
  const scale = width / LOGO_VIEWBOX.width;
  doc.save();
  doc.translate(x, y);
  doc.scale(scale, scale);
  doc.translate(-LOGO_VIEWBOX.x, -LOGO_VIEWBOX.y);
  for (const group of LOGO_GROUPS) drawGroup(doc, group);
  doc.restore();
}

const WATERMARK_CREAM = ["#E7D3B4", "#F6EBDD", "#F4E6D2", "#E8D0B0", "#FBF6EE", "#E8D0B0", "#F4E6D2"];

/** Crest only, fitted to `width`. Pass `fills` to recolor facets; otherwise the logo colors are used. */
export function drawCrest(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  fills?: string[]
): void {
  const crest = LOGO_GROUPS.find((group) => group.id === "crest");
  if (!crest) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const shape of crest.shapes) {
    if (shape.kind !== "polygon") continue;
    for (let i = 0; i < shape.points.length; i += 2) {
      const [px, py] = mapPoint(crest.transform, shape.points[i], shape.points[i + 1]);
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
  }
  const boundsWidth = maxX - minX;
  if (!Number.isFinite(boundsWidth) || boundsWidth <= 0) return;
  const scale = width / boundsWidth;
  doc.save();
  doc.translate(x, y);
  doc.scale(scale, scale);
  doc.translate(-minX, -minY);
  if (!fills) {
    drawGroup(doc, crest);
  } else {
    doc.save();
    applyOps(doc, crest.transform);
    crest.shapes.forEach((shape, index) => {
      if (shape.kind !== "polygon") return;
      const pairs: number[][] = [];
      for (let i = 0; i < shape.points.length; i += 2) {
        pairs.push([shape.points[i], shape.points[i + 1]]);
      }
      if (pairs.length >= 3) doc.polygon(...pairs).fill(fills[index] ?? "#F6EBDD");
    });
    doc.restore();
  }
  doc.restore();
}

/** Large bottom-right watermark. Filled cream facets, no stroke and no grey. */
export function drawWatermarkCrest(doc: PdfDoc, x: number, y: number, width: number): void {
  drawCrest(doc, x, y, width, WATERMARK_CREAM);
}
