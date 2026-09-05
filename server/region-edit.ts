import sharp from "sharp";

export async function validateRegionMask(data: string, original: Buffer) {
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data) || data.length > 5 * 1024 * 1024) throw new Error("Invalid selection mask");
  const buffer = Buffer.from(data.split(",")[1], "base64");
  const source = await sharp(original).metadata();
  const mask = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata();
  if (!source.width || !source.height || !mask.width || !mask.height || Math.abs(source.width / source.height - mask.width / mask.height) > 0.02) throw new Error("Selection does not match the photo. Select the area again.");
  const normalized = await sharp(buffer).resize(source.width, source.height, { kernel: "nearest" }).removeAlpha().greyscale().threshold(128).png().toBuffer();
  const stats = await sharp(normalized).stats();
  if (stats.channels[0].max === 0) throw new Error("Select an area before generating");
  return normalized;
}

// The final PNG keeps every pixel outside the selected mask from the normalized source.
export async function compositeRegion(original: Buffer, generated: Buffer, mask: Buffer) {
  const { width, height } = await sharp(original).metadata();
  const alpha = await sharp(mask).resize(width, height, { kernel: "nearest" }).removeAlpha().greyscale().raw().toBuffer();
  const rgb = await sharp(generated).resize(width, height, { fit: "fill" }).toColourspace("srgb").removeAlpha().raw().toBuffer();
  const foreground = await sharp(rgb, { raw: { width: width!, height: height!, channels: 3 } }).joinChannel(alpha, { raw: { width: width!, height: height!, channels: 1 } }).png().toBuffer();
  return sharp(original).composite([{ input: foreground }]).png().toBuffer();
}
