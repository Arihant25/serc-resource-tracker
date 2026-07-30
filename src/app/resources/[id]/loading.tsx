import { Skeleton } from '@/components/ui/skeleton';

export default function ResourceLoading() {
    return (
        <div className="container mx-auto py-8 px-4">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
