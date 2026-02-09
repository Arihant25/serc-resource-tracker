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

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Resources</h1>
                        <p className="text-muted-foreground">Browse and reserve lab resources</p>
                    </div>
                    <Input
                        placeholder="Search resources..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-64" />
                        ))}
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {search ? 'No resources match your search.' : 'No resources available yet.'}
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
