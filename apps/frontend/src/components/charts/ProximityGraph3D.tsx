'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ProximityGraph3DProps {
  data: {
    regions: string[];
    matrix?: number[][];
    distances?: number[][];
    anomalyScores?: number[];
  };
}

function Node({
  position,
  label,
  score,
  isAnomaly,
  isHovered,
  onHover,
  onUnhover,
}: {
  position: [number, number, number];
  label: string;
  score: number;
  isAnomaly: boolean;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const size = 0.15 + score * 0.3;

  useFrame((state) => {
    if (glowRef.current && isAnomaly) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 1.15;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      {isAnomaly && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[size * 1.8, 16, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.08} />
        </mesh>
      )}
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); onHover(); }}
        onPointerLeave={onUnhover}
        scale={isHovered ? 1.3 : 1}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={isAnomaly ? '#ef4444' : '#10b981'}
          emissive={isAnomaly ? '#ef4444' : '#10b981'}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <Html position={[0, size + 0.25, 0]} center style={{ pointerEvents: 'none' }}>
        <div className={`text-[11px] whitespace-nowrap px-2 py-1 rounded-md transition-all ${isHovered ? 'bg-slate-800/95 text-white border border-slate-600/50 shadow-lg' : 'text-slate-400'}`}>
          {label}
          {isHovered && (
            <span className="ml-1.5 font-mono font-bold" style={{ color: isAnomaly ? '#ef4444' : '#10b981' }}>
              {score.toFixed(3)}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

function Edge({ start, end, opacity }: { start: [number, number, number]; end: [number, number, number]; opacity: number }) {
  const lineRef = useRef<THREE.Line>(null);

  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...start, ...end], 3));
    const mat = new THREE.LineBasicMaterial({ color: '#6366f1', transparent: true, opacity: Math.max(0.05, opacity * 0.4) });
    return new THREE.Line(geo, mat);
  }, [start, end, opacity]);

  return <primitive ref={lineRef} object={line} />;
}

// Deterministic seeded random for stable layout
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Scene({ data }: ProximityGraph3DProps) {
  const { regions, anomalyScores } = data;
  const distances = data.matrix || data.distances || [];
  const [hovered, setHovered] = useState<number | null>(null);

  const handleHover = useCallback((i: number) => setHovered(i), []);
  const handleUnhover = useCallback(() => setHovered(null), []);

  const positions = useMemo(() => {
    const n = regions.length;
    if (!distances.length || n === 0) return [];

    const rand = seededRandom(42);
    const pos: [number, number, number][] = regions.map((_, i) => {
      const angle = (i / n) * Math.PI * 2;
      const r = 2.5 + rand() * 0.5;
      return [Math.cos(angle) * r, (rand() - 0.5) * 1.5, Math.sin(angle) * r];
    });

    // Force-directed layout iterations
    for (let iter = 0; iter < 100; iter++) {
      for (let i = 0; i < n; i++) {
        let fx = 0, fy = 0, fz = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const dx = pos[i][0] - pos[j][0];
          const dy = pos[i][1] - pos[j][1];
          const dz = pos[i][2] - pos[j][2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
          const targetDist = (distances[i]?.[j] ?? 1) * 0.7;
          const force = (dist - targetDist) * 0.008;
          fx -= (dx / dist) * force;
          fy -= (dy / dist) * force;
          fz -= (dz / dist) * force;
        }
        pos[i] = [pos[i][0] + fx, pos[i][1] + fy, pos[i][2] + fz];
      }
    }
    return pos;
  }, [regions, distances]);

  const edges = useMemo(() => {
    if (!distances.length || !positions.length) return [];
    const n = regions.length;
    let maxDist = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if ((distances[i]?.[j] ?? 0) > maxDist) maxDist = distances[i][j];

    const allDists: number[] = [];
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        allDists.push(distances[i]?.[j] ?? 0);
    allDists.sort((a, b) => a - b);
    const threshold = allDists[Math.floor(allDists.length * 0.6)] ?? maxDist;

    const result: { start: [number, number, number]; end: [number, number, number]; opacity: number }[] = [];
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d = distances[i]?.[j] ?? 0;
        if (d <= threshold && positions[i] && positions[j])
          result.push({ start: positions[i], end: positions[j], opacity: maxDist > 0 ? 1 - d / maxDist : 0.5 });
      }
    return result;
  }, [regions, distances, positions]);

  if (!positions.length) return null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6366f1" />
      {edges.map((e, i) => <Edge key={i} start={e.start} end={e.end} opacity={e.opacity} />)}
      {regions.map((region, i) => {
        const score = anomalyScores?.[i] ?? 0;
        return (
          <Node
            key={region}
            position={positions[i]}
            label={region}
            score={score}
            isAnomaly={score > 0.65}
            isHovered={hovered === i}
            onHover={() => handleHover(i)}
            onUnhover={handleUnhover}
          />
        );
      })}
      <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} maxDistance={15} minDistance={2} />
    </>
  );
}

export default function ProximityGraph3D({ data }: ProximityGraph3DProps) {
  if (!data?.regions?.length) return <div className="text-slate-400 py-10 text-center">Нет данных</div>;

  return (
    <div className="w-full">
      <div className="w-full h-[500px] rounded-xl overflow-hidden bg-slate-950/80 border border-slate-700/30">
        <Canvas camera={{ position: [5, 3, 5], fov: 50 }}>
          <Scene data={data} />
        </Canvas>
      </div>
      <div className="flex items-center gap-6 mt-3 justify-center text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Аномалия</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>Норма</span></div>
        <span className="text-slate-500">Вращение мышью | Зум колёсиком</span>
      </div>
    </div>
  );
}
