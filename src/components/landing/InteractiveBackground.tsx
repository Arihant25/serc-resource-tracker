export function InteractiveBackground() {
    return (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div
                className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full opacity-60 dark:opacity-25"
                style={{
                    background:
                        'radial-gradient(closest-side, oklch(0.9 0.06 155 / 0.5), transparent)',
                }}
            />
        </div>
    );
}
