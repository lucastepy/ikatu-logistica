import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "../components/layout/LayoutWrapper";

export const metadata: Metadata = {
  title: "Ikatu Logística - Administración",
  description: "Sistema de gestión de entidades y pagos digitales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-sans">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
