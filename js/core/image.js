// Shrinks large photos before upload so the free storage lasts for years.
import { config } from '../../config/app.js';

export async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, config.imageMaxPx / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1024 * 1024) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((done) => canvas.toBlob(done, 'image/jpeg', config.imageQuality));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}
