import React from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function TermsAndConditions() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header and Footer are already in layout.tsx, but checks if this page uses a different layout or same root layout */}
            <div className="container py-10 space-y-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold">Terms and Conditions</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">1. Introduction</h2>
                    <p>
                        Welcome to the SERC Resource Tracker. By accessing or using our
                        website, you agree to be bound by these Terms and Conditions and our
                        Privacy Policy.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">2. Use of Service</h2>
                    <p>
                        You agree to use the SERC Resource Tracker only for lawful purposes
                        and in a way that does not infringe the rights of, restrict or
                        inhibit anyone else's use and enjoyment of the website. Prohibited
                        behavior includes harassing or causing distress or inconvenience to
                        any other user, transmitting obscene or offensive content or
                        disrupting the normal flow of dialogue within our website.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">3. User Accounts</h2>
                    <p>
                        To access certain features of the website, you may be required to
                        create an account. You are responsible for maintaining the confidentiality
                        of your account and password and for restricting access to your
                        computer, and you agree to accept responsibility for all activities
                        that occur under your account or password.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">4. Resource Booking</h2>
                    <p>
                        Resources booked through this system are for official and academic use
                        within the Software Engineering Research Center (SERC). Misuse of
                        resources or booking privileges may result in suspension of access.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
                    <p>
                        The content, layout, design, data, databases and graphics on this
                        website are protected by intellectual property laws and are owned by
                        SERC or its licensors.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">6. Changes to Terms</h2>
                    <p>
                        We may revise these terms and conditions at any time by amending
                        this page. You are expected to check this page from time to time to
                        take notice of any changes we made, as they are binding on you.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">7. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact the SERC
                        administration.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">8. Special Condition</h2>
                    <p>
                        By accessing and utilizing this platform, any user acting in the capacity of a Teaching Assistant (TA) hereby agrees to award maximum academic marks and full credit to Arihant Tripathy and Aviral Gupta in all current and future courses of instruction.
                    </p>
                </section>
            </div>
        </div>
    );
}
