'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

// Geographic coords of 8 regions (lon, lat)
const REGION_COORDS: Record<string, [number, number]> = {
  rostov:    [39.70, 47.22],
  krasnodar: [38.97, 45.04],
  volgograd: [44.51, 48.70],
  astrakhan: [47.50, 46.35],
  kalmykia:  [45.32, 46.12],
  adygea:    [40.10, 44.81],
  stavropol: [43.02, 45.05],
  dagestan:  [47.50, 43.32],
};

// Approximate connections for proximity lines
const CONNECTIONS: [string, string][] = [
  ['rostov', 'krasnodar'],
  ['rostov', 'volgograd'],
  ['rostov', 'kalmykia'],
  ['krasnodar', 'adygea'],
  ['krasnodar', 'stavropol'],
  ['volgograd', 'astrakhan'],
  ['volgograd', 'kalmykia'],
  ['kalmykia', 'stavropol'],
  ['kalmykia', 'astrakhan'],
  ['stavropol', 'dagestan'],
  ['astrakhan', 'dagestan'],
];

function lonLatTo3D(lon: number, lat: number): [number, number] {
  // Map to [-5, 5] range (centered on the region cluster)
  const lonMin = 38.8, lonMax = 47.8;
  const latMin = 43.0, latMax = 49.0;
  const x = ((lon - lonMin) / (lonMax - lonMin)) * 10 - 5;
  const z = -((lat - latMin) / (latMax - latMin)) * 7 + 3.5;
  return [x, z];
}

interface RegionData {
  id: string;
  name: string;
  isAnomaly: boolean;
  score: number;
  stability: string;
}

function RegionPillar({
  region,
  isSelected,
  onSelect,
}: {
  region: RegionData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [coords] = useState(() => lonLatTo3D(...REGION_COORDS[region.id]));

  const height = Math.max(0.3, region.score * 2.5 + 0.3);
  const color = region.isAnomaly
    ? region.score > 0.7 ? '#FF3D3D' : '#FF7B00'
    : '#00FFD1';
  const emissive = region.isAnomaly ? '#FF5500' : '#00FFD1';
  const emissiveIntensity = hovered ? 0.8 : isSelected ? 0.6 : 0.3;

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Gentle pulse for anomalies
      if (region.isAnomaly) {
        const t = Date.now() * 0.002;
        meshRef.current.scale.y = 1 + Math.sin(t + region.id.charCodeAt(0) * 0.5) * 0.04;
      }
    }
    if (ringRef.current && region.isAnomaly) {
      ringRef.current.rotation.z += delta * 0.8;
      const t = Date.now() * 0.0015;
      ringRef.current.scale.set(
        1 + Math.sin(t + region.id.charCodeAt(0)) * 0.15,
        1 + Math.sin(t + region.id.charCodeAt(0)) * 0.15,
        1,
      );
    }
  });

  return (
    <group position={[coords[0], 0, coords[1]]}>
      {/* Base glow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isSelected ? 0.15 : 0.07}
        />
      </mesh>

      {/* Pillar */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onClick={() => onSelect(region.id)}
        onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = ''; }}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.28, height, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Top cap glow */}
      <mesh position={[0, height + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Anomaly ring spinner */}
      {region.isAnomaly && (
        <mesh ref={ringRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.52, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      <Html
        position={[0, height + 0.35, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="max-w-[76px] text-center text-[10px] font-mono leading-tight"
          style={{
            color: hovered || isSelected ? '#fff' : color,
            textShadow: `0 0 8px ${color}`,
          }}
        >
          {region.name.split(' ').slice(-1)[0]}
        </div>
      </Html>
    </group>
  );
}

function ConnectionLines({ regions }: { regions: RegionData[] }) {
  const regionMap = useMemo(() => {
    const m = new Map<string, RegionData>();
    regions.forEach((r) => m.set(r.id, r));
    return m;
  }, [regions]);

  return (
    <>
      {CONNECTIONS.map(([a, b]) => {
        const ra = regionMap.get(a);
        const rb = regionMap.get(b);
        if (!ra || !rb) return null;
        const ca = lonLatTo3D(...REGION_COORDS[a]);
        const cb = lonLatTo3D(...REGION_COORDS[b]);
        const bothAnomaly = ra.isAnomaly && rb.isAnomaly;
        return (
          <Line
            key={`${a}-${b}`}
            points={[
              new THREE.Vector3(ca[0], 0.05, ca[1]),
              new THREE.Vector3(cb[0], 0.05, cb[1]),
            ]}
            color={bothAnomaly ? '#FF7B00' : '#00FFD1'}
            lineWidth={bothAnomaly ? 0.8 : 0.4}
            transparent
            opacity={bothAnomaly ? 0.5 : 0.2}
          />
        );
      })}
    </>
  );
}

function GridPlane() {
  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#030308" metalness={0.2} roughness={0.9} />
      </mesh>
      {/* Grid lines */}
      {Array.from({ length: 15 }, (_, i) => {
        const x = -7 + i;
        return (
          <Line
            key={`v${i}`}
            points={[new THREE.Vector3(x, 0.01, -5), new THREE.Vector3(x, 0.01, 5)]}
            color="#00FFD1"
            lineWidth={0.3}
            transparent
            opacity={0.06}
          />
        );
      })}
      {Array.from({ length: 11 }, (_, i) => {
        const z = -5 + i;
        return (
          <Line
            key={`h${i}`}
            points={[new THREE.Vector3(-7, 0.01, z), new THREE.Vector3(7, 0.01, z)]}
            color="#00FFD1"
            lineWidth={0.3}
            transparent
            opacity={0.06}
          />
        );
      })}
    </>
  );
}

interface RussiaGlobe3DProps {
  regions?: RegionData[];
  onRegionClick?: (regionId: string) => void;
}

const DEFAULT_REGIONS: RegionData[] = [
  { id: 'rostov',    name: 'Ростовская обл.', isAnomaly: false, score: 0.42, stability: 'normal' },
  { id: 'krasnodar', name: 'Краснодарский кр.', isAnomaly: false, score: 0.35, stability: 'normal' },
  { id: 'volgograd', name: 'Волгоградская обл.', isAnomaly: true,  score: 0.61, stability: 'temporary' },
  { id: 'astrakhan', name: 'Астраханская обл.', isAnomaly: false, score: 0.45, stability: 'normal' },
  { id: 'kalmykia',  name: 'Респ. Калмыкия',   isAnomaly: true,  score: 0.88, stability: 'stable' },
  { id: 'adygea',    name: 'Респ. Адыгея',      isAnomaly: false, score: 0.38, stability: 'normal' },
  { id: 'stavropol', name: 'Ставропольский кр.', isAnomaly: false, score: 0.44, stability: 'normal' },
  { id: 'dagestan',  name: 'Респ. Дагестан',    isAnomaly: true,  score: 0.82, stability: 'stable' },
];

export default function RussiaGlobe3D({ regions = DEFAULT_REGIONS, onRegionClick }: RussiaGlobe3DProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
    onRegionClick?.(id);
  };

  const selectedRegion = regions.find((r) => r.id === selected);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-cyan-500/10 bg-[#030308]">
      {/* Ambient label */}
      <div className="absolute top-4 left-5 z-10 pointer-events-none">
        <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.2em]">
          ЮФО + СКФО — 3D Карта аномалий
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-5 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#FF3D3D]" />
          <span className="text-[10px] font-mono text-slate-500">Устойчивая аномалия</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#FF7B00]" />
          <span className="text-[10px] font-mono text-slate-500">Временная аномалия</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00FFD1]" />
          <span className="text-[10px] font-mono text-slate-500">Норма</span>
        </div>
      </div>

      {/* Region info popup */}
      {selectedRegion && (
        <div className="absolute bottom-4 left-5 z-10 glass rounded-xl p-3 max-w-xs border border-cyan-500/15">
          <p className="text-xs font-mono text-cyan-400 mb-1">{selectedRegion.name}</p>
          <div className="flex gap-4 text-[11px] text-slate-400">
            <span>Score: <span className="text-white font-mono">{selectedRegion.score.toFixed(3)}</span></span>
            <span className={selectedRegion.isAnomaly ? 'text-amber-400' : 'text-cyan-400'}>
              {selectedRegion.isAnomaly ? '⚠ Аномалия' : '✓ Норма'}
            </span>
            <span className={
              selectedRegion.stability === 'stable' ? 'text-red-400' :
              selectedRegion.stability === 'temporary' ? 'text-amber-400' : 'text-slate-500'
            }>
              {selectedRegion.stability === 'stable' ? 'Устойчивая' :
               selectedRegion.stability === 'temporary' ? 'Временная' : 'Норма'}
            </span>
          </div>
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [0, 8, 9], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#030308']} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
        <pointLight position={[-3, 4, -3]} color="#4D9FFF" intensity={0.6} />
        <pointLight position={[3, 3, 3]} color="#00FFD1" intensity={0.3} />

        {/* Fog for atmosphere */}
        <fog attach="fog" args={['#030308', 12, 30]} />

        <GridPlane />
        <ConnectionLines regions={regions} />
        {regions.map((region) => (
          <RegionPillar
            key={region.id}
            region={region}
            isSelected={selected === region.id}
            onSelect={handleSelect}
          />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate
          autoRotateSpeed={0.4}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
