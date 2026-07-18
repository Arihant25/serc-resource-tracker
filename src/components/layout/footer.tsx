import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t py-6 flex justify-center">
            <div className="container px-4 flex flex-col items-center justify-between gap-2 md:flex-row">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} SERC Resource Tracker · IIIT Hyderabad
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Built for the Software Engineering Research Center</span>
                    <span aria-hidden="true">·</span>
                    <Link href="/tnc" className="text-muted-foreground underline underline-offset-2 decoration-border hover:text-foreground hover:decoration-current">
                        Terms
                    </Link>
                </div>
            </div>
        </footer>
    );
}
