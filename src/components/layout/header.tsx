'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center">
            <div className="px-4 container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 cursor-pointer">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-primary">
                            <Image src="/logo.png" alt="SERC Tracker" width={36} height={36} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-bold text-xl hidden sm:inline-block">SERC Tracker</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full cursor-pointer">
                                    <Avatar className="h-10 w-10">
                                        {user.profilePicture && (
                                            <AvatarImage
                                                src={user.profilePicture}
                                                alt={user.name}
                                            />
                                        )}
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <div className="flex flex-col space-y-1 p-2">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer">Settings</Link>
                                </DropdownMenuItem>
                                {user.isAdmin && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin" className="cursor-pointer">Admin</Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 cursor-pointer data-[highlighted]:bg-red-50 data-[highlighted]:text-red-600"
                                >
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild>
                            <Link href="/login" className="cursor-pointer">Sign In</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
