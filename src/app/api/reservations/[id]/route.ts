import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reservation, { IReservation } from '@/models/Reservation';
import '@/models/Resource';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single reservation
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const reservation = await Reservation.findById(id)
            .populate('userId', 'name email')
            .populate('resourceId', 'name description');

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // Non-admins can only see their own reservations
        if (!user.isAdmin && reservation.userId._id.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ reservation });
    } catch (error) {
        console.error('Get reservation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH update reservation status (admin only for approval/rejection)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        await connectDB();

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // Only admins can approve/reject
        if (status === 'approved' || status === 'rejected') {
            if (!user.isAdmin) {
                return NextResponse.json({ error: 'Only admins can approve or reject reservations' }, { status: 403 });
            }

            // Check for conflicts before approving
            if (status === 'approved') {
                const overlapping = await Reservation.findOne({
                    _id: { $ne: id },
                    resourceId: reservation.resourceId,
                    status: 'approved',
                    $or: [
                        { startTime: { $lt: reservation.endTime }, endTime: { $gt: reservation.startTime } },
                    ],
                });

                if (overlapping) {
                    return NextResponse.json(
                        { error: 'Cannot approve: conflicts with existing reservation' },
                        { status: 409 }
                    );
                }
            }

            reservation.status = status;
            await reservation.save();

            const populated: IReservation & { userId: { name: string; email: string }; resourceId: { name: string } } = await Reservation.findById(reservation._id)
                .populate('userId', 'name email')
                .populate('resourceId', 'name');

            // Send notification to user about approval/rejection
            try {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': request.headers.get('cookie') || '',
                    },
                    body: JSON.stringify({
                        userId: reservation.userId.toString(),
                        title: `Reservation ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                        body: `Your reservation for ${populated?.resourceId.name} has been ${status}`,
                        data: {
                            reservationId: reservation._id.toString(),
                            type: `reservation_${status}`,
                        },
                    }),
                });
            } catch (error) {
                console.error('Failed to send notification:', error);
                // Don't fail the update if notification fails
            }

            return NextResponse.json({ reservation: populated });
        }

        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    } catch (error) {
        console.error('Update reservation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE reservation (user can delete their own pending, admin can delete any)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // Users can only delete their own pending reservations
        if (!user.isAdmin) {
            if (reservation.userId.toString() !== user._id.toString()) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (reservation.status !== 'pending') {
                return NextResponse.json({ error: 'Can only cancel pending reservations' }, { status: 400 });
            }
        }

        await Reservation.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Delete reservation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
