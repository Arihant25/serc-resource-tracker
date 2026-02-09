'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Reservation {
    _id: string;
    resourceId: { _id: string; name: string };
    startTime: string;
    endTime: string;
    status: 'pending' | 'approved' | 'rejected';
    priority: 'urgent' | 'normal';
    reason: string;
}

export default function ProfilePage() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const { requestPermission, removeToken, permission } = useNotifications();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture ?? '');
    const [updatingProfilePicture, setUpdatingProfilePicture] = useState(false);

    const [pushEnabled, setPushEnabled] = useState(user?.notificationPreferences?.push ?? true);

    useEffect(() => {
        async function fetchReservations() {
            try {
                const res = await fetch(`/api/reservations?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setReservations(data.reservations);
                }
            } catch (error) {
                console.error('Failed to fetch reservations:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchReservations();
            setProfilePictureUrl(user.profilePicture ?? '');
        }
    }, [user]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to change password');
            }

            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleUpdateProfilePicture = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profilePictureUrl.trim()) {
            toast.error('Please enter a valid URL');
            return;
        }

        setUpdatingProfilePicture(true);
        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profilePicture: profilePictureUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update profile picture');
            }

            toast.success('Profile picture updated successfully');
            refreshUser();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update profile picture');
        } finally {
            setUpdatingProfilePicture(false);
        }
    };

    const handleCancelReservation = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this reservation?')) return;

        try {
            const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to cancel reservation');

            toast.success('Reservation cancelled');
            setReservations((prev) => prev.filter((r) => r._id !== id));
        } catch {
            toast.error('Failed to cancel reservation');
        }
    };

    const handleNotificationChange = async (enabled: boolean) => {
        setPushEnabled(enabled);

        try {
            if (enabled) {
                // Request notification permission and get FCM token
                const success = await requestPermission();

                if (!success) {
                    toast.error('Failed to enable notifications. Please allow notifications in your browser settings.');
                    setPushEnabled(false);
                    return;
                }
            } else {
                // Remove FCM token
                await removeToken();
            }

            // Update preference in database
            const res = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ push: enabled }),
            });

            if (!res.ok) throw new Error('Failed to update preferences');

            toast.success('Notification preferences updated');
            refreshUser();
        } catch (error) {
            console.error('Notification change error:', error);
            toast.error('Failed to update preferences');
            setPushEnabled(!enabled);
        }
    };

    if (authLoading) {
        return (
            <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
                <div>Loading...</div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'default';
            case 'rejected':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 overflow-hidden">
            <h1 className="text-3xl font-bold mb-6">Profile & Settings</h1>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground text-sm">Name</Label>
                                <p className="font-medium">{user.name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-sm">Email</Label>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground text-sm">Role</Label>
                                <p>
                                    <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                                        {user.isAdmin ? 'Admin' : 'User'}
                                    </Badge>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Picture</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {user.profilePicture && (
                                <div className="flex justify-center mb-4">
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-muted"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '';
                                        }}
                                    />
                                </div>
                            )}
                            <form onSubmit={handleUpdateProfilePicture} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="profilePictureUrl">Profile Picture URL</Label>
                                    <Input
                                        id="profilePictureUrl"
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={profilePictureUrl}
                                        onChange={(e) => setProfilePictureUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the URL of your profile picture
                                    </p>
                                </div>
                                <Button type="submit" disabled={updatingProfilePicture} className="w-full cursor-pointer">
                                    {updatingProfilePicture ? 'Updating...' : 'Update Profile Picture'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive push notifications for reservations
                                    </p>
                                </div>
                                <Switch checked={pushEnabled} onCheckedChange={handleNotificationChange} className="cursor-pointer" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Current Password</Label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm New Password</Label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={changingPassword} className='cursor-pointer'>
                                    {changingPassword ? 'Changing...' : 'Change Password'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Reservations */}
                <div className="lg:col-span-2 min-w-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Reservations</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-hidden">
                            {loading ? (
                                <div className="animate-pulse space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 bg-muted rounded" />
                                    ))}
                                </div>
                            ) : reservations.length === 0 ? (
                                <p className="text-muted-foreground">No reservations yet</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reservations.map((res) => (
                                            <TableRow key={res._id}>
                                                <TableCell className="font-medium">{res.resourceId.name}</TableCell>
                                                <TableCell className="text-sm">
                                                    {format(new Date(res.startTime), 'MMM d, HH:mm')} -
                                                    <br />
                                                    {format(new Date(res.endTime), 'MMM d, HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={res.priority === 'urgent' ? 'destructive' : 'outline'}>
                                                        {res.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusColor(res.status)}>{res.status}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {res.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleCancelReservation(res._id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
