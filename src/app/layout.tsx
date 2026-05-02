import type { Metadata } from "next";
import "./globals.css";

import TenantInterceptor from "@/components/auth/TenantInterceptor";

export const metadata: Metadata = {
  title: "Ikatu Logística",
  description: "Sistema de gestión",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-sans bg-[#f7fafe]">
        <TenantInterceptor />
        {children}
      </body>
    </html>
  );
}
