import { encodePhoto } from './encode-photo';

// Random noise is the worst case for JPEG, so it is what pushes the encoder through its
// quality and resolution steps.
function noise(width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(width, height);
  for (let i = 0; i < image.data.length; i++) {
    image.data[i] = i % 4 === 3 ? 255 : Math.floor(Math.random() * 256);
  }
  context.putImageData(image, 0, 0);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
}

function dimensions(dataUrl: string): Promise<{ width: number, height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

describe('encodePhoto', () => {
  it('fits a hard-to-compress photo into the budget by giving up resolution', async () => {
    const dataUrl = await encodePhoto(await noise(1600, 1200), 60_000);
    expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBeTrue();
    expect(dataUrl.length).toBeLessThanOrEqual(60_000);
    const { width, height } = await dimensions(dataUrl);
    expect(width).toBeLessThan(1024);
    expect(width / height).toBeCloseTo(1600 / 1200, 1);
  });

  it('caps the long edge but never upscales', async () => {
    const flat = document.createElement('canvas');
    flat.width = 3000;
    flat.height = 1500;
    const large = await new Promise<Blob>((resolve) => flat.toBlob((blob) => resolve(blob!), 'image/png'));
    expect(await dimensions(await encodePhoto(large))).toEqual({ width: 1024, height: 512 });

    flat.width = 200;
    flat.height = 100;
    const small = await new Promise<Blob>((resolve) => flat.toBlob((blob) => resolve(blob!), 'image/png'));
    expect(await dimensions(await encodePhoto(small))).toEqual({ width: 200, height: 100 });
  });

  it('rejects a file that is not an image', async () => {
    await expectAsync(encodePhoto(new Blob(['not an image'], { type: 'text/plain' }))).toBeRejected();
  });

  it('rejects rather than storing a photo that cannot be made to fit', async () => {
    await expectAsync(encodePhoto(await noise(400, 400), 500)).toBeRejected();
  });
});
