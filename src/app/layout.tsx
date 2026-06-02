import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { AppMain } from "@/components/AppMain";
import { Splash } from "@/components/Splash";
import { Onboarding } from "@/components/Onboarding";

export const metadata: Metadata = {
  title: "La Grille",
  description: "Le concours de pronos entre potes pour la Coupe du Monde 2026.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "La Grille" },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Splash />
        <Onboarding />
        <AppMain>{children}</AppMain>
        <BottomNav />
      </body>
    </html>
  );
}
