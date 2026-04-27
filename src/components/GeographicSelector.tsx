"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface GeographicItem {
  dep_cod?: number;
  dep_dsc?: string;
  dis_cod?: number;
  dis_dsc?: string;
  ciu_cod?: number;
  ciu_dsc?: string;
  bar_cod?: number;
  bar_dsc?: string;
}

export function GeographicSelector({ onSelect }: { onSelect: (geo: any) => void }) {
  const [departamentos, setDepartamentos] = useState<GeographicItem[]>([]);
  const [distritos, setDistritos] = useState<GeographicItem[]>([]);
  const [ciudades, setCiudades] = useState<GeographicItem[]>([]);
  const [barrios, setBarrios] = useState<GeographicItem[]>([]);

  const [selection, setSelection] = useState({
    dep: "",
    dis: "",
    ciu: "",
    bar: ""
  });

  // Simulation of API calls (Replace with actual fetch from /api/geo)
  useEffect(() => {
    // Initial load: Departamentos
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Departamento</Label>
        <Select onValueChange={(val: string) => setSelection({ ...selection, dep: val, dis: "", ciu: "", bar: "" })}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
            <SelectValue placeholder="Seleccionar Depto" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            {departamentos.map((d: GeographicItem) => (
              <SelectItem key={d.dep_cod} value={d.dep_cod?.toString() ?? ""}>{d.dep_dsc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Distrito</Label>
        <Select disabled={!selection.dep} onValueChange={(val: string) => setSelection({ ...selection, dis: val, ciu: "", bar: "" })}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
            <SelectValue placeholder="Seleccionar Distrito" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            {distritos.map((d: GeographicItem) => (
              <SelectItem key={d.dis_cod} value={d.dis_cod?.toString() ?? ""}>{d.dis_dsc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ciudad</Label>
        <Select disabled={!selection.dis} onValueChange={(val: string) => setSelection({ ...selection, ciu: val, bar: "" })}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
            <SelectValue placeholder="Seleccionar Ciudad" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            {ciudades.map((c: GeographicItem) => (
              <SelectItem key={c.ciu_cod} value={c.ciu_cod?.toString() ?? ""}>{c.ciu_dsc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Barrio</Label>
        <Select disabled={!selection.ciu} onValueChange={(val: string) => setSelection({ ...selection, bar: val })}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
            <SelectValue placeholder="Seleccionar Barrio" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            {barrios.map((b: GeographicItem) => (
              <SelectItem key={b.bar_cod} value={b.bar_cod?.toString() ?? ""}>{b.bar_dsc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
