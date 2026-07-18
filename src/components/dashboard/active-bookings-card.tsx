'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarClock } from 'lucide-react';

interface Booking {
    _id: string;
    resourceId: { _id: string; name: string };
    startTime: string;
    endTime: string;
    status: 'pending' | 'approved' | 'rejected';
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (days > 0 || hours > 0) parts.push(`${hours}h`);
    if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
}

export function ActiveBookingsCard({ userId }: { userId: string }) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await fetch(`/api/reservations?userId=${userId}&status=approved`);
                if (res.ok && !cancelled) {
                    const data = await res.json();
                    setBookings(data.reservations ?? []);
                }
            } catch (error) {
                console.error('Failed to load bookings:', error);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    // Tick every second for the live countdown.
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Only show approved bookings that have not ended yet, soonest to expire first.
    const active = bookings
        .filter((b) => new Date(b.endTime).getTime() > now)
        .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());

    if (active.length === 0) {
        return null;
    }

    return (
        <div className="rounded-2xl bg-green-700 text-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="w-5 h-5" />
                <h2 className="font-display text-lg font-semibold">
                    Your bookings ({active.length})
                </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((booking) => {
                    const start = new Date(booking.startTime).getTime();
                    const end = new Date(booking.endTime).getTime();
                    const hasStarted = start <= now;
                    const target = hasStarted ? end : start;
                    const remaining = target - now;

                    return (
                        <div
                            key={booking._id}
                            className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3"
                        >
                            <p className="font-semibold truncate">{booking.resourceId.name}</p>
                            <p className="text-xs text-white/80 mt-0.5">
                                {hasStarted ? 'Ends in' : 'Starts in'}
                            </p>
                            <p className="text-2xl font-bold tabular-nums tracking-tight mt-0.5">
                                {formatCountdown(remaining)}
                            </p>
                            <p className="text-xs text-white/80 mt-1">
                                Expires {format(new Date(booking.endTime), 'MMM d, yyyy · HH:mm')}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
