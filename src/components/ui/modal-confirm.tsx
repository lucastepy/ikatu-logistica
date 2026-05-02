"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  variant?: "dark" | "light";
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description, variant = "light" }: ConfirmModalProps) {
  if (!isOpen) return null;

  const isLight = variant === "light";

  const backdropClass = isLight 
    ? "bg-slate-900/10 backdrop-blur-md" 
    : "bg-slate-950/80 backdrop-blur-md";

  const containerClass = isLight
    ? "bg-white/90 border-white/50 ring-1 ring-slate-100 shadow-[0_30px_100px_-10px_rgba(0,0,0,0.25)]"
    : "bg-slate-900 border-slate-800 shadow-2xl";

  const titleClass = isLight ? "text-slate-700 font-bold" : "text-white font-black uppercase tracking-tighter italic";
  const descClass = isLight ? "text-slate-500 italic" : "text-slate-400 font-medium";

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 ${backdropClass}`}>
      <div className={`rounded-[2.5rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border ${containerClass}`}>
        <div className="p-10 text-center">
          <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border shadow-sm ${isLight ? 'bg-red-50 text-red-500 border-red-100' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h2 className={`text-2xl mb-2 tracking-tight ${titleClass}`}>{title}</h2>
          <p className={`text-sm leading-relaxed ${descClass}`}>
            {description}
          </p>
        </div>
        <div className="flex gap-4 p-10 pt-0">
          <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold h-14 rounded-2xl uppercase tracking-tighter transition-all active:scale-95 shadow-lg shadow-red-200">
            Eliminar Ahora
          </Button>
          <Button variant="outline" onClick={onClose} className={`flex-1 font-bold h-14 rounded-2xl uppercase tracking-tighter transition-all active:scale-95 ${isLight ? 'border-slate-100 bg-white text-slate-400 hover:text-slate-600' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white'}`}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
