'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CompleteReservationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    loading: boolean;
    resourceName: string;
}

export function CompleteReservationDialog({
    open,
    onOpenChange,
    onConfirm,
    loading,
    resourceName,
}: CompleteReservationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mark as Done?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to mark your reservation for {resourceName} as complete?
                        If you want to use it again, you&apos;ll have to reserve it again.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Completing...' : 'Yes, Mark as Done'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
