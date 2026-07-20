'use client';

import { format } from 'date-fns';

interface Slot {
    _id: string;
    startTime: string;
    endTime: string;
    userId?: { name: string } | null;
}

interface Conflict {
    reservation: Slot;
    kind: 'pending' | 'approved';
}

interface ConflictTimelineProps {
    request: Slot;
    conflicts: Conflict[];
}

/**
 * Lays the request and everything it clashes with onto one shared time axis so
 * the overlap is something you see rather than read. The request's window is a
 * faint vertical band; any bar that enters it is, visibly, the clash — and the
 * exact intersecting slice is painted in the "conflict" red on top.
 */
export function ConflictTimeline({ request, conflicts }: ConflictTimelineProps) {
    const rows: { slot: Slot; kind: 'request' | 'pending' | 'approved' }[] = [
        { slot: request, kind: 'request' },
        ...conflicts.map((c) => ({ slot: c.reservation, kind: c.kind })),
    ];

    const times = rows.flatMap((r) => [
        new Date(r.slot.startTime).getTime(),
        new Date(r.slot.endTime).getTime(),
    ]);
    const domainStart = Math.min(...times);
    const domainEnd = Math.max(...times);
    const span = domainEnd - domainStart || 1;
    const pct = (t: number) => ((t - domainStart) / span) * 100;

    const reqStart = new Date(request.startTime).getTime();
    const reqEnd = new Date(request.endTime).getTime();

    return (
        <div className="rounded-lg border border-[var(--clay)]/25 bg-[var(--clay)]/[0.06] p-3">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-[var(--clay)]">
                    Same slot, {conflicts.length} other{conflicts.length > 1 ? 's' : ''} in the way
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                    {format(domainStart, 'EEE MMM d')}
                </span>
            </div>

            <div className="relative">
                <div className="space-y-1.5">
                    {rows.map(({ slot, kind }) => {
                        const start = new Date(slot.startTime).getTime();
                        const end = new Date(slot.endTime).getTime();
                        const left = pct(start);
                        const width = pct(end) - pct(start);

                        // Intersection of this bar with the request's window.
                        const oStart = Math.max(start, reqStart);
                        const oEnd = Math.min(end, reqEnd);
                        const hasOverlap = kind !== 'request' && oEnd > oStart;

                        return (
                            <div key={slot._id} className="flex items-center gap-3">
                                <div className="flex w-[8.5rem] shrink-0 items-center gap-1.5 overflow-hidden">
                                    <span
                                        className={
                                            kind === 'request'
                                                ? 'size-1.5 shrink-0 rounded-full bg-[var(--clay)]'
                                                : kind === 'approved'
                                                    ? 'size-1.5 shrink-0 rounded-full bg-foreground'
                                                    : 'size-1.5 shrink-0 rounded-full border border-muted-foreground'
                                        }
                                        aria-hidden="true"
                                    />
                                    <span className="truncate text-xs">
                                        {kind === 'request' ? (
                                            <span className="font-semibold">This request</span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                {slot.userId?.name || 'Deleted User'}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className="relative h-6 flex-1 rounded bg-foreground/[0.04]">
                                    <div
                                        className={
                                            'conflict-bar absolute inset-y-1 flex items-center overflow-hidden rounded-[3px] ' +
                                            (kind === 'request'
                                                ? 'border border-dashed border-[var(--clay)] bg-[var(--clay)]/15'
                                                : kind === 'approved'
                                                    ? 'bg-foreground/85'
                                                    : 'bg-[var(--clay)]/20 border border-[var(--clay)]/50')
                                        }
                                        style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                                        title={`${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`}
                                    >
                                        {hasOverlap && (
                                            <span
                                                className="absolute inset-y-0 bg-[var(--brick)]"
                                                style={{
                                                    left: `${((oStart - start) / (end - start)) * 100}%`,
                                                    width: `${((oEnd - oStart) / (end - start)) * 100}%`,
                                                }}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </div>
                                </div>

                                <span className="w-[5.5rem] shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                                    {format(start, 'HH:mm')}–{format(end, 'HH:mm')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block size-2 rounded-[2px] bg-[var(--brick)]" aria-hidden="true" />
                Red marks the exact time these bookings step on each other. Approving one rejects the rest.
            </p>
        </div>
    );
}
