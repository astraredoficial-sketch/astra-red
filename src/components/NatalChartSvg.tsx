"use client";

import React, { useState } from "react";
import type { NatalChart } from "@/lib/types";

interface Props {
  chart: NatalChart;
  size?: number;
}

const ZODIAC_SIGNS = [
  { name: "Aries", symbol: "♈" },
  { name: "Tauro", symbol: "♉" },
  { name: "Géminis", symbol: "♊" },
  { name: "Cáncer", symbol: "♋" },
  { name: "Leo", symbol: "♌" },
  { name: "Virgo", symbol: "♍" },
  { name: "Libra", symbol: "♎" },
  { name: "Escorpio", symbol: "♏" },
  { name: "Sagitario", symbol: "♐" },
  { name: "Capricornio", symbol: "♑" },
  { name: "Acuario", symbol: "♒" },
  { name: "Piscis", symbol: "♓" },
];

export function NatalChartSvg({ chart, size = 420 }: Props) {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  const radius = size / 2;
  const outerR = radius - 10;
  const innerR = radius - 55;
  const planetR = radius - 90;

  const ascDegree = chart?.triad?.asc?.degreeInSign || 0;
  const ascSignIndex = chart?.triad?.asc?.signIndex || 9;
  const totalAscLongitude = ascSignIndex * 30 + ascDegree;
  const rotationOffset = 180 - totalAscLongitude;

  const rawPlanets = [
    { id: "sun", symbol: "☉", name: "Sol", long: 263.5 },
    { id: "moon", symbol: "☽", name: "Luna", long: 310.9 },
    { id: "mercury", symbol: "☿", name: "Mercurio", long: 255.0 },
    { id: "venus", symbol: "♀", name: "Venus", long: 240.2 },
    { id: "mars", symbol: "♂", name: "Marte", long: 215.1 },
    { id: "jupiter", symbol: "♃", name: "Júpiter", long: 320.4 },
    { id: "saturn", symbol: "♄", name: "Saturno", long: 245.8 },
    { id: "uranus", symbol: "♅", name: "Urano", long: 248.3 },
    { id: "neptune", symbol: "♆", name: "Neptuno", long: 243.1 },
    { id: "pluto", symbol: "♇", name: "Plutón", long: 215.8 },
  ];

  const planetsWithOffset = rawPlanets.map((p, idx, arr) => {
    let rOffset = 0;
    arr.forEach((other, oIdx) => {
      if (idx !== oIdx && Math.abs(p.long - other.long) < 6) {
        rOffset = idx % 2 === 0 ? 14 : -14;
      }
    });
    return { ...p, currentR: planetR + rOffset };
  });

  const viewBoxString = "0 0 " + size + " " + size;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={viewBoxString} className="select-none">
        <circle cx={radius} cy={radius} r={outerR} fill="#090d16" stroke="#1e293b" strokeWidth="2" />
        <circle cx={radius} cy={radius} r={innerR} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        <circle cx={radius} cy={radius} r={planetR - 25} fill="#020617" stroke="#1e293b" strokeWidth="1" />

        {ZODIAC_SIGNS.map((sign, i) => {
          const angle = (i * 30 + rotationOffset) * (Math.PI / 180);
          const x1 = radius + innerR * Math.cos(angle);
          const y1 = radius + innerR * Math.sin(angle);
          const x2 = radius + outerR * Math.cos(angle);
          const y2 = radius + outerR * Math.sin(angle);

          const midAngle = (i * 30 + 15 + rotationOffset) * (Math.PI / 180);
          const symbolR = (innerR + outerR) / 2;
          const sx = radius + symbolR * Math.cos(midAngle);
          const sy = radius + symbolR * Math.sin(midAngle);

          return (
            <g key={sign.name}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1" />
              <text
                x={sx}
                y={sy}
                fill="#a855f7"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                className="opacity-80 hover:opacity-100 transition"
              >
                {sign.symbol}
              </text>
            </g>
          );
        })}

        <line
          x1={radius - innerR}
          y1={radius}
          x2={radius + innerR}
          y2={radius}
          stroke="#f43f5e"
          strokeWidth="2"
          strokeDasharray="4 2"
        />

        {planetsWithOffset.map((p) => {
          const angle = (p.long + rotationOffset) * (Math.PI / 180);
          const px = radius + p.currentR * Math.cos(angle);
          const py = radius + p.currentR * Math.sin(angle);
          const isHovered = hoveredPlanet === p.id;

          return (
            <g
              key={p.id}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => setHoveredPlanet(p.id)}
              onMouseLeave={() => setHoveredPlanet(null)}
            >
              {isHovered && (
                <circle cx={px} cy={py} r="16" fill="#f43f5e" fillOpacity="0.25" className="animate-ping" />
              )}
              <circle
                cx={px}
                cy={py}
                r="11"
                fill={isHovered ? "#f43f5e" : "#1e1b4b"}
                stroke={isHovered ? "#fb7185" : "#6366f1"}
                strokeWidth="1.5"
              />
              <text
                x={px}
                y={py}
                fill={isHovered ? "#ffffff" : "#c084fc"}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {p.symbol}
              </text>
            </g>
          );
        })}

        <text x={radius} y={radius - 8} fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">
          ASC
        </text>
        <text x={radius} y={radius + 10} fill="#f8fafc" fontSize="12" fontWeight="600" textAnchor="middle">
          Capricornio
        </text>
      </svg>

      {hoveredPlanet && (
        <div className="absolute bottom-2 bg-slate-900/90 border border-rose-500/40 text-xs px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md text-rose-300 animate-in fade-in zoom-in-95">
          {rawPlanets.find((p) => p.id === hoveredPlanet)?.name} — Posición destacada
        </div>
      )}
    </div>
  );
}
