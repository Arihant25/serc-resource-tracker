import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getMyActiveBookings, getResourceList } from '@/lib/resource-queries';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

/**
 * Server-rendered: the resource grid and the user's own bookings are read here in
 * parallel, so the browser gets a finished page instead of three chained fetches
 * (auth, then resources, then bookings) after the JavaScript loads.
 */
export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const [resources, bookings] = await Promise.all([
        getResourceList(user),
        getMyActiveBookings(user),
    ]);

    return <DashboardClient resources={resources} bookings={bookings} />;
}
