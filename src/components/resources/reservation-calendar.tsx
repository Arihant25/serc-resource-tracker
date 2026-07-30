'use client';

import { useMemo, useState } from 'react';
import {
    addMonths,
    eachDayOfInterval,
    endOfDay,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CalendarReservation {
    id: string;
    user: { _id: string; name: string } | null;
    startTime: string;
    endTime: string;
    priority: 'urgent' | 'normal';
    reason: string;
}

interface ReservationCalendarProps {
    /** Approved bookings — the resource is actually taken on these days. */
    approved: CalendarReservation[];
    /** Requested but not yet approved — not blocking, but worth seeing. */
    pending: CalendarReservation[];
}

type Slot = CalendarReservation & { status: 'approved' | 'pending' };
type Band = 'approved' | 'pending' | 'free';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** A booking touches a day if its window overlaps that day at all. */
function coversDay(slot: Slot, day: Date) {
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();
    return (
        new Date(slot.startTime).getTime() <= dayEnd &&
        new Date(slot.endTime).getTime() >= dayStart
    );
}

function byStart(a: Slot, b: Slot) {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}

function formatRange(slot: Slot) {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    return isSameDay(start, end)
        ? `${format(start, 'MMM d')} · ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
        : `${format(start, 'MMM d, HH:mm')} – ${format(end, 'MMM d, HH:mm')}`;
}

/**
 * Month view of everything booked on a resource.
 *
 * A booking is drawn as one continuous band across the days it spans rather than
 * a pill per day, so a week-long run looks like a week-long run. Approved bands
 * are solid red — the resource is genuinely gone. Pending requests are hatched
 * yellow: the hatch is the point, since a request is provisional and shouldn't
 * read as a wall.
 */
export function ReservationCalendar({ approved, pending }: ReservationCalendarProps) {
    // Read the clock once per mount so rendering stays pure.
    const [nowMs] = useState(() => Date.now());
    const [month, setMonth] = useState(() => startOfMonth(nowMs));
    const [selected, setSelected] = useState<Date | null>(null);

    const slots = useMemo<Slot[]>(
        () => [
            ...approved.map((r) => ({ ...r, status: 'approved' as const })),
            ...pending.map((r) => ({ ...r, status: 'pending' as const })),
        ],
        [approved, pending]
    );

    const days = useMemo(
        () =>
            eachDayOfInterval({
                start: startOfWeek(startOfMonth(month)),
                end: endOfWeek(endOfMonth(month)),
            }),
        [month]
    );

    // One pass over the visible days; neighbours are read by index below to work
    // out where each band starts and ends.
    const cells = useMemo(
        () =>
            days.map((day) => {
                const onDay = slots.filter((s) => coversDay(s, day));
                const hasApproved = onDay.some((s) => s.status === 'approved');
                const hasPending = onDay.some((s) => s.status === 'pending');
                const band: Band = hasApproved ? 'approved' : hasPending ? 'pending' : 'free';
                return { day, hasApproved, hasPending, band };
            }),
        [days, slots]
    );

    const selectedSlots = useMemo(
        () => (selected ? slots.filter((s) => coversDay(s, selected)).sort(byStart) : []),
        [selected, slots]
    );

    const upcoming = useMemo(
        () =>
            slots
                .filter((s) => new Date(s.endTime).getTime() >= nowMs)
                .sort(byStart)
                .slice(0, 4),
        [slots, nowMs]
    );

    const today = startOfDay(nowMs);

    const jumpTo = (day: Date) => {
        setMonth(startOfMonth(day));
        setSelected(day);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">Availability</CardTitle>
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 cursor-pointer"
                            aria-label="Previous month"
                            onClick={() => setMonth((m) => subMonths(m, 1))}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <button
                            type="button"
                            onClick={() => setMonth(startOfMonth(today))}
                            title="Back to this month"
                            className="min-w-[7.5rem] cursor-pointer rounded-md px-1 py-0.5 text-center text-sm font-medium tabular-nums transition-colors hover:bg-accent"
                        >
                            {format(month, 'MMMM yyyy')}
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 cursor-pointer"
                            aria-label="Next month"
                            onClick={() => setMonth((m) => addMonths(m, 1))}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
                <div className="w-full max-w-[19rem] shrink-0">
                    <div className="grid grid-cols-7">
                        {WEEKDAYS.map((d) => (
                            <div
                                key={d}
                                className="pb-1.5 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70"
                            >
                                {d}
                            </div>
                        ))}

                        {cells.map(({ day, hasApproved, hasPending, band }, i) => {
                            const outside = !isSameMonth(day, month);
                            const isSelected = !!selected && isSameDay(day, selected);

                            // A band continues into its neighbour only when that
                            // neighbour carries the same kind and sits in the same
                            // week row — otherwise this edge is a cap.
                            const startsRun =
                                i % 7 === 0 || cells[i - 1]?.band !== band;
                            const endsRun =
                                i % 7 === 6 || cells[i + 1]?.band !== band;

                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    disabled={outside}
                                    onClick={() => setSelected(isSelected ? null : day)}
                                    aria-label={`${format(day, 'PPPP')} — ${hasApproved ? 'reserved' : hasPending ? 'pending request' : 'free'
                                        }`}
                                    aria-pressed={isSelected}
                                    className={cn(
                                        'group relative flex h-10 items-center justify-center',
                                        outside ? 'cursor-default' : 'cursor-pointer',
                                        'focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                    )}
                                >
                                    {!outside && band !== 'free' && (
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'absolute inset-y-1',
                                                band === 'approved'
                                                    ? 'bg-destructive/15'
                                                    : 'band-pending',
                                                startsRun ? 'left-0.5 rounded-l-md' : '-left-px',
                                                endsRun ? 'right-0.5 rounded-r-md' : '-right-px'
                                            )}
                                        />
                                    )}

                                    {/* Both kinds on one day: the hatch would be lost under the
                                        solid band, so the request gets its own hairline. */}
                                    {!outside && hasApproved && hasPending && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-x-1 bottom-1 h-[3px] rounded-full bg-busy"
                                        />
                                    )}

                                    {!outside && (
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'absolute inset-y-0.5 inset-x-0 rounded-md transition-colors',
                                                isSelected
                                                    ? 'ring-2 ring-foreground/70'
                                                    : 'group-hover:bg-foreground/[0.06]'
                                            )}
                                        />
                                    )}

                                    <span
                                        className={cn(
                                            'relative flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                                            outside && 'text-muted-foreground/30',
                                            !outside && band !== 'free' && 'font-semibold',
                                            !outside && band === 'free' && day < today && 'text-muted-foreground',
                                            isToday(day) && 'ring-1 ring-primary font-bold text-primary'
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-4 rounded-sm bg-destructive/15" aria-hidden="true" />
                            Reserved
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="band-pending h-2.5 w-4 rounded-sm" aria-hidden="true" />
                            Pending
                        </span>
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    {selected ? (
                        <div>
                            <div className="mb-2.5 flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold">
                                    {format(selected, 'EEEE, MMMM d')}
                                    <span className="ml-1.5 font-normal text-muted-foreground">
                                        {format(selected, 'yyyy')}
                                    </span>
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="-mt-1 size-7 shrink-0 cursor-pointer"
                                    aria-label="Clear selected day"
                                    onClick={() => setSelected(null)}
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>

                            {selectedSlots.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Free all day — nothing booked or requested.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {selectedSlots.map((s) => (
                                        <SlotRow key={s.id} slot={s} />
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="mb-2.5 text-sm font-semibold">
                                Next up
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                    pick a day for detail
                                </span>
                            </p>

                            {upcoming.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nothing booked ahead — this one is wide open.
                                </p>
                            ) : (
                                <ul className="space-y-1">
                                    {upcoming.map((s) => (
                                        <li key={s.id}>
                                            <button
                                                type="button"
                                                onClick={() => jumpTo(new Date(s.startTime))}
                                                className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                                            >
                                                <SlotRow slot={s} compact />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function SlotRow({ slot, compact = false }: { slot: Slot; compact?: boolean }) {
    return (
        <div className="flex min-w-0 flex-1 gap-2 text-sm">
            <span
                aria-hidden="true"
                className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    slot.status === 'approved' ? 'bg-destructive' : 'bg-busy'
                )}
            />
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    <span className="font-medium">{slot.user?.name ?? 'Deleted User'}</span>
                    {slot.status === 'pending' && (
                        <Badge variant="outline" className="border-busy/60 text-busy text-[10px]">
                            Pending
                        </Badge>
                    )}
                    {slot.priority === 'urgent' && (
                        <Badge variant="destructive" className="text-[10px]">
                            Urgent
                        </Badge>
                    )}
                </div>
                <p className="text-xs tabular-nums text-muted-foreground">{formatRange(slot)}</p>
                {!compact && (
                    <p className="mt-0.5 text-xs text-muted-foreground/80">{slot.reason}</p>
                )}
            </div>
        </div>
    );
}
