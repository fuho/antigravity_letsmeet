import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LetsMeet",
  description: "Find the optimal meeting point for your friends.",
};

import { DebugProvider } from "@/components/debug/DebugContext";
import DebugOverlay from "@/components/debug/DebugOverlay";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-hidden bg-black text-white`}>
        <DebugProvider>
          <DebugOverlay />
          {children}
        </DebugProvider>
      </body>
    </html>
  );
}
