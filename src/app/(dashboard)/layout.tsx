export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Eliminamos el Sidebar de aquí porque ya lo maneja el LayoutWrapper global
  return <>{children}</>;
}
