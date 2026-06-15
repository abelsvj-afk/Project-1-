import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setLocation } from '../store/slices/playerSlice';
import { visitNode, incrementTime, setGlobalFlag } from '../store/slices/gameSlice';
import worldMapData from '../data/world_map.json';

interface MapNode {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  type: string;
  faction: string;
  description: string;
  connections: string[];
}
interface MapRegion { id: string; name: string; nodes: string[]; threatLevel: number; }

const nodes = worldMapData.nodes as MapNode[];
const regions = (worldMapData.regions ?? []) as MapRegion[];
const nodeById: { [id: string]: MapNode } = Object.fromEntries(nodes.map(n => [n.id, n]));

const TRAVEL_TIME = 100; // game-time units per hop

const FACTION_COLOR: { [f: string]: string } = {
  neutral: '#94a3b8',
  scavengers: '#f59e0b',
  syndicate: '#ef4444',
  adepts: '#a855f7',
};

// Fit the SVG viewBox around all node coordinates with padding.
const xs = nodes.map(n => n.coordinates.x);
const ys = nodes.map(n => n.coordinates.y);
const PAD = 150;
const minX = Math.min(...xs) - PAD;
const minY = Math.min(...ys) - PAD;
const vbW = Math.max(...xs) - Math.min(...xs) + PAD * 2;
const vbH = Math.max(...ys) - Math.min(...ys) + PAD * 2;
const VIEWBOX = `${minX} ${minY} ${vbW} ${vbH}`;

// Crisp label with a dark halo so it reads over any terrain.
const Label: React.FC<React.SVGProps<SVGTextElement>> = ({ children, ...props }) => (
  <text
    {...props}
    stroke="#0a0a0c"
    strokeWidth={5}
    strokeLinejoin="round"
    style={{ paintOrder: 'stroke', ...(props.style || {}) }}
  >
    {children}
  </text>
);

const WorldMap: React.FC = () => {
  const dispatch = useDispatch();
  const location = useSelector((s: RootState) => s.player.location);
  const visited = useSelector((s: RootState) => s.game.visitedNodes);

  const current = nodeById[location];

  // Discovered = visited nodes plus anything they connect to (fog-of-war edge).
  const discovered = new Set<string>(visited);
  visited.forEach(id => nodeById[id]?.connections.forEach(c => discovered.add(c)));

  const travelable = new Set<string>(current?.connections ?? []);

  const travelTo = (id: string) => {
    if (!travelable.has(id)) return;
    dispatch(setLocation(id));
    dispatch(visitNode(id));
    dispatch(incrementTime(TRAVEL_TIME));
    dispatch(setGlobalFlag({ flag: 'last_travel_to', value: id }));
  };

  // Unique route segments between discovered nodes.
  const segments: { a: MapNode; b: MapNode }[] = [];
  const seenSeg = new Set<string>();
  nodes.forEach(n => {
    if (!discovered.has(n.id)) return;
    n.connections.forEach(cid => {
      if (!discovered.has(cid)) return;
      const key = [n.id, cid].sort().join('::');
      if (seenSeg.has(key)) return;
      seenSeg.add(key);
      const b = nodeById[cid];
      if (b) segments.push({ a: n, b });
    });
  });

  // Region zones, sized from their discovered member nodes.
  const zones = regions.map(reg => {
    const members = reg.nodes.map(id => nodeById[id]).filter(n => n && discovered.has(n.id));
    if (members.length === 0) return null;
    const rx = members.map(m => m.coordinates.x);
    const ry = members.map(m => m.coordinates.y);
    const cx = (Math.min(...rx) + Math.max(...rx)) / 2;
    const cy = (Math.min(...ry) + Math.max(...ry)) / 2;
    const w = Math.max(...rx) - Math.min(...rx) + 200;
    const h = Math.max(...ry) - Math.min(...ry) + 200;
    return { reg, cx, cy, w, h };
  }).filter(Boolean) as { reg: MapRegion; cx: number; cy: number; w: number; h: number }[];

  const glyph = (n: MapNode, color: string, isVisited: boolean, isCurrent: boolean) => {
    const x = n.coordinates.x, y = n.coordinates.y;
    const fill = isVisited ? color : '#1e293b';
    const fillOpacity = isCurrent ? 0.9 : isVisited ? 0.4 : 0.18;
    const common = { fill, fillOpacity, stroke: color, strokeWidth: 3 };
    if (n.id === 'adept_spires') {
      return <rect x={x - 18} y={y - 18} width={36} height={36} transform={`rotate(45 ${x} ${y})`} rx={4} {...common} />;
    }
    if (n.type === 'wasteland') {
      return <><circle cx={x} cy={y} r={22} {...common} /><circle cx={x} cy={y} r={12} fill="none" stroke={color} strokeWidth={2} opacity={0.7} /></>;
    }
    if (n.type === 'hub' || n.type === 'major_hub') {
      return <><rect x={x - 24} y={y - 22} width={48} height={44} rx={3} {...common} /><rect x={x - 8} y={y - 30} width={16} height={10} fill={color} fillOpacity={0.8} /></>;
    }
    return <circle cx={x} cy={y} r={16} {...common} />;
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <h3 className="text-[10px] uppercase font-black text-amber-500 tracking-widest mb-1">The Borderlands of Eldoria</h3>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          You are at <span className="text-amber-400 font-bold">{current?.name ?? location.replace(/_/g, ' ')}</span>.
          Tap a glowing location to travel ({TRAVEL_TIME / 100}h per leg).
        </p>
      </div>

      <div className="rounded-lg border border-amber-900/40 overflow-hidden shadow-inner">
        <svg viewBox={VIEWBOX} className="w-full h-auto" style={{ aspectRatio: `${vbW} / ${vbH}` }}>
          <defs>
            <radialGradient id="wm-bg" cx="50%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#241b2e" />
              <stop offset="55%" stopColor="#15121c" />
              <stop offset="100%" stopColor="#0a0a0c" />
            </radialGradient>
            <pattern id="wm-grain" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="#fbbf24" strokeWidth="1" opacity="0.04" />
            </pattern>
          </defs>

          {/* Terrain */}
          <rect x={minX} y={minY} width={vbW} height={vbH} fill="url(#wm-bg)" />
          <rect x={minX} y={minY} width={vbW} height={vbH} fill="url(#wm-grain)" />

          {/* Region zones */}
          {zones.map(({ reg, cx, cy, w, h }) => {
            const zc = reg.threatLevel >= 2 ? '#ef4444' : '#10b981';
            return (
              <g key={reg.id}>
                <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={zc} fillOpacity={0.05}
                  stroke={zc} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="10 12" />
                <Label x={cx} y={cy - h / 2 + 6} textAnchor="middle" fontSize={20} fontWeight={700}
                  fill={zc} fillOpacity={0.7} letterSpacing={2} style={{ textTransform: 'uppercase' }}>
                  {reg.name}
                </Label>
              </g>
            );
          })}

          {/* Routes */}
          {segments.map(({ a, b }, i) => {
            const active = a.id === location || b.id === location;
            return (
              <line key={i}
                x1={a.coordinates.x} y1={a.coordinates.y} x2={b.coordinates.x} y2={b.coordinates.y}
                stroke={active ? '#f59e0b' : '#6b5840'} strokeWidth={active ? 5 : 3}
                strokeDasharray="2 10" strokeLinecap="round" opacity={active ? 0.95 : 0.6} />
            );
          })}

          {/* Nodes */}
          {nodes.filter(n => discovered.has(n.id)).map(n => {
            const isCurrent = n.id === location;
            const isVisited = visited.includes(n.id);
            const canTravel = travelable.has(n.id);
            const color = FACTION_COLOR[n.faction] ?? '#94a3b8';
            const labelY = n.coordinates.y + (n.type === 'hub' || n.type === 'major_hub' ? 42 : 36);
            return (
              <g key={n.id} onClick={() => travelTo(n.id)}
                style={{ cursor: canTravel ? 'pointer' : 'default' }}
                opacity={isVisited || canTravel ? 1 : 0.6}>
                {isCurrent && (
                  <circle cx={n.coordinates.x} cy={n.coordinates.y} r={40} fill="none" stroke="#f59e0b" strokeWidth={3} opacity={0.7}>
                    <animate attributeName="r" values="34;46;34" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.15;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {canTravel && (
                  <circle cx={n.coordinates.x} cy={n.coordinates.y} r={34} fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="4 5" opacity={0.9} />
                )}
                {glyph(n, color, isVisited, isCurrent)}
                <Label x={n.coordinates.x} y={labelY} textAnchor="middle" fontSize={22}
                  fontWeight={isCurrent ? 800 : 600}
                  fill={isCurrent ? '#fbbf24' : isVisited ? '#e2e8f0' : '#94a3b8'}>
                  {isVisited || canTravel ? n.name : '? ? ?'}
                </Label>
                {canTravel && (
                  <Label x={n.coordinates.x} y={n.coordinates.y + 6} textAnchor="middle"
                    fontSize={18} fontWeight={800} fill="#fbbf24">»</Label>
                )}
              </g>
            );
          })}

          {/* Compass rose */}
          <g transform={`translate(${minX + vbW - 70}, ${minY + 70})`} opacity={0.7}>
            <circle r={34} fill="#0a0a0c" fillOpacity={0.5} stroke="#6b5840" strokeWidth={2} />
            <path d="M0,-28 L7,0 L0,28 L-7,0 Z" fill="#f59e0b" fillOpacity={0.8} />
            <path d="M-28,0 L0,-7 L28,0 L0,7 Z" fill="#6b5840" />
            <Label x={0} y={-36} textAnchor="middle" fontSize={16} fontWeight={800} fill="#f59e0b">N</Label>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(FACTION_COLOR).map(([f, c]) => (
          <div key={f} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[9px] uppercase text-slate-500 tracking-wider">{f}</span>
          </div>
        ))}
      </div>

      {current?.description && (
        <p className="text-[10px] text-slate-400 italic leading-relaxed border-t border-slate-800 pt-2">
          {current.description}
        </p>
      )}
    </div>
  );
};

export default WorldMap;
