import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import Reservation from '@/models/Reservation';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

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
        await connectDB();

        const resource = await Resource.findById(id);
        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        // Get current reservation
        const currentReservation = await Reservation.findOne({
            resourceId: resource._id,
            status: 'approved',
            startTime: { $lte: now },
            endTime: { $gte: now },
        }).populate('userId', 'name email');

        // Get future reservations
        const futureReservations = await Reservation.find({
            resourceId: resource._id,
            status: 'approved',
            startTime: { $gt: now },
        })
            .populate('userId', 'name email')
            .sort({ startTime: 1 });

        // Get past reservations (last 1 year)
        const pastReservations = await Reservation.find({
            resourceId: resource._id,
            status: 'approved',
            endTime: { $lt: now, $gte: oneYearAgo },
        })
            .populate('userId', 'name email')
            .sort({ endTime: -1 });

        return NextResponse.json({
            resource: {
                ...resource.toObject(),
                isAvailable: !currentReservation,
                currentReservation: currentReservation
                    ? {
                        id: currentReservation._id,
                        user: currentReservation.userId,
                        startTime: currentReservation.startTime,
                        endTime: currentReservation.endTime,
                        priority: currentReservation.priority,
                        reason: currentReservation.reason,
                    }
                    : null,
                futureReservations: futureReservations.map((r) => ({
                    id: r._id,
                    user: r.userId,
                    startTime: r.startTime,
                    endTime: r.endTime,
                    priority: r.priority,
                    reason: r.reason,
                })),
                pastReservations: pastReservations.map((r) => ({
                    id: r._id,
                    user: r.userId,
                    startTime: r.startTime,
                    endTime: r.endTime,
                    priority: r.priority,
                    reason: r.reason,
                })),
            },
        });
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
        const { name, description, image } = body;

        await connectDB();

        const resource = await Resource.findById(id);
        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        if (name) resource.name = name;
        if (description) resource.description = description;
        if (image !== undefined) resource.image = image;

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
