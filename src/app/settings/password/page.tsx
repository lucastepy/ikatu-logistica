"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function PasswordChangePage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-zinc-950 border-zinc-800 text-white shadow-xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
            <Lock className="h-6 w-6 text-[#cc0000]" />
          </div>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription className="text-zinc-400">
            Asegura tu cuenta con una credencial robusta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Contraseña Actual</Label>
            <Input type="password" placeholder="••••••••" className="bg-zinc-900 border-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label>Nueva Contraseña</Label>
            <Input type="password" placeholder="••••••••" className="bg-zinc-900 border-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label>Confirmar Nueva Contraseña</Label>
            <Input type="password" placeholder="••••••••" className="bg-zinc-900 border-zinc-800" />
          </div>
          <Button className="w-full bg-[#cc0000] hover:bg-[#b00000] mt-2">
            Actualizar Credencial
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
