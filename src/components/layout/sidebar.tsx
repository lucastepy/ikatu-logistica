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
  const [loading, setLoading] = useState(!menuCache);

  useEffect(() => {
    if (menuCache) {
      setLoading(false);
      return;
    }

    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/admin/menus/1/detalles");
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
    if (!name) return <Circle className="h-4 w-4" />;
    const toPascalCase = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const IconComp = (Icons as any)[toPascalCase(name)] || (Icons as any)[name] || Icons.Circle;
    return <IconComp className="h-4 w-4" />;
  };

  const activeItems = menuItems.filter(i => i.menu_det_estado !== 'I');
  const parents = activeItems.filter(i => !i.menu_det_cod_padre);
  const getChildren = (id: number) => activeItems.filter(i => i.menu_det_cod_padre === id);

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 shrink-0">
      
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#00A3E0] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-[#101828] font-black tracking-tighter text-xl leading-none italic uppercase">IKATU</h2>
            <p className="text-[10px] text-[#00A3E0] font-black uppercase tracking-widest mt-0.5">Logística</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {loading && <p className="text-xs text-slate-400 italic p-4">Cargando navegación...</p>}

        {parents.map(parent => {
          const children = getChildren(parent.menu_det_cod);
          const isExpanded = expandedItems.has(parent.menu_det_cod);
          const hasChildren = children.length > 0;
          const isActive = pathname.startsWith(parent.menu_det_url || "_none");

          return (
            <div key={parent.menu_det_cod} className="space-y-0.5">
              <button
                onClick={() => hasChildren && toggleExpand(parent.menu_det_cod)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  isActive && !hasChildren 
                    ? "bg-slate-100 text-[#101828] font-black" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#101828]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={isActive ? "text-[#00A3E0]" : "text-slate-400"}>
                    {getIcon(parent.menu_det_icono)}
                  </div>
                  {parent.menu_det_url && !hasChildren ? (
                    <Link href={parent.menu_det_url.startsWith('/') ? parent.menu_det_url : `/${parent.menu_det_url}`} className="text-[13px] font-semibold tracking-tight truncate">
                      {parent.menu_det_nombre}
                    </Link>
                  ) : (
                    <span className="text-[13px] font-semibold tracking-tight truncate">{parent.menu_det_nombre}</span>
                  )}
                </div>
                {hasChildren && (
                  isExpanded ? <ChevronDown className="h-4 w-4 opacity-30" /> : <ChevronRight className="h-4 w-4 opacity-30" />
                )}
              </button>

              {hasChildren && isExpanded && (
                <div className="ml-7 space-y-0.5 border-l border-slate-100 pl-3">
                  {children.map(child => {
                    const absoluteUrl = child.menu_det_url ? (child.menu_det_url.startsWith('/') ? child.menu_det_url : `/${child.menu_det_url}`) : "#";
                    const isSubActive = pathname === absoluteUrl;
                    
                    return (
                      <Link
                        key={child.menu_det_cod}
                        href={absoluteUrl}
                        className={`block px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                          isSubActive
                            ? "text-[#00A3E0] bg-blue-50/50" 
                            : "text-slate-500 hover:text-[#00A3E0] hover:bg-slate-50"
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

      {/* Footer con CERRAR SESIÓN */}
      <div className="mt-auto">
        <div className="p-4 bg-slate-50/30 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-xs uppercase tracking-widest group"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
