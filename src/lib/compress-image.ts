/** Longest edge we keep. The largest place a photo is shown is ~400px wide, and
 *  the optimizer wants some headroom for retina; beyond this is dead weight. */
const MAX_EDGE = 1400;
const QUALITY = 0.72;

/**
 * Shrinks and re-encodes a picked image before it ever reaches the database.
 *
 * Photos are stored inside the resource document as base64, so an untouched
 * camera JPEG costs its full size on every read of that document — and base64
 * inflates it by a third. Downscaling to something a web page can actually use
 * turns a ~1.6 MB blob into tens of KB.
 *
 * Falls back to the original file if the browser can't decode it or the re-encode
 * somehow comes out bigger.
 */
export async function compressImageFile(file: File): Promise<string> {
    const original = await readAsDataUrl(file);

    // GIFs may be animated and SVGs are already tiny vector text; canvas would
    // flatten or rasterise them, so leave both alone.
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        return original;
    }

    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return original;
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        // Transparency has to survive, so PNGs stay PNG-ish via WebP; everything
        // else re-encodes as JPEG for the widest support.
        const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
        const compressed = canvas.toDataURL(type, QUALITY);

        return compressed.length < original.length ? compressed : original;
    } catch {
        return original;
    }
}

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
            typeof reader.result === 'string'
                ? resolve(reader.result)
                : reject(new Error('Could not read file'));
        reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
        reader.readAsDataURL(file);
    });
}
