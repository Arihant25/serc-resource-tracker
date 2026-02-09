'use client';

import { motion } from 'framer-motion';
import { Calendar, Search, Bell, History, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists, standard in shadcn

const features = [
    {
        title: "Real-time Availability",
        description: "Instantly see what's free and what's booked. No more guessing games.",
        icon: Search,
        className: "md:col-span-2",
    },
    {
        title: "Smart Reservations",
        description: "Book equipment with ease. Set priorities and recurring slots.",
        icon: Calendar,
        className: "md:col-span-1",
    },
    {
        title: "Instant Notifications",
        description: "Get alerted via push notifications when your request is approved.",
        icon: Bell,
        className: "md:col-span-1",
    },
    {
        title: "History & Logs",
        description: "Keep track of all your past usage and project allocations.",
        icon: History,
        className: "md:col-span-2",
    },
];

export function FeaturesGrid() {
    return (
        <section id="features" className="py-24 px-4 relative z-10">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
                    <p className="text-xl text-muted-foreground">Built for the modern researcher.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl p-8 bg-card/50 border border-border/50 hover:bg-card/80 transition-all duration-300 backdrop-blur-md shadow-sm hover:shadow-md",
                                feature.className
                            )}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <feature.icon className="w-24 h-24" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
