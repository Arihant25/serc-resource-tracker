'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface AdminContact {
    name: string;
    email: string;
}

export default function LoginPage() {
    const router = useRouter();
    const { user, login, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAdminDialog, setShowAdminDialog] = useState(false);
    const [adminList, setAdminList] = useState<AdminContact[]>([]);

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router]);

    // Show loading or nothing while checking auth
    if (authLoading) {
        return (
            <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
                <div>Loading...</div>
            </div>
        );
    }

    // Don't render login form if user is authenticated
    if (user) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(email, password);
            toast.success('Welcome back!');
            router.push('/dashboard');
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            if (err.admins) {
                setAdminList(err.admins);
                setShowAdminDialog(true);
            } else {
                toast.error(error instanceof Error ? error.message : 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to your SERC Resource Tracker account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@iiit.ac.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                First time logging in? Enter your desired password to set it up.
                            </p>
                        </div>
                        <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Account Pending Approval</DialogTitle>
                        <DialogDescription>
                            Your account needs to be approved by an administrator before you can log in.
                            Please contact one of the following admins:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-3">
                        {adminList.map((admin, idx) => (
                            <div key={idx} className="flex flex-col bg-muted p-3 rounded-md">
                                <span className="font-medium">{admin.name}</span>
                                <span className="text-sm text-muted-foreground">{admin.email}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={() => setShowAdminDialog(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
