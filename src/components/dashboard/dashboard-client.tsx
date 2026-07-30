'use client';

import { useState } from 'react';
import { ResourceCard } from '@/components/resources/resource-card';
import { ActiveBookingsCard, type Booking } from '@/components/dashboard/active-bookings-card';
import { Input } from '@/components/ui/input';
import type { ResourceView } from '@/lib/resource-queries';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'free' | 'inuse';

interface DashboardClientProps {
    resources: ResourceView[];
    bookings: Booking[];
}

/** The interactive half of the dashboard — searching and filtering a list the
 *  server already resolved. */
export function DashboardClient({ resources, bookings }: DashboardClientProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filteredResources = resources.filter((r) => {
        const matchesSearch =
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.description.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'free' && r.isAvailable) ||
            (statusFilter === 'inuse' && !r.isAvailable);
        return matchesSearch && matchesStatus;
    });

    const freeCount = resources.filter((r) => r.isAvailable).length;
    const inUseCount = resources.length - freeCount;

    const filters: { value: StatusFilter; label: string }[] = [
        { value: 'all', label: `All (${resources.length})` },
        { value: 'free', label: `Free (${freeCount})` },
        { value: 'inuse', label: `In use (${inUseCount})` },
    ];

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col gap-8">
                <ActiveBookingsCard bookings={bookings} />

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold">The lab, right now</h1>
                        {resources.length > 0 && (
                            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                                <span className="status-dot status-dot-live" />
                                {freeCount} of {resources.length} {resources.length === 1 ? 'resource' : 'resources'} free
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-3">
                        <div className="flex sm:inline-flex w-full sm:w-auto rounded-full border bg-muted/40 p-1">
                            {filters.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setStatusFilter(f.value)}
                                    className={cn(
                                        'flex-1 sm:flex-none rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
                                        statusFilter === f.value
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <Input
                            placeholder="Search resources..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-64 rounded-full px-4"
                        />
                    </div>
                </div>

                {filteredResources.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="font-display text-lg font-semibold mb-1">
                            {search || statusFilter !== 'all' ? 'Nothing matches your filters' : 'No resources yet'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                            {search || statusFilter !== 'all' ? 'Try a different name, keyword, or filter.' : 'An admin can add the first machine from the admin panel.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((resource) => (
                            <ResourceCard key={resource._id} resource={resource} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
