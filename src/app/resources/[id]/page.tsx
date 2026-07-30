import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getResourceDetail } from '@/lib/resource-queries';
import { ResourceDetail } from '@/components/resources/resource-detail';

/**
 * Server-rendered: the page arrives with its data already in the HTML instead of
 * booting React, asking who the user is, then asking for the resource.
 */
export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const resource = await getResourceDetail(id, user);
    if (!resource) {
        redirect('/dashboard');
    }

    return <ResourceDetail resource={resource} currentUserId={user._id.toString()} />;
}
