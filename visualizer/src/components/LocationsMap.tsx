"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { LocationPoint } from "@/lib/data";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [20, 77];
const DEFAULT_ZOOM = 4;

function createMarkerIcon(point: LocationPoint) {
  const count = point.count > 1 ? `<span class="locations-marker__badge">${point.count > 99 ? "99+" : point.count}</span>` : "";
  return L.divIcon({
    className: "locations-marker-wrapper",
    html: `
      <span class="locations-marker">
        <span class="locations-marker__pin"></span>
        ${count}
      </span>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
}

interface LocationsMapProps {
  points: LocationPoint[];
  className?: string;
}

export default function LocationsMap({ points, className = "" }: LocationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length === 0) return;

    const center: [number, number] =
      points.length === 1 ? [points[0].lat, points[0].lng] : DEFAULT_CENTER;

    const map = L.map(container, {
      center,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markers: L.Marker[] = [];
    points.forEach((point) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createMarkerIcon(point),
      });
      const galleryUrl = `/gallery?location=${encodeURIComponent(point.locationKey)}`;
      marker.bindPopup(
        `<div class="min-w-[160px]">
          <div class="font-medium mb-1">${escapeHtml(point.locationKey)}</div>
          <div class="text-sm text-muted-foreground mb-2">${point.count} screenshot${point.count !== 1 ? "s" : ""}</div>
          <a href="${escapeHtml(galleryUrl)}" class="text-xs text-primary hover:underline">View in Gallery →</a>
        </div>`,
        { className: "locations-popup" },
      );
      marker.addTo(map);
      markers.push(marker);
    });
    markersRef.current = markers;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(
        points.map((p) => [p.lat, p.lng] as L.LatLngTuple),
      );
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
    }

    return () => {
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground ${className}`}
        style={{ minHeight: 320 }}
      >
        <p className="text-sm">No location points to display</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .locations-marker-wrapper { background: none !important; border: none !important; }
        .locations-marker { position: relative; display: block; width: 32px; height: 40px; }
        .locations-marker__pin {
          display: block;
          width: 28px;
          height: 28px;
          margin: 0 auto 2px;
          background: linear-gradient(145deg, #374151 0%, #1f2937 100%);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .leaflet-marker-icon.locations-marker-wrapper:hover .locations-marker__pin {
          transform: rotate(-45deg) scale(1.1);
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        }
        .locations-marker__badge {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          font-size: 10px;
          font-weight: 700;
          line-height: 18px;
          text-align: center;
          color: white;
          background: #1f2937;
          border: 2px solid white;
          border-radius: 9px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }
      `}</style>
      <div
        ref={containerRef}
        className={`rounded-lg overflow-hidden border border-border h-[360px] w-full z-0 ${className}`}
      />
    </>
  );
}

function escapeHtml(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
