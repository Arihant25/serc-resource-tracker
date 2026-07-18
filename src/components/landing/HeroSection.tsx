'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const boardItems = [
    { name: 'GPU server', detail: 'A100 · 80GB', free: true, note: 'Free now' },
    { name: 'Jetson Orin devkit', detail: 'Edge bench', free: false, note: 'In use · until 4:00 pm' },
    { name: 'Quest 3 headset', detail: 'XR shelf', free: true, note: 'Free now' },
    { name: 'Pixel 8', detail: 'Test device', free: false, note: 'In use · until 6:30 pm' },
];

function LabBoard() {
    const reduceMotion = useReducedMotion();
    // A beat after load, the Jetson comes back — the product's whole point in one moment.
    const [returned, setReturned] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReturned(true), 2600);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="w-full max-w-sm" aria-hidden="true">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground mb-3 pl-1">
                The lab, right now
            </p>
            <div className="flex flex-col gap-2.5">
                {boardItems.map((item, i) => {
                    const isFree = item.name === 'Jetson Orin devkit' ? returned : item.free;
                    const note = item.name === 'Jetson Orin devkit' && returned ? 'Free · returned just now' : item.note;
                    return (
                        <motion.div
                            key={item.name}
                            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: 'easeOut' }}
                            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                        >
                            <span
                                className={`status-dot ${isFree ? 'status-dot-live' : 'status-dot-busy'}`}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-tight truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{item.detail}</p>
                            </div>
                            <motion.p
                                key={note}
                                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-xs font-medium whitespace-nowrap ${isFree ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                {note}
                            </motion.p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export function HeroSection() {
    const reduceMotion = useReducedMotion();

    return (
        <section className="relative px-4 pt-16 pb-20 md:pt-28 md:pb-28">
            <div className="container mx-auto max-w-6xl">
                <div className="grid items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="max-w-xl"
                    >
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground mb-5">
                            Software Engineering Research Center · IIIT Hyderabad
                        </p>
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] text-balance">
                            Know what&rsquo;s free before you cross the lab.
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
                            Every shared machine and device in SERC, with live availability
                            and one-tap reservations. Walk over only when it&rsquo;s yours.
                        </p>
                        <div className="mt-9 flex flex-wrap items-center gap-4">
                            <Button asChild size="lg" className="h-12 px-7 text-base rounded-full">
                                <Link href="/login">
                                    Sign in to reserve <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="h-12 px-5 text-base rounded-full text-muted-foreground hover:text-foreground">
                                <Link href="#how-it-works">See how it works</Link>
                            </Button>
                        </div>
                    </motion.div>

                    <div className="justify-self-center lg:justify-self-end w-full max-w-sm">
                        <LabBoard />
                    </div>
                </div>
            </div>
        </section>
    );
}
