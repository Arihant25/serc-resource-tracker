import mongoose from 'mongoose';
import { ReservationPriority, ReservationStatus } from '@/models/Reservation';

/** A lean reservation with its user populated — what the read endpoints return. */
export interface PopulatedReservation {
    _id: mongoose.Types.ObjectId;
    resourceId: mongoose.Types.ObjectId;
    userId: { _id: mongoose.Types.ObjectId; name: string; email: string } | null;
    startTime: Date;
    endTime: Date;
    status: ReservationStatus;
    priority: ReservationPriority;
    reason: string;
}

/** Buckets reservations by resource so one query can serve a whole list page. */
export function groupByResource(reservations: PopulatedReservation[]) {
    const byResource = new Map<string, PopulatedReservation[]>();
    for (const reservation of reservations) {
        const key = reservation.resourceId.toString();
        const bucket = byResource.get(key);
        if (bucket) bucket.push(reservation);
        else byResource.set(key, [reservation]);
    }
    return byResource;
}
