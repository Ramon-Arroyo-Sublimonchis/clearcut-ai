// Reduce la foto solo si pasa los límites del dispositivo (iOS no admite canvas de más de ~16.7 MP).
// Funciona en el worker y en el hilo principal porque solo usa createImageBitmap y OffscreenCanvas.
export async function fitToLimits(file, maxSide, maxPixels) {
  if (!maxSide && !maxPixels) return { source: file, downscaled: false };

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(
    1,
    maxSide ? maxSide / Math.max(width, height) : 1,
    maxPixels ? Math.sqrt(maxPixels / (width * height)) : 1,
  );
  if (scale >= 1 || typeof OffscreenCanvas === 'undefined') {
    bitmap.close();
    return { source: file, width, height, downscaled: false };
  }

  const w = Math.floor(width * scale);
  const h = Math.floor(height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  // PNG sin pérdida para no degradar el recorte
  const source = await canvas.convertToBlob({ type: 'image/png' });
  return { source, width: w, height: h, downscaled: true };
}
