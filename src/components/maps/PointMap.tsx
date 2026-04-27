"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface PointMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function PointMap({ lat, lng, onChange }: PointMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inicializar el mapa si no existe
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Icono personalizado para el pin
      const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      // Crear el marcador
      markerRef.current = L.marker([lat, lng], {
        icon: customIcon,
        draggable: true
      }).addTo(mapRef.current);

      // Evento de arrastre
      markerRef.current.on("dragend", () => {
        const position = markerRef.current!.getLatLng();
        onChange(position.lat, position.lng);
      });

      // Evento de clic en el mapa para mover el pin
      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        markerRef.current!.setLatLng([lat, lng]);
        onChange(lat, lng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Corregir el problema de "mapa cortado" forzando el recalculo de tamaño
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 400); // Esperar a que la animación del modal termine
    return () => clearTimeout(timer);
  }, []);

  // Actualizar posición si cambia desde afuera (ej: al editar o buscar)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], 15);
      }
    }
  }, [lat, lng]);

  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError(null);
    try {
      // Búsqueda usando Nominatim de OpenStreetMap (limitado a Paraguay para mayor precisión)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=py&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        onChange(newLat, newLng);
      } else {
        setError("No se encontraron resultados");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error en geocoding:", error);
      setError("Error al buscar");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl border-2 border-slate-100 shadow-inner">
      {/* Error Message Overlay */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000] animate-in fade-in zoom-in duration-300">
          <div className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-red-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {error}
          </div>
        </div>
      )}

      {/* Search Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2 pointer-events-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar dirección, ciudad o barrio..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-xl text-xs focus:ring-2 focus:ring-accent outline-none transition-all"
          />
        </div>
        <Button 
          type="button"
          onClick={handleSearch} 
          disabled={searchLoading} 
          className="h-10 px-4 rounded-xl shadow-xl bg-accent hover:bg-accent/90 text-white font-bold"
        >
          {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>

      <div 
        ref={containerRef} 
        className="h-[320px] w-full relative z-10"
      />
    </div>
  );
}
