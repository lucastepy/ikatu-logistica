"use client";

import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0b0f19] overflow-hidden">
      {/* Sidebar Oscuro Exclusivo */}
      <AdminSidebar />

      {/* Main Content Area con fondo oscuro premium */}
      <main className="flex-1 overflow-y-auto scroll-smooth dark">
        {/* Usamos 'dark' class para forzar el tema oscuro si usas tailwind darkMode: 'class' */}
        {children}
      </main>
    </div>
  );
}
