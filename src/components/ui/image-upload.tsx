'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('File must be an image');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            toast.error('Image must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                onChange(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        onChange('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            {value ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    <Button
                        type="button"
                        onClick={handleRemove}
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 z-10 h-6 w-6 cursor-pointer"
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt="Upload"
                        className="h-full w-full object-cover"
                    />
                </div>
            ) : (
                <div
                    onClick={() => !disabled && inputRef.current?.click()}
                    onDrop={!disabled ? onDrop : undefined}
                    onDragOver={!disabled ? onDragOver : undefined}
                    onDragLeave={!disabled ? onDragLeave : undefined}
                    className={cn(
                        "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors",
                        isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:bg-muted/50",
                        disabled && "cursor-not-allowed opacity-60"
                    )}
                >
                    <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                        <div className="rounded-full bg-background p-4 shadow-sm">
                            {isDragActive ? (
                                <Upload className="h-6 w-6 text-primary" />
                            ) : (
                                <ImageIcon className="h-6 w-6" />
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">
                                {isDragActive ? "Drop image here" : "Click to upload or drag and drop"}
                            </span>
                            <span className="text-xs">
                                SVG, PNG, JPG or GIF (max. 2MB)
                            </span>
                        </div>
                    </div>
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />
        </div>
    );
}
