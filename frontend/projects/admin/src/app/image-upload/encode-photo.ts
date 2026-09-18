import { MAX_PHOTO_CHARS } from '../../../../app/src/app/photos';

const MAX_EDGE = 1024;
const MIN_EDGE = 160;
const QUALITIES = [0.85, 0.75, 0.65, 0.55];

function draw(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

/**
 * Decodes an image file and re-encodes it as a JPEG data-URI no longer than `maxChars`.
 * Quality gives way first, then resolution, so a photo that compresses well keeps enough
 * pixels to be worth opening full-screen while a busy one still fits the budget.
 */
export async function encodePhoto(file: Blob, maxChars = MAX_PHOTO_CHARS): Promise<string> {
  const bmp = await createImageBitmap(file);
  try {
    let scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    while (true) {
      const width = Math.max(1, Math.round(bmp.width * scale));
      const height = Math.max(1, Math.round(bmp.height * scale));
      const canvas = draw(bmp, width, height);
      for (const quality of QUALITIES) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length <= maxChars) {
          return dataUrl;
        }
      }
      if (Math.max(width, height) <= MIN_EDGE) {
        throw new Error('Could not fit the photo into the size budget');
      }
      scale *= 0.8;
    }
  } finally {
    bmp.close();
  }
}
