"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "dark" | "light"; // Añadimos soporte para variantes
}

export function CustomModal({ isOpen, onClose, title, description, icon: Icon, children, className, variant = "light" }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Estilos basados en la variante
  const isLight = variant === "light";
  
  const backdropClass = isLight 
    ? "bg-slate-900/10 backdrop-blur-md" 
    : "bg-slate-950/40 backdrop-blur-md";
    
  const containerClass = isLight
    ? "bg-white/90 border-white/50 ring-1 ring-slate-100 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)]"
    : "bg-slate-950 border-slate-800/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]";
    
  const headerClass = isLight
    ? "border-slate-100 bg-slate-50/30"
    : "border-slate-800/50 bg-slate-900/20";
    
  const titleClass = isLight
    ? "text-slate-700 font-bold tracking-tight"
    : "text-white font-black tracking-tighter uppercase italic";
    
  const descClass = isLight
    ? "text-slate-400"
    : "text-slate-500";

  const closeBtnClass = isLight
    ? "border-slate-100 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600"
    : "border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-500 hover:text-white";

  const modalContent = (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 ${backdropClass}`}>
      <div className={`${containerClass} rounded-[2.5rem] w-full overflow-hidden animate-in zoom-in-95 duration-300 border ${className || 'max-w-lg'}`}>
        <div className={`flex items-start justify-between p-8 border-b ${headerClass}`}>
          <div className="flex items-center gap-4">
            {Icon && (
              <div className={`${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'} p-3 rounded-2xl border shadow-inner`}>
                <Icon className={`h-6 w-6 ${isLight ? 'text-accent' : 'text-slate-400'}`} />
              </div>
            )}
            <div>
              <h2 className={`text-xl leading-none ${titleClass}`}>{title}</h2>
              {description && (
                <p className={`text-[11px] font-bold mt-1.5 uppercase tracking-widest opacity-80 ${descClass}`}>{description}</p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full border transition-all active:scale-95 shadow-lg ${closeBtnClass}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-10 max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
