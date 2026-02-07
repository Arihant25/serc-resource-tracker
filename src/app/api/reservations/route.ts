import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

// GET reservations
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');
        const resourceId = searchParams.get('resourceId');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};

        // Non-admins can only see their own reservations
        if (!user.isAdmin) {
            query.userId = user._id;
        } else if (userId) {
            query.userId = userId;
        }

        if (status) query.status = status;
        if (resourceId) query.resourceId = resourceId;

        const reservations = await Reservation.find(query)
            .populate('userId', 'name email')
            .populate('resourceId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ reservations });
    } catch (error) {
        console.error('Get reservations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create reservation
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { resourceId, startTime, endTime, reason, priority } = body;

        if (!resourceId || !startTime || !endTime || !reason) {
            return NextResponse.json(
                { error: 'resourceId, startTime, endTime, and reason are required' },
                { status: 400 }
            );
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
        }

        await connectDB();

        // Check for overlapping approved reservations
        const overlapping = await Reservation.findOne({
            resourceId,
            status: 'approved',
            $or: [
                { startTime: { $lt: end }, endTime: { $gt: start } },
            ],
        });

        if (overlapping) {
            return NextResponse.json(
                { error: 'This time slot conflicts with an existing reservation' },
                { status: 409 }
            );
        }

        const reservation = await Reservation.create({
            resourceId,
            userId: user._id,
            startTime: start,
            endTime: end,
            reason,
            priority: priority || 'normal',
        });

        const populated: any = await Reservation.findById(reservation._id)
            .populate('userId', 'name email')
            .populate('resourceId', 'name');

        // Send notification to admins about new reservation request
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                    notifyAllAdmins: true,
                    title: 'New Reservation Request',
                    body: `${populated?.userId.name} requested ${populated?.resourceId.name} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}`,
                    data: {
                        reservationId: reservation._id.toString(),
                        type: 'new_reservation',
                    },
                }),
            });
        } catch (error) {
            console.error('Failed to send notification:', error);
            // Don't fail the reservation creation if notification fails
        }

        return NextResponse.json({ reservation: populated }, { status: 201 });
    } catch (error) {
        console.error('Create reservation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET pending reservations count (for admin badge)
export async function HEAD() {
    try {
        await requireAdmin();
        await connectDB();

        const count = await Reservation.countDocuments({ status: 'pending' });

        return new NextResponse(null, {
            headers: { 'X-Pending-Count': count.toString() },
        });
    } catch {
        return new NextResponse(null, { status: 401 });
    }
}
