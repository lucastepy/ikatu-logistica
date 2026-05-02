"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  MenuSquare, 
  Settings, 
  LogOut, 
  ShieldAlert,
  ListTree,
  Settings2,
  Coins,
  Mail
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Clientes SaaS", href: "/admin/clientes-saas", icon: Building2 },
    { name: "Modelos de Negocio", href: "/admin/planes", icon: Settings2 },
    { name: "Monedas", href: "/admin/monedas", icon: Coins },
    { name: "Perfiles Globales", href: "/admin/perfiles", icon: ShieldAlert },
    { name: "Usuarios Tenant", href: "/admin/users", icon: Users },
    { name: "Menús del Sistema", href: "/admin/menus", icon: MenuSquare },
    { name: "Restricciones de Campos", href: "/admin/restricciones", icon: ShieldAlert },
    { name: "Log de Correos", href: "/admin/logs/email", icon: Mail },
    { name: "Parámetros", href: "/admin/parametros", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#020617] border-r border-slate-800 flex flex-col h-full text-slate-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-1.5 rounded-lg border border-red-500/30">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <span className="font-bold text-white tracking-tight">Súper Admin</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 px-2">Core SaaS</div>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700" 
                  : "hover:bg-slate-900 hover:text-white border border-transparent"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-red-400" : "text-slate-500"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <Link 
          href="/login-admin" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-bold"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Link>
      </div>
    </aside>
  );
}
