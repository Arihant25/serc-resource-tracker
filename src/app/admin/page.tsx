'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface User {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
}

interface Resource {
    _id: string;
    name: string;
    description: string;
    image?: string;
    createdAt: string;
}

interface Reservation {
    _id: string;
    resourceId: { _id: string; name: string };
    userId: { _id: string; name: string; email: string };
    startTime: string;
    endTime: string;
    status: 'pending' | 'approved' | 'rejected';
    priority: 'urgent' | 'normal';
    reason: string;
    createdAt: string;
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    // User dialog
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userIsAdmin, setUserIsAdmin] = useState(false);

    // Resource dialog
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [resourceName, setResourceName] = useState('');
    const [resourceDescription, setResourceDescription] = useState('');
    const [resourceImage, setResourceImage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [usersRes, resourcesRes, reservationsRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/resources'),
                fetch('/api/reservations?status=pending'),
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users);
            }
            if (resourcesRes.ok) {
                const data = await resourcesRes.json();
                setResources(data.resources);
            }
            if (reservationsRes.ok) {
                const data = await reservationsRes.json();
                setReservations(data.reservations);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }

    // User handlers
    const openUserDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setUserName(user.name);
            setUserEmail(user.email);
            setUserIsAdmin(user.isAdmin);
        } else {
            setEditingUser(null);
            setUserName('');
            setUserEmail('');
            setUserIsAdmin(false);
        }
        setUserDialogOpen(true);
    };

    const handleSaveUser = async () => {
        try {
            const method = editingUser ? 'PUT' : 'POST';
            const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: userName, email: userEmail, isAdmin: userIsAdmin }),
            });

            if (!res.ok) throw new Error('Failed to save user');

            toast.success(editingUser ? 'User updated' : 'User created');
            setUserDialogOpen(false);
            fetchData();
        } catch {
            toast.error('Failed to save user');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete user');
            toast.success('User deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete user');
        }
    };

    // Resource handlers
    const openResourceDialog = (resource?: Resource) => {
        if (resource) {
            setEditingResource(resource);
            setResourceName(resource.name);
            setResourceDescription(resource.description);
            setResourceImage(resource.image || '');
        } else {
            setEditingResource(null);
            setResourceName('');
            setResourceDescription('');
            setResourceImage('');
        }
        setResourceDialogOpen(true);
    };

    const handleSaveResource = async () => {
        try {
            const method = editingResource ? 'PUT' : 'POST';
            const url = editingResource ? `/api/resources/${editingResource._id}` : '/api/resources';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: resourceName,
                    description: resourceDescription,
                    image: resourceImage || undefined,
                }),
            });

            if (!res.ok) throw new Error('Failed to save resource');

            toast.success(editingResource ? 'Resource updated' : 'Resource created');
            setResourceDialogOpen(false);
            fetchData();
        } catch {
            toast.error('Failed to save resource');
        }
    };

    const handleDeleteResource = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource? All reservations will also be deleted.')) return;
        try {
            const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete resource');
            toast.success('Resource deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete resource');
        }
    };

    // Reservation handlers
    const handleReservation = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update reservation');
            }

            toast.success(`Reservation ${status}`);
            fetchData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update reservation');
        }
    };

    if (loading) {
        return (
            <div className="container py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="h-64 bg-muted rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <Tabs defaultValue="reservations">
                <TabsList className="mb-4">
                    <TabsTrigger value="reservations">
                        Pending Reservations
                        {reservations.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {reservations.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
                    <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
                </TabsList>

                {/* Pending Reservations Tab */}
                <TabsContent value="reservations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Reservation Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reservations.length === 0 ? (
                                <p className="text-muted-foreground">No pending reservations</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>Requested By</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reservations.map((res) => (
                                            <TableRow key={res._id}>
                                                <TableCell className="font-medium">{res.resourceId.name}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p>{res.userId.name}</p>
                                                        <p className="text-xs text-muted-foreground">{res.userId.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {format(new Date(res.startTime), 'MMM d, HH:mm')} -
                                                    <br />
                                                    {format(new Date(res.endTime), 'MMM d, HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={res.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                                        {res.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">{res.reason}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReservation(res._id, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReservation(res._id, 'rejected')}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Users</CardTitle>
                            <Button onClick={() => openUserDialog()}>Add User</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                                                    {user.isAdmin ? 'Admin' : 'User'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => openUserDialog(user)}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteUser(user._id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Resources</CardTitle>
                            <Button onClick={() => openResourceDialog()}>Add Resource</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resources.map((resource) => (
                                        <TableRow key={resource._id}>
                                            <TableCell className="font-medium">{resource.name}</TableCell>
                                            <TableCell className="max-w-xs truncate">{resource.description}</TableCell>
                                            <TableCell>{format(new Date(resource.createdAt), 'MMM d, yyyy')}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openResourceDialog(resource)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteResource(resource._id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* User Dialog */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="isAdmin"
                                checked={userIsAdmin}
                                onCheckedChange={(c) => setUserIsAdmin(c === true)}
                            />
                            <Label htmlFor="isAdmin">Admin privileges</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveUser}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resource Dialog */}
            <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={resourceName} onChange={(e) => setResourceName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={resourceDescription}
                                onChange={(e) => setResourceDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Image URL (optional)</Label>
                            <Input
                                value={resourceImage}
                                onChange={(e) => setResourceImage(e.target.value)}
                                placeholder="https://... or data:image/..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResourceDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveResource}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
