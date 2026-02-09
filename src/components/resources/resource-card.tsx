'use client';

import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">{resource.name}</CardTitle>
                    <Badge variant={resource.isAvailable ? 'default' : 'secondary'}>
                        {resource.isAvailable ? 'Available' : 'In Use'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                {resource.image && (
                    <div className="relative w-full h-64 mb-3 rounded-md overflow-hidden bg-muted">
                        <Image
                            src={resource.image}
                            alt={resource.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground mb-3 line-clamp-2 [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0 [&>li]:m-0">
                    <ReactMarkdown disallowedElements={['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img']}>
                        {resource.description}
                    </ReactMarkdown>
                </div>

                {resource.currentReservation && (
                    <div className="p-2 rounded-md bg-muted text-sm mb-2">
                        <div className="flex items-center gap-1 mb-1">
                            <span className="font-medium">Currently reserved by:</span>
                            {resource.currentReservation.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">{resource.currentReservation.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Until {format(new Date(resource.currentReservation.endTime), 'MMM d, HH:mm')}
                        </p>
                    </div>
                )}

                {resource.futureReservations.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Upcoming reservations:</p>
                        {resource.futureReservations.slice(0, 2).map((res) => (
                            <p key={res.id} className="flex items-center gap-1">
                                <span>{format(new Date(res.startTime), 'MMM d')}</span>
                                <span>-</span>
                                <span>{res.user.name}</span>
                                {res.priority === 'urgent' && (
                                    <Badge variant="destructive" className="text-[10px] px-1 py-0">!</Badge>
                                )}
                            </p>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2">
                <Button asChild className="w-full bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer">
                    <Link href={`/resources/${resource._id}`}>View Details</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
