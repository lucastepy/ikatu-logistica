"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Cloud, Rocket, HelpCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = data.user.redirectTo || "/dashboard-admin";
      } else {
        setError(data.error || "Fallo en la autenticación");
        setLoading(false);
      }
    } catch (err) {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#f7f9fb]" />;

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e] selection:bg-[#00aeef]/30 flex flex-col items-center justify-center relative overflow-hidden antialiased">
      {/* Definición de estilos persistentes sin styled-jsx */}
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-panel {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 32px 0 rgba(0, 101, 141, 0.08);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}} />

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-[#00aeef]" />
          <span className="text-xl font-bold tracking-tight text-[#00aeef]">Ikatu Logística</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/50 transition-colors active:scale-95 duration-200 text-slate-500">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-lg px-6 z-10 flex flex-col items-center">
        {/* Login Card */}
        <div className="glass-panel w-full rounded-[32px] p-8 md:p-12 flex flex-col items-center gap-8">
          {/* Brand & Heading */}
          <div className="text-center">
            <div className="w-16 h-16 bg-[#00aeef] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#00aeef]/20 mx-auto transform hover:rotate-12 transition-transform duration-300">
              <Rocket className="h-9 w-9 text-white fill-white/20" />
            </div>
            <h1 className="text-4xl font-bold text-[#191c1e] mb-2 tracking-tight">Acceso al Sistema</h1>
            <p className="text-slate-500 font-medium">Gestiona tu entorno logístico con precisión</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="w-full space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold rounded-xl text-center animate-shake uppercase tracking-widest">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1" htmlFor="email">Correo Electrónico</label>
              <div className="relative group">
                <input 
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00aeef]/10 focus:border-[#00aeef] focus:bg-white transition-all outline-none text-sm placeholder:text-slate-300 shadow-sm" 
                  id="email" 
                  placeholder="nombre@ikatu.com.py" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-1" htmlFor="password">Contraseña</label>
              <div className="relative group">
                <input 
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00aeef]/10 focus:border-[#00aeef] focus:bg-white transition-all outline-none text-sm placeholder:text-slate-300 shadow-sm pr-12" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#00aeef] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link className="text-[11px] font-bold text-slate-400 hover:text-[#00aeef] transition-colors underline underline-offset-4 decoration-[#00aeef]/20 uppercase tracking-tighter" href="/recuperar-password">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button 
              className="w-full py-4 px-8 bg-[#00aeef] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:shadow-2xl hover:shadow-[#00aeef]/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PROCESANDO...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-white/40 w-full text-center">
            <p className="text-xs font-medium text-slate-400">
              ¿No tienes una cuenta? {" "}
              <a className="text-[#00aeef] font-bold hover:underline transition-all" href="#">Contactar Soporte</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full flex flex-col md:flex-row justify-between items-center px-8 py-8 gap-4 bg-transparent pointer-events-none">
        <div className="text-xs font-black text-slate-300 uppercase tracking-widest">Ikatu Logística SaaS</div>
        <div className="flex gap-6 pointer-events-auto">
          <a className="text-[10px] font-bold text-slate-300 hover:text-[#00aeef] transition-colors uppercase" href="#">Privacidad</a>
          <a className="text-[10px] font-bold text-slate-300 hover:text-[#00aeef] transition-colors uppercase" href="#">Términos</a>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase">© 2024 IKATU. Todos los derechos reservados.</div>
      </footer>

      {/* Background Elements for Visual Pop */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#00aeef]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#5c647a]/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}
