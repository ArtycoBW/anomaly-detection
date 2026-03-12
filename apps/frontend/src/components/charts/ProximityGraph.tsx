'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';

interface ProximityGraphProps {
  data: {
    regions: string[];
    distances?: number[][];
    matrix?: number[][];
    anomalyScores?: number[];
  };
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  score: number;
  isAnomaly: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  distance: number;
  opacity: number;
}

export default function ProximityGraph({ data }: ProximityGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 500 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.max(400, width), height: Math.max(400, width * 0.7) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data?.regions?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const { regions, anomalyScores } = data;
    const distances = data.matrix || data.distances || [];
    if (!distances.length) return;

    // Normalize distances for opacity
    let maxDist = 0;
    for (const row of distances) {
      for (const d of row) {
        if (d > maxDist) maxDist = d;
      }
    }

    // Create nodes
    const nodes: GraphNode[] = regions.map((region, i) => {
      const score = anomalyScores?.[i] ?? 0;
      return {
        id: region,
        label: region,
        score,
        isAnomaly: score > 0.65,
      };
    });

    // Create links - only connect pairs with distance below median for clarity
    const allDists: number[] = [];
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        allDists.push(distances[i][j]);
      }
    }
    allDists.sort((a, b) => a - b);
    const medianDist = allDists[Math.floor(allDists.length * 0.6)] ?? maxDist;

    const links: GraphLink[] = [];
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const dist = distances[i][j];
        if (dist <= medianDist) {
          links.push({
            source: nodes[i],
            target: nodes[j],
            distance: dist,
            opacity: maxDist > 0 ? 1 - dist / maxDist : 0.5,
          });
        }
      }
    }

    // Create container group with zoom
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((d) => 50 + d.distance * 200 / (maxDist || 1))
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#475569')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', (d) => Math.max(0.1, d.opacity * 0.6));

    // Draw nodes
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    node.append('circle')
      .attr('r', (d) => 8 + d.score * 16)
      .attr('fill', (d) => d.isAnomaly ? '#ef4444' : '#22c55e')
      .attr('stroke', (d) => d.isAnomaly ? '#fca5a5' : '#86efac')
      .attr('stroke-width', 2)
      .attr('opacity', 0.85);

    // Node labels
    node.append('text')
      .text((d) => d.label)
      .attr('dy', (d) => -(12 + d.score * 16))
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none');

    // Tooltip on hover
    node.append('title')
      .text((d) => `${d.label}\nОценка аномалии: ${d.score.toFixed(2)}`);

    // Tick handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          'w-full rounded-lg',
          'bg-slate-900/50 border border-slate-700/50'
        )}
      />
      <div className="flex items-center gap-6 mt-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-slate-400">Аномалия</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-slate-400">Норма</span>
        </div>
        <span className="text-xs text-slate-500">
          Ближе = больше сходство | Перетаскивание узлов | Прокрутка для масштабирования
        </span>
      </div>
    </div>
  );
}
