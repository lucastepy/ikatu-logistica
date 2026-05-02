"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname === "/login-admin";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
