import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { getResourceList } from '@/lib/resource-queries';

// GET all resources
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ resources: await getResourceList(user) });
    } catch (error) {
        console.error('Get resources error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create resource (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json();
        const { name, description, image, collegeId, isComputer, systemUser, systemIp, password } = body;

        if (!name || !description) {
            return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
        }

        await connectDB();

        const resource = await Resource.create({
            name,
            description,
            image: image || undefined,
            collegeId,
            isComputer,
            systemUser: isComputer ? systemUser : undefined,
            systemIp: isComputer ? systemIp : undefined,
            password: isComputer ? password : undefined,
        });

        return NextResponse.json({ resource }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Create resource error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
