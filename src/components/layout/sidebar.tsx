"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ChevronDown, 
  ChevronRight, 
  Circle,
  LogOut,
  Truck
} from "lucide-react";
import * as Icons from "lucide-react";

interface MenuItem {
  menu_det_cod: number;
  menu_det_nombre: string;
  menu_det_url: string | null;
  menu_det_icono: string | null;
  menu_det_cod_padre: number | null;
  menu_det_det_orden: number;
  menu_det_estado: string | null;
}

let menuCache: MenuItem[] | null = null;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menuCache || []);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [empresa, setEmpresa] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(!menuCache);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const currentUser = userJson ? JSON.parse(userJson) : null;
    setUser(currentUser);

    const fetchEmpresa = async () => {
      try {
        const res = await fetch('/api/empresa');
        const data = await res.json();
        if (!data.error) setEmpresa(data);
      } catch (error) {
        console.error("Error loading empresa for sidebar:", error);
      }
    };
    fetchEmpresa();

    if (menuCache) {
      setLoading(false);
      return;
    }

    const fetchMenu = async () => {
      try {
        const menuId = currentUser?.menuId || currentUser?.perfilId || 1;
        
        const res = await fetch(`/api/admin/menus/${menuId}/detalles`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = data.sort((a,b) => a.menu_det_det_orden - b.menu_det_det_orden);
          menuCache = sorted;
          setMenuItems(sorted);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading sidebar menu:", error);
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const toggleExpand = (id: number) => {
    const next = new Set(expandedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedItems(next);
  };

  const getIcon = (name: string | null) => {
    if (!name) return <Circle className="h-5 w-5" />;
    const toPascalCase = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const IconComp = (Icons as any)[toPascalCase(name)] || (Icons as any)[name] || Icons.Circle;
    return <IconComp className="h-5 w-5" />;
  };

  const activeItems = menuItems.filter(i => i.menu_det_estado !== 'I');
  const parents = activeItems.filter(i => !i.menu_det_cod_padre);
  const getChildren = (id: number) => activeItems.filter(i => i.menu_det_cod_padre === id);

  const handleLogout = () => {
    menuCache = null;
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="glass-panel w-72 h-screen flex flex-col z-50 transition-all duration-300 border-r border-white/20 sticky top-0 shrink-0">
      
      {/* Sidebar Header / Logo */}
      <div className="p-8 flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold tracking-tight text-[#191c1e] uppercase">IKATU</span>
          <span className="text-xl font-light tracking-tight text-[#00aeef] uppercase">LOGÍSTICA</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500/80 ml-0.5 truncate">
          {empresa?.empresa_nom || "LOGISTICA SA"}
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {loading && (
          <div className="px-4 py-3 animate-pulse flex items-center gap-3">
            <div className="w-5 h-5 bg-slate-200 rounded-full" />
            <div className="h-4 bg-slate-200 rounded w-24" />
          </div>
        )}

        {parents.map(parent => {
          const children = getChildren(parent.menu_det_cod);
          const isExpanded = expandedItems.has(parent.menu_det_cod);
          const hasChildren = children.length > 0;
          const isActive = pathname === parent.menu_det_url || pathname.startsWith(parent.menu_det_url + "/");

          return (
            <div key={parent.menu_det_cod} className="flex flex-col gap-1">
              <div
                onClick={() => hasChildren && toggleExpand(parent.menu_det_cod)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                  isActive && !hasChildren 
                    ? "bg-[#00aeef] text-white shadow-lg shadow-[#00aeef]/20" 
                    : "text-slate-600 hover:bg-white/40 hover:text-[#191c1e]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`${isActive && !hasChildren ? "text-white" : "text-[#00aeef] group-hover:scale-110 transition-transform"}`}>
                    {getIcon(parent.menu_det_icono)}
                  </span>
                  {parent.menu_det_url && !hasChildren ? (
                    <Link href={parent.menu_det_url} className="font-medium text-sm truncate">
                      {parent.menu_det_nombre}
                    </Link>
                  ) : (
                    <span className="font-medium text-sm truncate">{parent.menu_det_nombre}</span>
                  )}
                </div>
                {hasChildren && (
                  <span className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </span>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="ml-9 flex flex-col gap-1 mt-1 mb-2 border-l border-white/20 pl-3">
                  {children.map(child => {
                    const childUrl = child.menu_det_url?.startsWith('/') ? child.menu_det_url : `/${child.menu_det_url}`;
                    const isSubActive = pathname === childUrl;
                    
                    return (
                      <Link
                        key={child.menu_det_cod}
                        href={childUrl}
                        className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                          isSubActive
                            ? "text-[#00aeef] bg-white/60 shadow-sm" 
                            : "text-slate-500 hover:text-[#191c1e] hover:bg-white/30"
                        }`}
                      >
                        {child.menu_det_nombre}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-white/10 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#eceef0] flex items-center justify-center shrink-0 border border-white/40">
              <Icons.User className="h-5 w-5 text-[#6e7881]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{user?.nombre || "Usuario"}</span>
              <span className="text-[11px] text-[#6e7881] font-medium uppercase tracking-wider">
                {user?.perfil || "Admin"}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
            title="Cerrar Sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
