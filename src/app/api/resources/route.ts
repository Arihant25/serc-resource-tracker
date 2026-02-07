import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import Reservation from '@/models/Reservation';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

// GET all resources
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const resources = await Resource.find({}).sort({ createdAt: -1 });

        // Get current reservations for each resource
        const now = new Date();
        const resourcesWithStatus = await Promise.all(
            resources.map(async (resource) => {
                const currentReservation = await Reservation.findOne({
                    resourceId: resource._id,
                    status: 'approved',
                    startTime: { $lte: now },
                    endTime: { $gte: now },
                }).populate('userId', 'name email');

                const futureReservations = await Reservation.find({
                    resourceId: resource._id,
                    status: 'approved',
                    startTime: { $gt: now },
                })
                    .populate('userId', 'name email')
                    .sort({ startTime: 1 })
                    .limit(3);

                return {
                    ...resource.toObject(),
                    isAvailable: !currentReservation,
                    currentReservation: currentReservation
                        ? {
                            id: currentReservation._id,
                            user: currentReservation.userId,
                            startTime: currentReservation.startTime,
                            endTime: currentReservation.endTime,
                            priority: currentReservation.priority,
                        }
                        : null,
                    futureReservations: futureReservations.map((r) => ({
                        id: r._id,
                        user: r.userId,
                        startTime: r.startTime,
                        endTime: r.endTime,
                        priority: r.priority,
                    })),
                };
            })
        );

        return NextResponse.json({ resources: resourcesWithStatus });
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
        const { name, description, image } = body;

        if (!name || !description) {
            return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
        }

        await connectDB();

        const resource = await Resource.create({
            name,
            description,
            image,
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
