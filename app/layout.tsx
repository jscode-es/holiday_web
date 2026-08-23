import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { getWeather } from "@/lib/weather";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Japón 2026",
  description: "Itinerario del viaje a Japón, 27 sep - 16 oct 2026",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const weather = await getWeather();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen overflow-hidden bg-neutral-50 antialiased">
        <Sidebar weather={weather} />
        <main className="h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
