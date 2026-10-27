/** Convert an evidence photo to a JPEG pdfkit can embed. WebP is not supported by pdfkit. */
export async function toPrintJpeg(input: Buffer, maxWidth = 1400): Promise<Buffer> {
  const sharpMod = await import("sharp");
  const sharp = sharpMod.default;
  return sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();
}
