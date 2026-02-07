'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ReservationDialog } from '@/components/resources/reservation-dialog';

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
    reason: string;
}

interface Resource {
    _id: string;
    name: string;
    description: string;
    image?: string;
    isAvailable: boolean;
    currentReservation: Reservation | null;
    futureReservations: Reservation[];
    pastReservations: Reservation[];
}

export default function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        async function fetchResource() {
            try {
                const res = await fetch(`/api/resources/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setResource(data.resource);
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Failed to fetch resource:', error);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        }

        fetchResource();
    }, [id, router]);

    if (loading) {
        return (
            <div className="container py-8">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!resource) {
        return null;
    }

    return (
        <div className="container py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                ← Back
            </Button>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl">{resource.name}</CardTitle>
                                    <Badge
                                        variant={resource.isAvailable ? 'default' : 'secondary'}
                                        className="mt-2"
                                    >
                                        {resource.isAvailable ? 'Available' : 'In Use'}
                                    </Badge>
                                </div>
                                <Button onClick={() => setDialogOpen(true)}>Reserve</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {resource.image && (
                                <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={resource.image}
                                        alt={resource.name}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            )}
                            <p className="text-muted-foreground">{resource.description}</p>
                        </CardContent>
                    </Card>

                    {/* Current Reservation */}
                    {resource.currentReservation && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Current Reservation
                                    {resource.currentReservation.priority === 'urgent' && (
                                        <Badge variant="destructive">Urgent</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p>
                                        <span className="font-medium">Reserved by:</span>{' '}
                                        {resource.currentReservation.user.name}
                                    </p>
                                    <p>
                                        <span className="font-medium">Period:</span>{' '}
                                        {format(new Date(resource.currentReservation.startTime), 'PPp')} -{' '}
                                        {format(new Date(resource.currentReservation.endTime), 'PPp')}
                                    </p>
                                    <p>
                                        <span className="font-medium">Reason:</span>{' '}
                                        {resource.currentReservation.reason}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Reservations */}
                <div className="space-y-6">
                    {/* Future Reservations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Upcoming Reservations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {resource.futureReservations.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No upcoming reservations</p>
                            ) : (
                                <ScrollArea className="h-48">
                                    <div className="space-y-3">
                                        {resource.futureReservations.map((res, idx) => (
                                            <div key={res.id}>
                                                {idx > 0 && <Separator className="my-2" />}
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{res.user.name}</span>
                                                        {res.priority === 'urgent' && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Urgent
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-muted-foreground text-xs">
                                                        {format(new Date(res.startTime), 'MMM d, HH:mm')} -{' '}
                                                        {format(new Date(res.endTime), 'MMM d, HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>

                    {/* Past Reservations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Past Reservations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {resource.pastReservations.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No past reservations</p>
                            ) : (
                                <ScrollArea className="h-48">
                                    <div className="space-y-3">
                                        {resource.pastReservations.map((res, idx) => (
                                            <div key={res.id}>
                                                {idx > 0 && <Separator className="my-2" />}
                                                <div className="text-sm">
                                                    <span className="font-medium">{res.user.name}</span>
                                                    <p className="text-muted-foreground text-xs">
                                                        {format(new Date(res.startTime), 'MMM d')} -{' '}
                                                        {format(new Date(res.endTime), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ReservationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                resourceId={resource._id}
                resourceName={resource.name}
            />
        </div>
    );
}
