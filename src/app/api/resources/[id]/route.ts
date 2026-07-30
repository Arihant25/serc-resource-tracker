import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import Reservation from '@/models/Reservation';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { getResourceDetail } from '@/lib/resource-queries';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single resource with reservation history
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const resource = await getResourceDetail(id, user);
        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        return NextResponse.json({ resource });
    } catch (error) {
        console.error('Get resource error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update resource (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const body = await request.json();
        const { name, description, image, collegeId, isComputer, systemUser, systemIp, password } = body;

        await connectDB();

        const resource = await Resource.findById(id);
        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        if (name) resource.name = name;
        if (description) resource.description = description;
        // An empty string means the admin removed the photo — unset it rather than
        // storing a blank.
        if (image !== undefined) resource.image = image || undefined;
        if (collegeId !== undefined) resource.collegeId = collegeId;
        if (isComputer !== undefined) resource.isComputer = isComputer;
        if (isComputer) {
            if (systemUser !== undefined) resource.systemUser = systemUser;
            if (systemIp !== undefined) resource.systemIp = systemIp;
            if (password !== undefined) resource.password = password;
        } else if (isComputer === false) {
            resource.systemUser = undefined;
            resource.systemIp = undefined;
            resource.password = undefined;
        }

        await resource.save();

        return NextResponse.json({ resource });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Update resource error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE resource (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        await connectDB();

        const resource = await Resource.findByIdAndDelete(id);
        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        // Also delete all reservations for this resource
        await Reservation.deleteMany({ resourceId: id });

        return NextResponse.json({ message: 'Resource deleted successfully' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Delete resource error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
