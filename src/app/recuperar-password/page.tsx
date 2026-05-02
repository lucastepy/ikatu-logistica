"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Lock, 
  ArrowLeft, 
  ShieldCheck, 
  Headset, 
  HelpCircle,
  Loader2,
  Mail,
  CheckCircle2
} from "lucide-react";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulación de envío
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e] flex flex-col antialiased relative overflow-hidden">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#f7f9fb]"></div>
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(0, 174, 239, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(130, 207, 255, 0.1) 0px, transparent 50%)
          `
        }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00aeef] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#00aeef]">Ikatu Logística</span>
          </div>
          <nav>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-all text-slate-500">
              <HelpCircle className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-32 relative z-10">
        {/* Decorative Elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#00aeef]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#dae2fd]/20 rounded-full blur-3xl"></div>

        <div className="w-full max-w-lg">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,101,141,0.08)] p-8 md:p-12 rounded-[2rem] text-center transition-all duration-500">
            {!isSent ? (
              <>
                <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#00aeef]/10 text-[#00aeef]">
                  <Lock className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-bold text-[#191c1e] mb-4 tracking-tight">Recuperar Contraseña</h1>
                <p className="text-slate-500 mb-8 px-4 font-medium leading-relaxed">
                  Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1" htmlFor="email">Correo electrónico</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#00aeef] transition-colors" />
                      <input 
                        className="w-full pl-12 pr-4 py-4 bg-white/60 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00aeef]/10 focus:border-[#00aeef] focus:bg-white transition-all outline-none text-[#191c1e] font-medium placeholder:text-slate-300" 
                        id="email" 
                        placeholder="nombre@empresa.com" 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-[#00aeef] text-white font-bold rounded-2xl shadow-xl shadow-[#00aeef]/20 hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2" 
                    type="submit"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Enviar instrucciones"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="animate-in zoom-in duration-500">
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-bold text-[#191c1e] mb-4 tracking-tight">¡Correo Enviado!</h1>
                <p className="text-slate-500 mb-8 px-4 font-medium leading-relaxed">
                  Hemos enviado las instrucciones de recuperación a <span className="text-[#00aeef] font-bold">{email}</span>. Revisa tu bandeja de entrada.
                </p>
                <button onClick={() => setIsSent(false)} className="rounded-2xl h-12 px-8 border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all mx-auto block">
                  Reintentar con otro correo
                </button>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-slate-100/50">
              <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#00658d] hover:text-[#00aeef] transition-all group" href="/login">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>

          {/* Supporting Visual (Bento Style) */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 flex items-center gap-4 transition-all hover:bg-white/50">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#191c1e] uppercase tracking-tight">Seguridad Avanzada</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">Encriptación de extremo a extremo.</p>
              </div>
            </div>
            <div className="bg-white/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 flex items-center gap-4 transition-all hover:bg-white/50">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Headset className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#191c1e] uppercase tracking-tight">Soporte 24/7</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">Estamos aquí para ayudarte.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-slate-200/20 py-8 px-6 bg-white/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-sm font-black text-slate-800 tracking-tighter uppercase">Ikatu Logística</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2024 Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-8 items-center">
            <Link className="text-[10px] font-bold text-slate-400 hover:text-[#00aeef] transition-colors uppercase" href="#">Privacidad</Link>
            <Link className="text-[10px] font-bold text-slate-400 hover:text-[#00aeef] transition-colors uppercase" href="#">Términos</Link>
            <Link className="text-[10px] font-bold text-slate-400 hover:text-[#00aeef] transition-colors uppercase" href="#">Ayuda</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
