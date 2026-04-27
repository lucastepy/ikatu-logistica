"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TripMapProps {
  origin: { lat: number; lng: number; name: string };
  destinations: { lat: number; lng: number; name: string }[];
}

export default function TripMap({ origin, destinations }: TripMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([origin.lat, origin.lng], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Limpiar capas previas si existen
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const originIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: #00a3e0; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(0,163,224,0.6);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const destIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: #f59e0b; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(245,158,11,0.5);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const bounds = L.latLngBounds([[origin.lat, origin.lng]]);
    let hasValidPoints = false;

    // Marcador de origen
    if (!isNaN(origin.lat) && !isNaN(origin.lng)) {
      L.marker([origin.lat, origin.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>Punto de Salida:</b><br/>${origin.name}`);
      hasValidPoints = true;
    }

    // Marcadores de destino
    const validDestinations = destinations.filter(d => !isNaN(d.lat) && !isNaN(d.lng));
    validDestinations.forEach(d => {
      L.marker([d.lat, d.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destino:</b><br/>${d.name}`);
      bounds.extend([d.lat, d.lng]);
    });

    // Calcular ruta real usando OSRM
    if (hasValidPoints && validDestinations.length > 0) {
      const coords = [
        `${origin.lng},${origin.lat}`,
        ...validDestinations.map(d => `${d.lng},${d.lat}`)
      ].join(';');

      fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes.length > 0) {
            const routeCoords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            
            // Línea de ruta premium (brillo exterior)
            L.polyline(routeCoords, {
              color: "#00a3e0",
              weight: 8,
              opacity: 0.2
            }).addTo(map);

            // Línea de ruta principal
            L.polyline(routeCoords, {
              color: "#00a3e0",
              weight: 4,
              opacity: 0.8,
              lineJoin: 'round'
            }).addTo(map);

            const routeBounds = L.latLngBounds(routeCoords);
            map.fitBounds(routeBounds, { padding: [50, 50], animate: true });
          } else {
            // Fallback a línea recta si falla OSRM
            const simplePoints = [[origin.lat, origin.lng], ...validDestinations.map(d => [d.lat, d.lng])];
            L.polyline(simplePoints as any, { color: "#00a3e0", weight: 3, dashArray: "10, 10" }).addTo(map);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        })
        .catch(() => {
          map.fitBounds(bounds, { padding: [50, 50] });
        });
    }

    return () => {
      // Cleanup happens only when component unmounts
    };
  }, [origin, destinations]);

  return <div ref={containerRef} className="h-full w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50" />;
}
