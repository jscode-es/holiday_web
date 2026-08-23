import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-200 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-350 flex-col bg-white p-3 sm:p-4">
          <div className="flex flex-1 flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <Nav />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
