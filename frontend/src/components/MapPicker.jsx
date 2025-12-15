import { useEffect, memo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- Configuración de Iconos (No tocar) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --- Componente 1: El Vigilante del Tamaño (LA SOLUCIÓN) ---
const MapResizer = () => {
  const map = useMap();

  useEffect(() => {
    // Este observador detecta cuando el div del mapa cambia de tamaño
    // (por ejemplo, cuando el modal pasa de display:none a block)
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(map.getContainer());

    return () => {
      observer.disconnect();
    };
  }, [map]);

  return null;
};

// --- Componente 2: Manejador de Clics ---
function LocationMarker({ position, onPositionChange }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

// --- Componente Principal ---
const MapPicker = ({ latitude, longitude, onLocationChange }) => {
  const defaultCenter = [-17.7573663, -63.3419807]; // Santa Cruz

  // Convertimos props a array
  const position =
    latitude && longitude
      ? [parseFloat(latitude), parseFloat(longitude)]
      : null;

  return (
    <div>
      <div
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "8px",
          border: "2px solid #ddd",
          overflow: "hidden", // Importante para bordes redondeados
        }}
      >
        <MapContainer
          center={defaultCenter} // Usamos centro por defecto inicial
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Aquí insertamos el vigilante que arregla el gris */}
          <MapResizer />

          <LocationMarker
            position={position}
            onPositionChange={(pos) => onLocationChange(pos[0], pos[1])}
          />
        </MapContainer>
      </div>

      <div className="mt-2 text-muted small">
        <i className="bi bi-info-circle"></i> Haz clic en el mapa para
        seleccionar la ubicación.
      </div>

      {position && (
        <div className="mt-2">
          <small className="text-success">
            <i className="bi bi-geo-alt-fill"></i> Ubicación:{" "}
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </small>
        </div>
      )}
    </div>
  );
};

// --- Optimización de Rendimiento (React.memo) ---
// Esto evita que el mapa se congele cuando escribes en otros inputs
export default memo(MapPicker, (prevProps, nextProps) => {
  return (
    prevProps.latitude === nextProps.latitude &&
    prevProps.longitude === nextProps.longitude
  );
});
