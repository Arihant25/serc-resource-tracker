import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import Reservation from '@/models/Reservation';
import { IUser } from '@/models/User';
import { ReservationPriority } from '@/models/Reservation';
import { ResourceDoc, stripInlineImage } from '@/lib/resource-image';
import { PopulatedReservation, groupByResource } from '@/lib/reservations';

/**
 * The reads behind the dashboard and the resource page.
 *
 * These live outside the route handlers because the pages are server components
 * that call them directly — going through fetch('/api/resources') from the server
 * would mean a second HTTP hop just to reach code in the same process. The API
 * routes stay as thin wrappers for client callers (the admin screen).
 *
 * Everything returned here is already JSON-safe — ids and dates are strings — so
 * the same shape crosses the server/client boundary and the wire unchanged.
 */

export interface ReservationView {
    id: string;
    user: { _id: string; name: string; email: string } | null;
    startTime: string;
    endTime: string;
    priority: ReservationPriority;
    reason: string;
}

export interface ResourceView extends Omit<ResourceDoc, '_id' | 'createdAt' | 'updatedAt'> {
    _id: string;
    createdAt: string;
    updatedAt: string;
    isAvailable: boolean;
    currentReservation: ReservationView | null;
    futureReservations: ReservationView[];
}

export interface ResourceDetailView extends ResourceView {
    pendingReservations: ReservationView[];
    pastReservations: ReservationView[];
}

function toView(reservation: PopulatedReservation): ReservationView {
    return {
        id: reservation._id.toString(),
        user: reservation.userId
            ? {
                _id: reservation.userId._id.toString(),
                name: reservation.userId.name,
                email: reservation.userId.email,
            }
            : null,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        priority: reservation.priority,
        reason: reservation.reason,
    };
}

/** Computer credentials are only for whoever currently holds the resource. */
function applyCredentialVisibility(resource: ResourceDoc, visible: boolean) {
    if (visible) return;
    delete resource.systemUser;
    delete resource.systemIp;
    delete resource.password;
}

function baseView(resource: ResourceDoc) {
    return {
        ...resource,
        _id: resource._id.toString(),
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
    };
}

/** Every resource with its live and next-up bookings — two queries, not 2 per row. */
export async function getResourceList(user: IUser): Promise<ResourceView[]> {
    await connectDB();
    const now = new Date();

    const [resources, live] = await Promise.all([
        Resource.aggregate<ResourceDoc>([{ $sort: { createdAt: -1 } }, stripInlineImage]),
        Reservation.find({ status: 'approved', endTime: { $gte: now } })
            .populate('userId', 'name email')
            .sort({ startTime: 1 })
            .lean<PopulatedReservation[]>(),
    ]);

    const byResource = groupByResource(live);

    return resources.map((resource) => {
        const bookings = byResource.get(resource._id.toString()) ?? [];
        const current = bookings.find((r) => r.startTime <= now && r.endTime >= now) ?? null;
        // `bookings` is already sorted by start time.
        const future = bookings.filter((r) => r.startTime > now).slice(0, 3);

        applyCredentialVisibility(
            resource,
            user.isAdmin || current?.userId?._id.toString() === user._id.toString()
        );

        return {
            ...baseView(resource),
            isAvailable: !current,
            currentReservation: current ? toView(current) : null,
            futureReservations: future.map(toView),
        };
    });
}

/** One resource plus everything its page shows: current, upcoming, pending, past. */
export async function getResourceDetail(
    id: string,
    user: IUser
): Promise<ResourceDetailView | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    await connectDB();
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [resources, reservations] = await Promise.all([
        Resource.aggregate<ResourceDoc>([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            stripInlineImage,
        ]),
        Reservation.find({
            resourceId: id,
            $or: [
                { status: 'approved', endTime: { $gte: oneYearAgo } },
                { status: 'pending', endTime: { $gt: now } },
            ],
        })
            .populate('userId', 'name email')
            .sort({ startTime: 1 })
            .lean<PopulatedReservation[]>(),
    ]);

    const resource = resources[0];
    if (!resource) return null;

    const approved = reservations.filter((r) => r.status === 'approved');
    const current = approved.find((r) => r.startTime <= now && r.endTime >= now) ?? null;

    applyCredentialVisibility(
        resource,
        user.isAdmin ||
        approved.some(
            (r) =>
                r.startTime <= now &&
                r.endTime >= now &&
                r.userId?._id.toString() === user._id.toString()
        )
    );

    return {
        ...baseView(resource),
        isAvailable: !current,
        currentReservation: current ? toView(current) : null,
        futureReservations: approved.filter((r) => r.startTime > now).map(toView),
        pendingReservations: reservations.filter((r) => r.status === 'pending').map(toView),
        pastReservations: approved
            .filter((r) => r.endTime < now)
            .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
            .map(toView),
    };
}

/** The caller's own bookings that haven't finished yet — the dashboard banner. */
export async function getMyActiveBookings(user: IUser) {
    await connectDB();

    const bookings = await Reservation.find({
        userId: user._id,
        status: 'approved',
        endTime: { $gte: new Date() },
    })
        .populate('resourceId', 'name')
        .sort({ endTime: 1 })
        .lean<
            (PopulatedReservation & { resourceId: { _id: mongoose.Types.ObjectId; name: string } })[]
        >();

    return bookings
        .filter((b) => b.resourceId)
        .map((b) => ({
            _id: b._id.toString(),
            resourceId: { _id: b.resourceId._id.toString(), name: b.resourceId.name },
            startTime: b.startTime.toISOString(),
            endTime: b.endTime.toISOString(),
            status: b.status,
        }));
}
