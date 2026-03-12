'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { INDICATOR_LABELS, getZScoreColor } from '@/lib/utils';

interface Heatmap3DProps {
  data: {
    regions: string[];
    indicators: string[];
    matrix: number[][];
  };
}

function Bar({
  position,
  height,
  color,
  region,
  indicator,
  value,
  onHover,
  onUnhover,
  isHovered,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  region: string;
  indicator: string;
  value: number;
  onHover: () => void;
  onUnhover: () => void;
  isHovered: boolean;
}) {
  const absHeight = Math.max(0.08, Math.abs(height) * 0.5);
  const isNegative = height < 0;
  const yPos = (isNegative ? -absHeight : absHeight) / 2;

  return (
    <group position={position}>
      <mesh
        position={[0, yPos, 0]}
        scale={isHovered ? [1.1, 1, 1.1] : [1, 1, 1]}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(); }}
        onPointerLeave={onUnhover}
      >
        <boxGeometry args={[0.7, absHeight, 0.7]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.4 : 0.1}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {isHovered && (
        <Html position={[0, absHeight + 0.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 border border-slate-600 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
            <div className="text-slate-200 font-medium">{region}</div>
            <div className="text-slate-400">{indicator}</div>
            <div className="mt-1">
              <span className="text-slate-400">Z-score: </span>
              <span className="font-mono font-bold" style={{ color }}>{value.toFixed(2)}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({ data }: Heatmap3DProps) {
  const { regions, indicators, matrix } = data;
  const [hovered, setHovered] = useState<string | null>(null);

  const handleHover = useCallback((key: string) => setHovered(key), []);
  const handleUnhover = useCallback(() => setHovered(null), []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#6366f1" />

      {/* Base plane */}
      <mesh
        position={[regions.length / 2 - 0.5, -0.01, indicators.length / 2 - 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[regions.length + 1, indicators.length + 1]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {regions.map((region, rowIdx) =>
        indicators.map((ind, colIdx) => {
          const value = matrix[rowIdx]?.[colIdx] ?? 0;
          const color = getZScoreColor(value);
          const key = `${rowIdx}-${colIdx}`;
          return (
            <Bar
              key={key}
              position={[rowIdx, 0, colIdx]}
              height={value}
              color={color}
              region={region}
              indicator={INDICATOR_LABELS[ind] || ind}
              value={value}
              onHover={() => handleHover(key)}
              onUnhover={handleUnhover}
              isHovered={hovered === key}
            />
          );
        })
      )}

      {/* Region labels */}
      {regions.map((region, i) => (
        <Html key={`r-${i}`} position={[i, 0, -1]} center distanceFactor={12}>
          <div className="text-[10px] text-slate-400 whitespace-nowrap -rotate-45 origin-bottom-left">
            {region}
          </div>
        </Html>
      ))}

      {/* Indicator labels */}
      {indicators.map((ind, j) => (
        <Html key={`i-${j}`} position={[-1.5, 0, j]} center distanceFactor={12}>
          <div className="text-[10px] text-slate-400 whitespace-nowrap text-right">
            {(INDICATOR_LABELS[ind] || ind).slice(0, 18)}
          </div>
        </Html>
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxDistance={25}
        minDistance={5}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export default function Heatmap3D({ data }: Heatmap3DProps) {
  if (!data?.regions?.length) return <div className="text-slate-400 py-10 text-center">Нет данных</div>;

  const cx = data.regions.length / 2;
  const cz = data.indicators.length / 2;

  return (
    <div className="w-full">
      <div className="w-full h-[550px] rounded-xl overflow-hidden bg-slate-950/80 border border-slate-700/30">
        <Canvas camera={{ position: [cx + 8, 6, cz + 8], fov: 45 }} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
          <Scene data={data} />
        </Canvas>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3 justify-center text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded" style={{ background: '#2563eb' }} /><span>&lt;-2.5</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded" style={{ background: '#e2e8f0' }} /><span>Норма</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded" style={{ background: '#dc2626' }} /><span>&gt;2.5</span></div>
        <span className="text-slate-500">Высота = Z-score | Вращение мышью</span>
      </div>
    </div>
  );
}
