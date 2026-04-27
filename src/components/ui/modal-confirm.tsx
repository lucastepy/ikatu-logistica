"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <Button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold border-none">
            Eliminar Ahora
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 text-slate-600 font-bold">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
