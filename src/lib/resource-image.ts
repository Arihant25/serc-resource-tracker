import mongoose from 'mongoose';

/**
 * Resource photos are stored inside the document as base64 data URIs (up to ~2 MB
 * each). Inlining them in JSON meant every dashboard load re-downloaded several
 * megabytes the browser could never cache, so list/detail responses now carry
 * only `hasImage` and the bytes come from /api/resources/[id]/image — a real URL
 * the browser can cache, load in parallel, and lazy-load.
 *
 * Short external URLs (http/https) are cheap, so they still ride along in `image`.
 */
export const stripInlineImage = {
    $addFields: {
        hasImage: { $gt: [{ $strLenBytes: { $ifNull: ['$image', ''] } }, 0] },
        image: {
            $cond: [
                { $eq: [{ $substrBytes: [{ $ifNull: ['$image', ''] }, 0, 5] }, 'data:'] },
                '$$REMOVE',
                '$image',
            ],
        },
    },
} as const;

/** A resource as the API returns it: no inline blob, plus `hasImage`. */
export interface ResourceDoc {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    /** Only ever an external URL — inline blobs are stripped. */
    image?: string;
    hasImage: boolean;
    collegeId?: string;
    isComputer?: boolean;
    systemUser?: string;
    systemIp?: string;
    password?: string;
    createdAt: Date;
    updatedAt: Date;
}

/** Where the browser should load this resource's photo from, if it has one. */
export function resourceImageSrc(resource: {
    _id: string;
    image?: string;
    hasImage?: boolean;
    updatedAt?: string;
}): string | null {
    if (resource.image) return resource.image;
    if (!resource.hasImage) return null;
    // updatedAt busts the cache when an admin swaps the photo. It goes in the path,
    // not a query string: next/image will not optimize local sources with one.
    const version = resource.updatedAt ? `/${encodeURIComponent(resource.updatedAt)}` : '';
    return `/api/resources/${resource._id}/image${version}`;
}

/**
 * Reads a stored photo back as a data URI. Only the admin edit form needs this —
 * it round-trips the image through the form, so it has to hold the real bytes.
 */
export async function fetchResourceImageDataUrl(id: string): Promise<string | null> {
    try {
        // Unversioned URL, so ask for fresh bytes rather than the immutable copy.
        const res = await fetch(`/api/resources/${id}/image`, { cache: 'no-store' });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () =>
                resolve(typeof reader.result === 'string' ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}
