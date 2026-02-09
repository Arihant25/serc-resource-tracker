'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has dismissed the prompt before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="bg-card border border-border rounded-lg shadow-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">Install SERC Tracker</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Install our app for quick access and offline support
                        </p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleInstall} className="flex-1 cursor-pointer">
                                Install
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleDismiss} className="cursor-pointer">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
