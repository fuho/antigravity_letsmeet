import React from "react";
import AppMap from "@/components/Map";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-black">
      {/* Map Layer (Background) */}
      <div className="absolute inset-0 z-0">
        <AppMap />
      </div>

      {/* UI Layer */}
      <Sidebar />
    </main>
  );
}
