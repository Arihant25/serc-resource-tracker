'use client';

import { useEffect, useState } from 'react';
import { ResourceCard } from '@/components/resources/resource-card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface Resource {
    _id: string;
    name: string;
    description: string;
    image?: string;
    isAvailable: boolean;
    currentReservation: {
        id: string;
        user: { _id: string; name: string; email: string };
        startTime: string;
        endTime: string;
        priority: 'urgent' | 'normal';
    } | null;
    futureReservations: {
        id: string;
        user: { _id: string; name: string; email: string };
        startTime: string;
        endTime: string;
        priority: 'urgent' | 'normal';
    }[];
}

export default function DashboardPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchResources() {
            try {
                const res = await fetch('/api/resources');
                if (res.ok) {
                    const data = await res.json();
                    setResources(data.resources);
                }
            } catch (error) {
                console.error('Failed to fetch resources:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchResources();
    }, []);

    const filteredResources = resources.filter(
        (r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.description.toLowerCase().includes(search.toLowerCase())
    );

    const freeCount = resources.filter((r) => r.isAvailable).length;

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold">The lab, right now</h1>
                        {!loading && resources.length > 0 && (
                            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                                <span className="status-dot status-dot-live" />
                                {freeCount} of {resources.length} {resources.length === 1 ? 'resource' : 'resources'} free
                            </p>
                        )}
                    </div>
                    <Input
                        placeholder="Search resources..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs rounded-full px-4"
                    />
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-64 rounded-2xl" />
                        ))}
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="font-display text-lg font-semibold mb-1">
                            {search ? 'Nothing matches that search' : 'No resources yet'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                            {search ? 'Try a different name or keyword.' : 'An admin can add the first machine from the admin panel.'}
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
