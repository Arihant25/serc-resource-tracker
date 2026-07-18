'use client';

import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface User {
    _id: string;
    name: string;
    email: string;
}

interface Reservation {
    id: string;
    user: User;
    startTime: string;
    endTime: string;
    priority: 'urgent' | 'normal';
}

interface ResourceCardProps {
    resource: {
        _id: string;
        name: string;
        description: string;
        image?: string;
        isAvailable: boolean;
        currentReservation: Reservation | null;
        futureReservations: Reservation[];
    };
}

export function ResourceCard({ resource }: ResourceCardProps) {
    return (
        <Link
            href={`/resources/${resource._id}`}
            className="group flex flex-col h-full overflow-hidden rounded-2xl border bg-card text-card-foreground no-underline shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgb(0_0_0/0.08)] hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
        >
            {resource.image && (
                <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
                    <Image
                        src={resource.image}
                        alt={resource.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                </div>
            )}

            <div className="flex flex-col flex-1 p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display text-lg font-semibold leading-snug line-clamp-1">
                        {resource.name}
                    </h3>
                    <span className="flex items-center gap-1.5 shrink-0 mt-1 text-xs font-medium">
                        <span
                            className={`status-dot ${resource.isAvailable ? 'status-dot-live' : 'status-dot-busy'}`}
                        />
                        <span className={resource.isAvailable ? 'text-primary' : 'text-muted-foreground'}>
                            {resource.isAvailable ? 'Free' : 'In use'}
                        </span>
                    </span>
                </div>

                <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground line-clamp-3 [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0 [&>li]:m-0">
                    <ReactMarkdown disallowedElements={['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img']}>
                        {resource.description}
                    </ReactMarkdown>
                </div>

                <div className="mt-auto pt-4">
                    {resource.currentReservation ? (
                        <div className="rounded-lg bg-muted/70 px-3 py-2.5 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-medium truncate">
                                    {resource.currentReservation.user.name}
                                </span>
                                {resource.currentReservation.priority === 'urgent' && (
                                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Until {format(new Date(resource.currentReservation.endTime), 'MMM d, HH:mm')}
                            </p>
                        </div>
                    ) : resource.futureReservations.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                            Next: {resource.futureReservations[0].user.name} ·{' '}
                            {format(new Date(resource.futureReservations[0].startTime), 'MMM d, HH:mm')}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">No reservations ahead</p>
                    )}
                </div>
            </div>
        </Link>
    );
}
