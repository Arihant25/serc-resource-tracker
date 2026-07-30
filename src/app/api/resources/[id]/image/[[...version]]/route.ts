import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';

interface RouteParams {
    /** `version` is a cache-buster only — it is never read. It lives in the path
     *  rather than a query string because next/image refuses to optimize local
     *  sources that carry one. */
    params: Promise<{ id: string; version?: string[] }>;
}

/**
 * Serves a resource photo as real bytes on its own cacheable URL, so the list and
 * detail responses no longer have to carry megabytes of base64 (see
 * @/lib/resource-image). Callers put <updatedAt> in the path, which is why the
 * bytes at a given URL can be treated as immutable.
 *
 * Deliberately public (see proxy.ts): Next's image optimizer fetches this
 * server-side without the auth cookie, and it can only resize and re-encode what
 * it can read. Equipment photos carry nothing sensitive — the credentials on a
 * resource stay behind auth in the JSON endpoints.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return new NextResponse(null, { status: 404 });
        }
        await connectDB();

        const resource = await Resource.findById(id).select('image updatedAt').lean();
        if (!resource?.image) {
            return new NextResponse(null, { status: 404 });
        }

        // Split on the header rather than regex-matching the whole value — the
        // payload can be a couple of megabytes.
        const comma = resource.image.indexOf(',');
        const header = comma === -1 ? '' : resource.image.slice(0, comma);
        const contentType = /^data:([^;,]+);base64$/.exec(header)?.[1];
        if (!contentType) {
            // Stored as a plain URL rather than an inline blob — the client uses
            // that URL directly, so there is nothing to serve here.
            return new NextResponse(null, { status: 404 });
        }

        const base64 = resource.image.slice(comma + 1);
        const etag = `"${id}-${new Date(resource.updatedAt).getTime()}"`;

        if (request.headers.get('if-none-match') === etag) {
            return new NextResponse(null, { status: 304, headers: { ETag: etag } });
        }

        const bytes = new Uint8Array(Buffer.from(base64, 'base64'));

        return new NextResponse(bytes, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(bytes.byteLength),
                'Cache-Control': 'public, max-age=31536000, immutable',
                ETag: etag,
            },
        });
    } catch (error) {
        console.error('Get resource image error:', error);
        return new NextResponse(null, { status: 500 });
    }
}
