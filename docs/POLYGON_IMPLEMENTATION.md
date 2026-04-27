# Plan de Implementación de Polígonos con PostGIS

Para manejar polígonos en el sistema, seguiremos estos pasos:

## 1. Backend (API & Database)
Dado que Prisma no soporta nativamente el tipo `geometry`, utilizaremos `raw queries` para interactuar con PostGIS.

### Cambios en la API
*   **GET**: Recuperar la geometría convertida a GeoJSON usando `ST_AsGeoJSON`.
*   **POST/PUT**: Guardar la geometría recibida como GeoJSON usando `ST_GeomFromGeoJSON`.

## 2. Frontend (Mapas con Leaflet)
Instalaremos las dependencias necesarias para dibujar en un mapa (ajustadas para React 18):
```bash
npm install leaflet react-leaflet@^4.2.1 leaflet-draw @types/leaflet @types/leaflet-draw --legacy-peer-deps
```

### Componente `MapZona`
Crearemos un componente que permita:
1. Ver el polígono actual (si existe).
2. Dibujar un nuevo polígono.
3. Editar el polígono existente.

## 3. Integración en "Zonas"
Actualizaremos el modal de "Editar Zona" para incluir el mapa y enviar los datos geográficos al servidor.
