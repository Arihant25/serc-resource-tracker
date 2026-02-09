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
import { ImageUpload } from '@/components/ui/image-upload';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    isAdmin: boolean;
    isApproved: boolean;
    createdAt: string;
}

interface Resource {
    _id: string;
    name: string;
    description: string;
    image?: string;
    collegeId?: string;
    isComputer?: boolean;
    systemUser?: string;
    systemIp?: string;
    password?: string;
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

interface AnalyticsData {
    topReserversByCount: { name: string; email: string; value: number }[];
    topReserversByTime: { name: string; email: string; value: number }[];
    topResourcesByCount: { name: string; value: number }[];
    topResourcesByTime: { name: string; value: number }[];
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [logs, setLogs] = useState<Reservation[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const [logsSearch, setLogsSearch] = useState('');
    const [logsStatus, setLogsStatus] = useState('all');

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
    const [resourceCollegeId, setResourceCollegeId] = useState('');
    const [resourceIsComputer, setResourceIsComputer] = useState(false);
    const [resourceSystemUser, setResourceSystemUser] = useState('');
    const [resourceSystemIp, setResourceSystemIp] = useState('');
    const [resourcePassword, setResourcePassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timeout);
    }, [logsSearch, logsStatus]);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }

    async function fetchResources() {
        try {
            const res = await fetch('/api/resources');
            if (res.ok) {
                const data = await res.json();
                setResources(data.resources);
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        }
    }

    async function fetchReservations() {
        try {
            const res = await fetch('/api/reservations?status=pending');
            if (res.ok) {
                const data = await res.json();
                setReservations(data.reservations);
            }
        } catch (error) {
            console.error('Failed to fetch reservations:', error);
        }
    }

    async function fetchAnalytics() {
        try {
            const res = await fetch('/api/analytics');
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    }

    async function fetchInitialData() {
        setLoading(true);
        try {
            await Promise.all([
                fetchUsers(),
                fetchResources(),
                fetchReservations(),
                fetchAnalytics(),
            ]);
            // Initial logs fetch
            fetchLogs();
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchLogs() {
        try {
            let url = `/api/reservations?status=${logsStatus}`;
            if (logsSearch) {
                url += `&search=${encodeURIComponent(logsSearch)}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.reservations);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
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
            fetchUsers();
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
            fetchUsers();
        } catch {
            toast.error('Failed to delete user');
        }
    };

    const handleApproveUser = async (user: User) => {
        try {
            const res = await fetch(`/api/users/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isApproved: true }),
            });

            if (!res.ok) throw new Error('Failed to approve user');

            toast.success('User approved');
            fetchUsers();
        } catch {
            toast.error('Failed to approve user');
        }
    };

    const handleRejectUser = async (user: User) => {
        if (!confirm(`Are you sure you want to REJECT ${user.name}? This will DELETE their account.`)) return;
        try {
            const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to reject user');
            toast.success('User rejected and deleted');
            fetchUsers();
        } catch {
            toast.error('Failed to reject user');
        }
    };

    // Resource handlers
    const openResourceDialog = (resource?: Resource) => {
        if (resource) {
            setEditingResource(resource);
            setResourceName(resource.name);
            setResourceDescription(resource.description);
            setResourceImage(resource.image || '');
            setResourceCollegeId(resource.collegeId || '');
            setResourceIsComputer(resource.isComputer || false);
            setResourceSystemUser(resource.systemUser || '');
            setResourceSystemIp(resource.systemIp || '');
            setResourcePassword(resource.password || '');
        } else {
            setEditingResource(null);
            setResourceName('');
            setResourceDescription('');
            setResourceImage('');
            setResourceCollegeId('');
            setResourceIsComputer(false);
            setResourceSystemUser('');
            setResourceSystemIp('');
            setResourcePassword('');
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
                    collegeId: resourceCollegeId || undefined,
                    isComputer: resourceIsComputer,
                    systemUser: resourceIsComputer ? (resourceSystemUser || undefined) : undefined,
                    systemIp: resourceIsComputer ? (resourceSystemIp || undefined) : undefined,
                    password: resourceIsComputer ? (resourcePassword || undefined) : undefined,
                }),
            });

            if (!res.ok) throw new Error('Failed to save resource');

            toast.success(editingResource ? 'Resource updated' : 'Resource created');
            setResourceDialogOpen(false);
            fetchResources();
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
            fetchResources();
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
            fetchReservations();
            fetchAnalytics();
            fetchLogs();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update reservation');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="h-64 bg-muted rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <Tabs defaultValue="reservations">
                <TabsList className="mb-4">
                    <TabsTrigger value="reservations" className="cursor-pointer">
                        Pending Reservations
                        {reservations.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {reservations.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="pending-users" className="cursor-pointer">
                        Pending Users
                        {users.filter(u => !u.isApproved).length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {users.filter(u => !u.isApproved).length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="users" className="cursor-pointer">Users ({users.filter(u => u.isApproved).length})</TabsTrigger>
                    <TabsTrigger value="resources" className="cursor-pointer">Resources ({resources.length})</TabsTrigger>
                    <TabsTrigger value="analysis" className="cursor-pointer">Analysis</TabsTrigger>
                    <TabsTrigger value="logs" className="cursor-pointer">Logs</TabsTrigger>
                </TabsList>

                {/* Pending Users Tab */}
                <TabsContent value="pending-users">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending User Approvals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {users.filter(u => !u.isApproved).length === 0 ? (
                                <p className="text-muted-foreground">No pending users</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.filter(u => !u.isApproved).map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell>
                                                    <Avatar>
                                                        <AvatarImage src={user.profilePicture} alt={user.name} />
                                                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApproveUser(user)}
                                                            className="cursor-pointer"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleRejectUser(user)}
                                                            className="cursor-pointer"
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
                                                        <p>{res.userId?.name || 'Deleted User'}</p>
                                                        <p className="text-xs text-muted-foreground">{res.userId?.email || 'N/A'}</p>
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
                                                            className="cursor-pointer"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReservation(res._id, 'rejected')}
                                                            className="cursor-pointer"
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
                            <Button onClick={() => openUserDialog()} className="cursor-pointer">Add User</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.filter(u => u.isApproved).map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell>
                                                <Avatar>
                                                    <AvatarImage src={user.profilePicture} alt={user.name} />
                                                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openUserDialog(user)}
                                                        className="cursor-pointer"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="cursor-pointer"
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
                            <Button onClick={() => openResourceDialog()} className="cursor-pointer">Add Resource</Button>
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
                                            <TableCell className="max-w-xs">
                                                <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground line-clamp-3 [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0 [&>li]:m-0">
                                                    <ReactMarkdown disallowedElements={['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img']}>
                                                        {resource.description}
                                                    </ReactMarkdown>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(new Date(resource.createdAt), 'MMM d, yyyy')}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openResourceDialog(resource)}
                                                        className="cursor-pointer"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteResource(resource._id)}
                                                        className="cursor-pointer"
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

                <TabsContent value="analysis">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        {/* Top Reservers by Count */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Reservers (Count)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Reservations</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics?.topReserversByCount.map((user, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <p>{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{user.value}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Top Reservers by Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Reservers (Time)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Duration (Hours)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics?.topReserversByTime.map((user, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <p>{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(user.value / (1000 * 60 * 60)).toFixed(1)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Top Resources by Count */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Resources (Count)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Resource</TableHead>
                                            <TableHead className="text-right">Reservations</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics?.topResourcesByCount.map((res, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{res.name}</TableCell>
                                                <TableCell className="text-right">{res.value}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Top Resources by Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Resources (Time)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Resource</TableHead>
                                            <TableHead className="text-right">Duration (Hours)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics?.topResourcesByTime.map((res, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{res.name}</TableCell>
                                                <TableCell className="text-right">
                                                    {(res.value / (1000 * 60 * 60)).toFixed(1)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Reservation Logs</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder="Search user or resource..."
                                    className="w-[250px]"
                                    value={logsSearch}
                                    onChange={(e) => setLogsSearch(e.target.value)}
                                />
                                <select
                                    className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={logsStatus}
                                    onChange={(e) => setLogsStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Resource</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Date Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((res) => (
                                        <TableRow key={res._id}>
                                            <TableCell className="font-medium">{res.resourceId.name}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p>{res.userId?.name || 'Deleted User'}</p>
                                                    <p className="text-xs text-muted-foreground">{res.userId?.email || 'N/A'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(res.startTime), 'MMM d, HH:mm')} -
                                                <br />
                                                {format(new Date(res.endTime), 'MMM d, HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        res.status === 'approved'
                                                            ? 'default'
                                                            : res.status === 'rejected'
                                                                ? 'destructive'
                                                                : 'secondary'
                                                    }
                                                >
                                                    {res.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={res.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                                    {res.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(res.createdAt), 'MMM d, yyyy HH:mm')}
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
                        <Button variant="outline" onClick={() => setUserDialogOpen(false)} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveUser} className="cursor-pointer">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resource Dialog */}
            <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={resourceName} onChange={(e) => setResourceName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>College ID (optional)</Label>
                            <Input
                                value={resourceCollegeId}
                                onChange={(e) => setResourceCollegeId(e.target.value)}
                                placeholder="Enter college ID"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Description</Label>
                            <Textarea
                                value={resourceDescription}
                                onChange={(e) => setResourceDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Image (optional)</Label>
                            <ImageUpload
                                value={resourceImage}
                                onChange={(url: string) => setResourceImage(url)}
                            />
                        </div>
                        <div className="flex items-center gap-2 col-span-2 py-2">
                            <Checkbox
                                id="isComputer"
                                checked={resourceIsComputer}
                                onCheckedChange={(c) => setResourceIsComputer(c === true)}
                            />
                            <Label htmlFor="isComputer">This is a computer</Label>
                        </div>
                        {resourceIsComputer && (
                            <>
                                <div className="space-y-2">
                                    <Label>User</Label>
                                    <Input
                                        value={resourceSystemUser}
                                        onChange={(e) => setResourceSystemUser(e.target.value)}
                                        placeholder="e.g. admin"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>System IP</Label>
                                    <Input
                                        value={resourceSystemIp}
                                        onChange={(e) => setResourceSystemIp(e.target.value)}
                                        placeholder="e.g. 192.168.1.100"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Password</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            value={resourcePassword}
                                            onChange={(e) => setResourcePassword(e.target.value)}
                                            placeholder="Enter system password"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0 cursor-pointer"
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResourceDialogOpen(false)} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveResource} className="cursor-pointer">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
