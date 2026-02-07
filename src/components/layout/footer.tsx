export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} SERC Resource Tracker. IIIT Hyderabad.
                </p>
                <p className="text-xs text-muted-foreground">
                    Built for Software Engineering Research Center
                </p>
            </div>
        </footer>
    );
}
