'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6 max-w-4xl relative z-10"
            >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 pb-2">
                    SERC Resource <br />
                    <span className="text-primary italic">Tracker</span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Seamlessly discover, reserve, and manage lab equipment.
                    Focus on your research, not the logistics.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                    <Button asChild size="lg" className="h-14 px-12 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all cursor-pointer">
                        <Link href="/login">
                            Get Started <ArrowRight className="mb-0.5 w-5 h-5" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50 hover:bg-background/80 cursor-pointer">
                        <Link href="#features">
                            Explore Features
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </section>
    );
}
