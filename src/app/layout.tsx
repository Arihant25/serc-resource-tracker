import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/InstallPrompt";

const GA_MEASUREMENT_ID = "G-RH1GJSTLPW";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1A1A1A", // Code Night from design system
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SERC Resource Tracker",
  description: "Track and reserve resources at Software Engineering Research Center, IIIT Hyderabad",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SERC Tracker",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolved here so the client never has to spend a round trip asking who it is.
  const currentUser = await getCurrentUser();
  const initialUser = currentUser
    ? {
      id: currentUser._id.toString(),
      name: currentUser.name,
      email: currentUser.email,
      profilePicture: currentUser.profilePicture,
      isAdmin: currentUser.isAdmin,
    }
    : null;

  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${figtree.variable} ${bricolage.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider initialUser={initialUser}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-right" />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
