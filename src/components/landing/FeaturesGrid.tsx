'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Flag, History } from 'lucide-react';

const steps = [
    {
        title: 'Check the board',
        description:
            'Every shared machine and device in one list, each with a live dot: green means walk over, amber means someone got there first.',
    },
    {
        title: 'Reserve your slot',
        description:
            'Pick a start and end time and say what it’s for. If a machine is busy, you can queue up behind the current reservation.',
    },
    {
        title: 'Use it, then hand it back',
        description:
            'Mark the reservation complete when you’re done and the dot turns green for the next person. No sticky notes, no group chat.',
    },
];

const extras = [
    {
        icon: Bell,
        text: 'Email notifications the moment your request is approved',
    },
    {
        icon: Flag,
        text: 'Urgent flags for deadline weeks, visible to everyone',
    },
    {
        icon: History,
        text: 'Full usage history for every machine in the lab',
    },
];

export function FeaturesGrid() {
    const reduceMotion = useReducedMotion();

    return (
        <section id="how-it-works" className="px-4 pb-24 md:pb-32">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="max-w-xl mb-14"
                >
                    <h2 className="font-display text-3xl md:text-4xl font-bold">
                        From &ldquo;is it free?&rdquo; to &ldquo;it&rsquo;s yours&rdquo;
                    </h2>
                </motion.div>

                <div className="grid gap-10 md:grid-cols-3 md:gap-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.title}
                            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                            className="border-t-2 border-primary/20 pt-6"
                        >
                            <p className="text-sm font-semibold text-primary mb-3">
                                Step {i + 1}
                            </p>
                            <h3 className="font-display text-xl font-semibold mb-2.5">
                                {step.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mt-16 rounded-2xl border bg-card px-6 py-5 md:px-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-10"
                >
                    {extras.map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Icon className="w-4 h-4 shrink-0 text-primary" />
                            <span>{text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
