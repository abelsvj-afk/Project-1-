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

const nodes = worldMapData.nodes as MapNode[];
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
const PAD = 130;
const minX = Math.min(...xs) - PAD;
const minY = Math.min(...ys) - PAD;
const vbW = Math.max(...xs) - Math.min(...xs) + PAD * 2;
const vbH = Math.max(...ys) - Math.min(...ys) + PAD * 2;
const VIEWBOX = `${minX} ${minY} ${vbW} ${vbH}`;

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
    // Flag the hop so a future "Travel Deck" hazard storylet could react to it.
    dispatch(setGlobalFlag({ flag: 'last_travel_to', value: id }));
  };

  // Unique connection segments between discovered nodes.
  const segments: { a: MapNode; b: MapNode }[] = [];
  const seen = new Set<string>();
  nodes.forEach(n => {
    if (!discovered.has(n.id)) return;
    n.connections.forEach(cid => {
      if (!discovered.has(cid)) return;
      const key = [n.id, cid].sort().join('::');
      if (seen.has(key)) return;
      seen.add(key);
      const b = nodeById[cid];
      if (b) segments.push({ a: n, b });
    });
  });

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <h3 className="text-[10px] uppercase font-black text-amber-500 tracking-widest mb-1">World Map</h3>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          You are at <span className="text-amber-400 font-bold">{current?.name ?? location.replace(/_/g, ' ')}</span>.
          Tap a connected location to travel ({TRAVEL_TIME / 100}h per leg).
        </p>
      </div>

      <div className="bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
        <svg viewBox={VIEWBOX} className="w-full h-auto" style={{ aspectRatio: `${vbW} / ${vbH}` }}>
          {/* Connections */}
          {segments.map(({ a, b }, i) => {
            const active = a.id === location || b.id === location;
            return (
              <line
                key={i}
                x1={a.coordinates.x} y1={a.coordinates.y}
                x2={b.coordinates.x} y2={b.coordinates.y}
                stroke={active ? '#f59e0b' : '#334155'}
                strokeWidth={active ? 5 : 3}
                strokeDasharray={active ? undefined : '6 8'}
                opacity={active ? 0.8 : 0.5}
              />
            );
          })}

          {/* Nodes */}
          {nodes.filter(n => discovered.has(n.id)).map(n => {
            const isCurrent = n.id === location;
            const isVisited = visited.includes(n.id);
            const canTravel = travelable.has(n.id);
            const color = FACTION_COLOR[n.faction] ?? '#94a3b8';
            const r = n.type === 'major_hub' || n.type === 'hub' ? 26 : 20;
            return (
              <g
                key={n.id}
                onClick={() => travelTo(n.id)}
                style={{ cursor: canTravel ? 'pointer' : 'default' }}
                opacity={isVisited || canTravel ? 1 : 0.55}
              >
                {isCurrent && (
                  <circle cx={n.coordinates.x} cy={n.coordinates.y} r={r + 12}
                    fill="none" stroke="#f59e0b" strokeWidth={3} opacity={0.7}>
                    <animate attributeName="r" values={`${r + 8};${r + 16};${r + 8}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {canTravel && (
                  <circle cx={n.coordinates.x} cy={n.coordinates.y} r={r + 7}
                    fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="4 4" opacity={0.9} />
                )}
                <circle
                  cx={n.coordinates.x} cy={n.coordinates.y} r={r}
                  fill={isVisited ? color : '#1e293b'}
                  stroke={color}
                  strokeWidth={3}
                  fillOpacity={isCurrent ? 0.9 : isVisited ? 0.35 : 0.15}
                />
                <text
                  x={n.coordinates.x} y={n.coordinates.y + r + 22}
                  textAnchor="middle"
                  fontSize={22}
                  fontWeight={isCurrent ? 700 : 500}
                  fill={isCurrent ? '#fbbf24' : isVisited ? '#cbd5e1' : '#64748b'}
                >
                  {isVisited || canTravel ? n.name : '? ? ?'}
                </text>
                {canTravel && (
                  <text x={n.coordinates.x} y={n.coordinates.y + 6} textAnchor="middle"
                    fontSize={20} fontWeight={800} fill="#fbbf24">»</text>
                )}
              </g>
            );
          })}
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
