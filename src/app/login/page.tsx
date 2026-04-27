"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        // Guardar información del usuario en localStorage para uso en el sistema
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirigir a la página de inicio personalizada o al dashboard por defecto
        window.location.href = data.user.redirectTo || "/dashboard-admin";
      } else {
        setError(data.error || "Fallo en la autenticación");
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-border bg-card shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center text-accent">
            IKATU LOGÍSTICA
          </CardTitle>
          <CardDescription className="text-muted text-center italic">
            Sistema de Gestión Logística
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-md mb-4 text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Input 
                id="email" 
                type="email" 
                placeholder="Correo Electrónico"
                className="bg-white border-border text-foreground focus:ring-accent h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="bg-white border-border text-foreground focus:ring-accent h-12 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button className="w-full bg-accent hover:brightness-105 text-white font-bold h-12 uppercase tracking-wide">
              Iniciar Sesión
            </Button>
            <div className="text-center">
              <a href="#" className="text-sm text-muted hover:text-accent">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
