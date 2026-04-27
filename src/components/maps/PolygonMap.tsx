"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { Upload, X, MapPin, AlertCircle, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Fix para iconos
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

const getRandomColor = () => {
  const colors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22", "#34495e", "#ff4757", "#2f3542"];
  return colors[Math.floor(Math.random() * colors.length)];
};

interface PolygonMapProps {
  initialGeoJSON?: any;
  onPolygonChange: (geojson: any) => void;
  onMetadataChange?: (name: string, color: string) => void;
  color?: string;
}

export default function PolygonMap({ initialGeoJSON, onPolygonChange, onMetadataChange, color = "#3498db" }: PolygonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importCount, setImportCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para Mapeo dinámico
  const [showMapping, setShowMapping] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<{geometry: any, properties: any} | null>(null);
  const [mapping, setMapping] = useState({ nameKey: "", cityKey: "", stateKey: "" });
  const [availableProps, setAvailableProps] = useState<string[]>([]);

  const tempLayerRef = useRef<L.GeoJSON | null>(null);

  const confirmSelection = () => {
    if (!pendingFeature) return;
    
    const barrio = pendingFeature.properties?.[mapping.nameKey] || "Zona";
    const ciudad = mapping.cityKey ? pendingFeature.properties?.[mapping.cityKey] : "";
    const depto = mapping.stateKey ? pendingFeature.properties?.[mapping.stateKey] : "";
    
    let fullName = barrio;
    if (ciudad && depto) fullName = `${barrio} (${ciudad}, ${depto})`;
    else if (ciudad) fullName = `${barrio} (${ciudad})`;
    else if (depto) fullName = `${barrio} (${depto})`;

    applyGeometry(pendingFeature.geometry, fullName);
    setShowMapping(false);
    setPendingFeature(null);
  };

  const applyGeometry = (geometry: any, fullName?: string) => {
    if (!featureGroupRef.current || !mapInstanceRef.current) return;
    const fg = featureGroupRef.current;
    const map = mapInstanceRef.current;

    fg.clearLayers();
    const selectedLayer = L.geoJSON(geometry, {
      style: { color, fillColor: color, fillOpacity: 0.2 }
    });
    selectedLayer.eachLayer((l: any) => fg.addLayer(l));
    
    onPolygonChange(geometry);
    
    if (onMetadataChange && fullName) {
      onMetadataChange(fullName, getRandomColor());
    }
    
    const bounds = L.geoJSON(geometry).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds);

    if (tempLayerRef.current) {
      map.removeLayer(tempLayerRef.current);
      tempLayerRef.current = null;
    }
    setImportCount(0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const map = mapInstanceRef.current;
        const fg = featureGroupRef.current;
        if (!map || !fg) return;

        let features = [];
        if (json.type === "FeatureCollection") features = json.features;
        else if (json.type === "Feature") features = [json];
        else if (json.type === "Polygon" || json.type === "MultiPolygon") features = [{ type: "Feature", geometry: json, properties: {} }];

        const validFeatures = features.filter((f: any) => 
          f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
        );

        if (validFeatures.length === 0) {
          setErrorMessage("No se encontraron áreas (polígonos) en este archivo.");
          return;
        }

        if (validFeatures.length === 1) {
          const feature = validFeatures[0];
          const props = Object.keys(feature.properties || {});
          
          if (props.length > 0) {
            setAvailableProps(props);
            setPendingFeature(feature);
            
            const nameGuess = props.find(p => ["NOMBDIST", "NOM_CAP", "BARLO_DESC", "NOM", "NAME", "NOMBRE", "BARRIO"].includes(p.toUpperCase())) || props[0];
            const cityGuess = props.find(p => ["NOMBPROV", "DIST_DESC", "DISTRITO", "CIUDAD", "CITY"].includes(p.toUpperCase())) || "";
            const stateGuess = props.find(p => ["NOMBDEP", "DPTO_DESC", "DEPARTAMENTO", "STATE"].includes(p.toUpperCase())) || "";
            
            setMapping({ nameKey: nameGuess, cityKey: cityGuess, stateKey: stateGuess });
            setShowMapping(true);
          } else {
            applyGeometry(feature.geometry, "Zona Importada");
          }
        } else {
          setImportCount(validFeatures.length);
          const tempLayer = L.geoJSON({ type: "FeatureCollection", features: validFeatures } as any, {
            style: { color: "#6366f1", fillColor: "#818cf8", fillOpacity: 0.15, weight: 2, dashArray: "5, 10" },
            onEachFeature: (feature, layer) => {
              const name = feature.properties?.NOMBDIST || feature.properties?.BARLO_DESC || feature.properties?.NOM || feature.properties?.NAME || "Zona";
              layer.bindTooltip(name, { sticky: true, className: "bg-white border-none shadow-xl rounded-lg font-bold p-2" });
              layer.on("click", (clickEvent) => {
                L.DomEvent.stopPropagation(clickEvent);
                const props = Object.keys(feature.properties || {});
                if (props.length > 0) {
                  setAvailableProps(props);
                  setPendingFeature(feature);
                  const nGuess = props.find(p => ["NOMBDIST", "BARLO_DESC", "NOM", "NAME"].includes(p.toUpperCase())) || props[0];
                  const cGuess = props.find(p => ["NOMBPROV", "DIST_DESC", "DISTRITO"].includes(p.toUpperCase())) || "";
                  const sGuess = props.find(p => ["NOMBDEP", "DPTO_DESC", "DEPARTAMENTO"].includes(p.toUpperCase())) || "";
                  setMapping({ nameKey: nGuess, cityKey: cGuess, stateKey: sGuess });
                  setShowMapping(true);
                } else {
                  applyGeometry(feature.geometry, "Zona");
                }
              });
            }
          }).addTo(map);
          tempLayerRef.current = tempLayer;
          map.fitBounds(tempLayer.getBounds());
        }
      } catch (err) {
        setErrorMessage("Error al procesar el JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      fixLeafletIcons();
      const map = L.map(mapContainerRef.current).setView([-18.01, -70.25], 11);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap' }).addTo(map);
      const featureGroup = new L.FeatureGroup();
      map.addLayer(featureGroup);
      featureGroupRef.current = featureGroup;
      
      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: { rectangle: false, polyline: false, circle: false, circlemarker: false, marker: false, polygon: { shapeOptions: { color } } },
        edit: { featureGroup: featureGroup }
      });
      map.addControl(drawControl);
      map.on(L.Draw.Event.CREATED, (e: any) => {
        featureGroup.clearLayers();
        featureGroup.addLayer(e.layer);
        onPolygonChange(e.layer.toGeoJSON().geometry);
      });
    }

    if (mapInstanceRef.current && featureGroupRef.current && initialGeoJSON) {
      const fg = featureGroupRef.current;
      fg.clearLayers();
      const geoLayer = L.geoJSON(initialGeoJSON, { style: { color, fillColor: color, fillOpacity: 0.2 } });
      geoLayer.eachLayer((l: any) => fg.addLayer(l));
      if (fg.getLayers().length > 0) mapInstanceRef.current.fitBounds(fg.getBounds());
    }
  }, [initialGeoJSON, color]);

  useEffect(() => {
    const timer = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);
    return () => {
      clearTimeout(timer);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} className="h-[400px] w-full relative z-0" />
      
      <div className="absolute bottom-4 left-4 z-[400]">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json,.geojson" className="hidden" />
        <Button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xl flex gap-2 font-bold text-xs h-9 rounded-xl px-4" variant="outline">
          <Upload className="h-3.5 w-3.5 text-accent" /> Importar GeoJSON
        </Button>
      </div>

      {showMapping && (
        <div className="absolute inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Settings2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800 tracking-tight">Formato del Archivo</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400">¿Qué columna es el Nombre?</Label>
                <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-accent" value={mapping.nameKey} onChange={e => setMapping({...mapping, nameKey: e.target.value})}>
                  {availableProps.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Ciudad / Distrito</Label>
                  <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-accent" value={mapping.cityKey} onChange={e => setMapping({...mapping, cityKey: e.target.value})}>
                    <option value="">(Ninguna)</option>
                    {availableProps.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Depto / Estado</Label>
                  <select className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-accent" value={mapping.stateKey} onChange={e => setMapping({...mapping, stateKey: e.target.value})}>
                    <option value="">(Ninguna)</option>
                    {availableProps.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Vista Previa:</p>
                 <p className="font-bold text-slate-700 text-xs leading-tight">
                   {pendingFeature?.properties?.[mapping.nameKey] || "---"}
                   {(mapping.cityKey || mapping.stateKey) && " ("}
                   {mapping.cityKey && pendingFeature?.properties?.[mapping.cityKey]}
                   {mapping.cityKey && mapping.stateKey && ", "}
                   {mapping.stateKey && pendingFeature?.properties?.[mapping.stateKey]}
                   {(mapping.cityKey || mapping.stateKey) && ")"}
                 </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={confirmSelection} className="flex-1 bg-accent text-white font-bold h-11 rounded-2xl flex gap-2">
                  <Check className="h-4 w-4" /> Confirmar
                </Button>
                <Button variant="ghost" onClick={() => setShowMapping(false)} className="h-11 rounded-2xl text-slate-400">Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] w-[90%]">
          <div className="bg-red-50/95 backdrop-blur-md border border-red-200 shadow-2xl rounded-2xl p-3 flex items-center justify-between text-red-600">
            <div className="flex items-center gap-3 px-2"><AlertCircle className="h-5 w-5" /><p className="text-xs font-bold">{errorMessage}</p></div>
            <Button size="icon" variant="ghost" onClick={() => setErrorMessage(null)} className="h-8 w-8 text-red-400"><X className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {importCount > 0 && !showMapping && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] w-[90%] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border border-accent/20 shadow-2xl rounded-2xl p-3 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"><MapPin className="h-4 w-4" /></div>
              <div><p className="text-slate-900 font-bold text-sm leading-none">Seleccionar Zona</p><p className="text-slate-500 text-[11px] mt-0.5">Haz clic en una de las {importCount} áreas detectadas.</p></div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setImportCount(0)} className="h-8 w-8 text-slate-400"><X className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}