"use client";

import { useEffect, useRef } from "react";
import { formatJobStatus } from "@/lib/format";

interface Marker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
  status: string;
  scheduledStart: string;
}

export default function JobMapView({ markers }: { markers: Marker[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;
    if (mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const statusColor: Record<string, string> = {
        SCHEDULED: "#60a5fa",
        COMPLETED_PENDING_APPROVAL: "#fbbf24",
        APPROVED_PAYABLE: "#34d399",
        PAID: "#71717a",
      };

      const bounds: [number, number][] = [];

      markers.forEach((m) => {
        const color = statusColor[m.status] ?? "#71717a";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const time = new Date(m.scheduledStart).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });

        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui;font-size:13px;">
              <strong>${m.name}</strong><br/>
              <span style="color:#666;">${m.address}</span><br/>
              <span style="color:${color};font-weight:600;">${formatJobStatus(m.status)}</span> · ${time}
            </div>
          `);

        bounds.push([m.lat, m.lng]);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
