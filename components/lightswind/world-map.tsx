"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountryUserActivity {
  id?: string;
  country: string;
  countryCode: string;
  city?: string;
  lat: number;
  lng: number;
  users: number; // Number of active users
  color?: string; // Optional glow color (defaults to luminous emerald or cyan)
  pulse?: boolean;
}

export interface MapArc {
  id?: string;
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  color?: string;
  strokeWidth?: number;
  dashed?: boolean;
}

export interface WorldMapProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  dotRadius?: number;
  dotColor?: string;
  markerColor?: string;
  pulseColor?: string;
  markers?: CountryUserActivity[];
  arcs?: MapArc[];
  pulse?: boolean;
  enableTooltips?: boolean;
  interactive?: boolean;
  className?: string;
  onMarkerClick?: (marker: CountryUserActivity) => void;
  renderMarkerOverlay?: (args: {
    marker: CountryUserActivity;
    x: number;
    y: number;
    r: number;
  }) => React.ReactNode;
}

// Convert Latitude / Longitude (WGS84) to SVG Map Coordinates (Equirectangular / Miller hybrid projection)
export function latLngToXY(lat: number, lng: number, width: number = 800, height: number = 400) {
  const x = ((lng + 180) / 360) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + (latRad * 0.85) / 2));
  const y = height / 2 - (width * mercN) / (2 * Math.PI);
  
  const clampedX = Math.max(0, Math.min(width, x));
  const clampedY = Math.max(0, Math.min(height, y));
  return { x: clampedX, y: clampedY };
}

// High-accuracy continent landmass sample grid points [lat, lng]
const WORLD_LANDMASS_SAMPLES: [number, number][] = [
  // North America - Alaska & Canada
  [71, -156], [68, -165], [64, -162], [65, -147], [61, -150], [60, -162], [58, -135],
  [69, -133], [65, -120], [62, -114], [67, -118], [63, -104], [60, -108], [64, -96],
  [58, -94], [55, -100], [53, -113], [54, -125], [51, -120], [49, -123], [52, -106],
  [50, -97], [53, -85], [58, -78], [55, -67], [52, -75], [48, -89], [47, -79], [46, -71],
  [47, -65], [45, -63], [53, -60],
  // USA (Lower 48)
  [48, -122], [46, -124], [44, -121], [42, -123], [39, -123], [37, -122], [34, -119], [32, -117],
  [47, -114], [44, -114], [40, -111], [37, -112], [34, -112], [32, -111],
  [48, -100], [45, -100], [41, -102], [37, -100], [33, -102], [30, -103], [28, -100],
  [47, -92], [43, -93], [39, -94], [35, -92], [32, -92], [30, -90],
  [44, -85], [41, -86], [38, -85], [34, -84], [30, -84], [27, -81], [25, -80],
  [43, -76], [40, -74], [37, -77], [35, -78], [32, -80],
  // Mexico & Central America
  [30, -110], [27, -108], [24, -105], [26, -100], [22, -101], [19, -99], [20, -90], [17, -93],
  [15, -90], [14, -87], [12, -85], [9, -83], [8, -80],
  // Caribbean
  [22, -79], [18, -72], [18, -66],
  // South America
  [10, -73], [7, -73], [4, -73], [1, -78], [-2, -79], [-5, -80], [-8, -78], [-12, -77], [-15, -75],
  [6, -62], [3, -60], [0, -50], [5, -53], [2, -66], [-2, -60], [-5, -63], [-8, -63],
  [-3, -44], [-6, -37], [-8, -35], [-12, -38], [-15, -44], [-12, -49],
  [-16, -68], [-19, -65], [-22, -65], [-23, -46], [-22, -43], [-25, -49], [-25, -57],
  [-28, -70], [-33, -71], [-38, -73], [-42, -73], [-46, -74], [-51, -73],
  [-29, -60], [-34, -58], [-38, -62], [-42, -64], [-46, -67], [-50, -68], [-54, -68],
  // Greenland & Iceland
  [76, -42], [72, -40], [70, -50], [65, -45], [64, -18],
  // Europe - UK & Ireland
  [58, -4], [55, -3], [52, -1], [51, 0], [53, -8],
  // Europe - Scandinavia
  [69, 25], [65, 22], [61, 25], [64, 14], [60, 11], [59, 17], [56, 13],
  // Europe - Western & Central
  [53, 5], [51, 4], [48, 2], [45, 0], [43, 3], [43, -3], [40, -4], [37, -5], [39, -9],
  [52, 10], [49, 11], [46, 9], [43, 12], [41, 14], [38, 15], [37, 14],
  [53, 19], [50, 19], [46, 17], [44, 21], [40, 22], [38, 23],
  // Europe - Eastern & Russia
  [58, 30], [55, 37], [52, 33], [48, 35], [45, 34], [46, 40],
  [65, 41], [60, 50], [55, 52], [52, 50], [48, 45],
  [68, 55], [64, 65], [60, 70], [56, 68], [52, 71],
  [67, 78], [63, 85], [59, 88], [55, 83], [52, 85],
  [68, 100], [63, 105], [58, 102], [54, 100],
  [67, 120], [62, 125], [57, 120], [53, 118],
  [66, 140], [62, 145], [58, 138], [54, 130],
  [64, 160], [60, 162], [56, 160], [52, 157],
  // Africa - North & Egypt
  [30, 31], [31, 30], [27, 30], [24, 32], [36, 3], [34, 10], [32, 20], [31, -8],
  [28, -10], [25, 0], [25, 12], [26, 25], [26, 32],
  [21, -13], [20, -1], [20, 11], [20, 22], [21, 31],
  // Africa - West & Central
  [15, -16], [12, -8], [10, 0], [12, 14], [13, 25], [12, 37], [10, 42],
  [5, -3], [6, 3], [8, 10], [4, 19], [4, 28], [5, 36],
  [0, 10], [0, 20], [0, 29], [0, 38],
  // Africa - South
  [-5, 13], [-4, 22], [-4, 33], [-5, 39],
  [-11, 15], [-12, 26], [-11, 37],
  [-18, 15], [-18, 25], [-19, 34], [-19, 46],
  [-25, 17], [-24, 26], [-25, 33],
  [-30, 19], [-29, 27], [-30, 31], [-33, 22], [-34, 26],
  // Middle East & Gulf (Saudi, UAE, etc.)
  [24, 46], [21, 39], [25, 55], [24, 54], [29, 48], [37, 36], [34, 44], [31, 47], [29, 40], [27, 45], [20, 56], [15, 48],
  [36, 50], [32, 54], [28, 56],
  // Central & South Asia
  [42, 60], [40, 68], [44, 75], [38, 73], [35, 68], [33, 70], [30, 68], [27, 65],
  [32, 76], [28, 77], [24, 75], [22, 80], [22, 88], [18, 74], [16, 80], [13, 77], [10, 78], [8, 80],
  // East Asia - China & Mongolia
  [48, 87], [44, 87], [41, 85], [47, 103], [44, 105], [40, 96], [40, 110], [42, 118], [45, 125],
  [36, 82], [35, 93], [35, 104], [36, 114], [37, 120], [39, 125],
  [30, 85], [30, 96], [30, 104], [31, 114], [31, 121],
  [25, 92], [24, 101], [25, 110], [24, 118], [22, 114],
  // Japan & Korea
  [38, 127], [35, 128], [43, 142], [38, 140], [35, 136], [33, 130],
  // Southeast Asia
  [19, 100], [18, 106], [14, 101], [15, 108], [11, 106], [6, 101], [3, 102], [1, 104],
  [16, 121], [13, 123], [9, 125], [1, 114], [-2, 115], [-2, 121], [-7, 110], [-8, 115],
  // Australia & New Zealand
  [-13, 131], [-15, 142], [-18, 123], [-21, 134], [-21, 148],
  [-25, 115], [-24, 126], [-25, 136], [-24, 151],
  [-30, 118], [-29, 129], [-31, 138], [-29, 153],
  [-34, 118], [-33, 136], [-35, 143], [-37, 145], [-34, 150], [-42, 146],
  [-37, 175], [-41, 174], [-45, 169]
];

// Clean default country user activity (No MS, No Local Time, Just active users per country)
export const DEFAULT_COUNTRY_USERS: CountryUserActivity[] = [
  { id: "eg", country: "Egypt", countryCode: "EG", city: "Cairo", lat: 30.0444, lng: 31.2357, users: 3840, color: "#10B981", pulse: true },
  { id: "sa", country: "Saudi Arabia", countryCode: "SA", city: "Riyadh", lat: 24.7136, lng: 46.6753, users: 2450, color: "#10B981", pulse: true },
  { id: "ae", country: "United Arab Emirates", countryCode: "AE", city: "Dubai", lat: 25.2048, lng: 55.2708, users: 1980, color: "#06B6D4", pulse: true },
  { id: "us", country: "United States", countryCode: "US", city: "New York / SF", lat: 39.8283, lng: -98.5795, users: 4920, color: "#3B82F6", pulse: true },
  { id: "de", country: "Germany", countryCode: "DE", city: "Berlin", lat: 52.52, lng: 13.405, users: 1860, color: "#3B82F6", pulse: true },
  { id: "gb", country: "United Kingdom", countryCode: "GB", city: "London", lat: 51.5074, lng: -0.1278, users: 2150, color: "#3B82F6", pulse: true },
  { id: "in", country: "India", countryCode: "IN", city: "Bengaluru", lat: 12.9716, lng: 77.5946, users: 2940, color: "#F59E0B", pulse: true },
  { id: "sg", country: "Singapore", countryCode: "SG", city: "Singapore", lat: 1.3521, lng: 103.8198, users: 1120, color: "#06B6D4", pulse: true },
  { id: "jp", country: "Japan", countryCode: "JP", city: "Tokyo", lat: 35.6762, lng: 139.6503, users: 1680, color: "#EC4899", pulse: true },
  { id: "br", country: "Brazil", countryCode: "BR", city: "São Paulo", lat: -23.5505, lng: -46.6333, users: 950, color: "#8B5CF6", pulse: true },
];

export function WorldMap({
  width = 900,
  height = 450,
  dotRadius = 1.8,
  dotColor,
  markerColor = "#10B981",
  pulseColor,
  markers = DEFAULT_COUNTRY_USERS,
  arcs = [], // Default: No connecting lines between nodes
  pulse = true,
  enableTooltips = true,
  interactive = true,
  className,
  onMarkerClick,
  renderMarkerOverlay,
  style,
  ...svgProps
}: WorldMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<CountryUserActivity | null>(null);

  // Convert landmass sample points into SVG grid coordinates
  const points = useMemo(() => {
    return WORLD_LANDMASS_SAMPLES.map(([lat, lng]) => {
      const { x, y } = latLngToXY(lat, lng, width, height);
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    });
  }, [width, height]);

  // Convert markers to SVG coordinates and scale glow radius by user volume
  const plottedMarkers = useMemo(() => {
    return markers.map((m) => {
      const { x, y } = latLngToXY(m.lat, m.lng, width, height);
      // Scale dot size slightly based on user counts (between 3.5 and 6)
      const baseSize = m.users > 3000 ? 5.5 : m.users > 1500 ? 4.5 : 3.8;
      return { ...m, x, y, size: baseSize };
    });
  }, [markers, width, height]);

  // Generate SVG Bezier arc paths ONLY IF arcs are explicitly provided (defaults to empty)
  const plottedArcs = useMemo(() => {
    if (!arcs || arcs.length === 0) return [];
    return arcs.map((arc, idx) => {
      const start = latLngToXY(arc.start.lat, arc.start.lng, width, height);
      const end = latLngToXY(arc.end.lat, arc.end.lng, width, height);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2 - dist * 0.25;

      return {
        id: arc.id || `arc-${idx}`,
        path: `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`,
        color: arc.color || markerColor,
        strokeWidth: arc.strokeWidth || 1.2,
      };
    });
  }, [arcs, width, height, markerColor]);

  return (
    <div className={cn("relative w-full h-full select-none overflow-hidden flex flex-col justify-center items-center", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full text-zinc-300 dark:text-zinc-700/80 transition-colors duration-300"
        style={{ width: "100%", height: "100%", ...style }}
        {...svgProps}
      >
        <defs>
          {/* Subtle radial center glow */}
          <radialGradient id="mapCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* SVG Glow Filter for luminous neon beacon effect */}
          <filter id="country-beacon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#mapCenterGlow)" />

        {/* Continental Dotted Matrix */}
        <g className="transition-opacity duration-300">
          {points.map((pt, i) => (
            <circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={dotRadius}
              fill={dotColor || "currentColor"}
              className="opacity-75 dark:opacity-45 transition-colors duration-300"
            />
          ))}
        </g>

        {/* Connecting Curved Arcs (empty by default) */}
        {plottedArcs.length > 0 && (
          <g className="pointer-events-none">
            {plottedArcs.map((arc) => (
              <g key={arc.id}>
                <path
                  d={arc.path}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={arc.strokeWidth}
                  strokeOpacity={0.35}
                  strokeDasharray="4 4"
                />
                <circle r={2} fill={arc.color}>
                  <animateMotion path={arc.path} dur="4s" repeatCount="indefinite" />
                </circle>
              </g>
            ))}
          </g>
        )}

        {/* Illuminated Country Markers (منورة كدا مع هالة مضيئة ونبض حي) */}
        {plottedMarkers.map((marker, idx) => {
          const r = marker.size || 4;
          const glowColor = marker.color || markerColor;
          const pColor = pulseColor || glowColor;
          const shouldPulse = pulse !== false;
          const isHovered = hoveredMarker?.id === marker.id || hoveredMarker?.countryCode === marker.countryCode;

          return (
            <g
              key={marker.id || marker.countryCode || `marker-${idx}`}
              className={interactive ? "cursor-pointer group" : ""}
              onMouseEnter={() => interactive && setHoveredMarker(marker)}
              onMouseLeave={() => interactive && setHoveredMarker(null)}
              onClick={() => onMarkerClick?.(marker)}
            >
              {/* Outer Radiant Glowing Aura (الهالة الضوئية حول البلد المنورة) */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={isHovered ? r * 4.5 : r * 3.5}
                fill={glowColor}
                opacity={isHovered ? 0.35 : 0.22}
                className="transition-all duration-300"
              />

              {/* Secondary Soft Glow Circle */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={isHovered ? r * 2.8 : r * 2.2}
                fill={glowColor}
                opacity={isHovered ? 0.45 : 0.3}
                className="transition-all duration-300"
              />

              {/* Pulsing radar waves */}
              {shouldPulse && (
                <g pointerEvents="none">
                  <circle cx={marker.x} cy={marker.y} r={r} fill="none" stroke={pColor} strokeWidth={1.2} strokeOpacity={0.8}>
                    <animate attributeName="r" values={`${r};${r * 4.2}`} dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={marker.x} cy={marker.y} r={r} fill="none" stroke={pColor} strokeWidth={0.8} strokeOpacity={0.5}>
                    <animate attributeName="r" values={`${r};${r * 4.2}`} dur="2.2s" begin="1.1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}

              {/* Luminous Solid Marker with SVG Glow Filter */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={isHovered ? r * 1.35 : r}
                fill={glowColor}
                filter="url(#country-beacon-glow)"
                className="transition-all duration-200"
              />

              {/* Center Bright White Specular Core */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={r * 0.45}
                fill="#FFFFFF"
                className="pointer-events-none"
              />

              {/* Custom Marker Overlay Hook if supplied */}
              {renderMarkerOverlay?.({ marker, x: marker.x, y: marker.y, r })}
            </g>
          );
        })}
      </svg>

      {/* Floating Interactive Tooltip: Shows ONLY Country, City & Active Users (No MS, No Local Time) */}
      <AnimatePresence>
        {enableTooltips && hoveredMarker && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 p-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl pointer-events-none text-left min-w-[170px]"
            style={{
              left: `${(latLngToXY(hoveredMarker.lat, hoveredMarker.lng, width, height).x / width) * 100}%`,
              top: `${(latLngToXY(hoveredMarker.lat, hoveredMarker.lng, width, height).y / height) * 100}%`,
              transform: "translate(-50%, -125%)",
            }}
          >
            {/* Header: Flag & Country Name */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  alt={`Flag of ${hoveredMarker.countryCode}`}
                  className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-xs"
                  src={`https://flag.vercel.app/s/${hoveredMarker.countryCode.toUpperCase()}.svg`}
                />
                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                  {hoveredMarker.country}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {/* Active Users Display */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <UsersIcon className="w-3.5 h-3.5 text-primary" />
                Active Users:
              </span>
              <span className="font-bold font-mono text-foreground tabular-nums text-sm">
                {hoveredMarker.users.toLocaleString()}
              </span>
            </div>

            {hoveredMarker.city && (
              <div className="text-[10px] text-muted-foreground mt-1 text-right">
                {hoveredMarker.city}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WorldMap;
