import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { updateRelationship } from '../store/slices/gameSlice';

const KinshipRoster: React.FC = () => {
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);
  const player = useSelector((state: RootState) => state.player);

  // Filter NPCs: Must be known AND at the current location
  const localNPCs = Object.values(game.npcs).filter(npc => 
      game.knownNames.includes(npc.id) && 
      npc.simulatedState.lastLocation === player.location
  ).sort((a, b) => {
      if (a.isGenerated && !b.isGenerated) return 1;
      if (!a.isGenerated && b.isGenerated) return -1;
      return 0;
  });

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Relationships */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-4 border-b border-slate-700 pb-2">Present in Area</h4>
        <div className="grid grid-cols-1 gap-4">
          {localNPCs.length > 0 ? localNPCs.map((npc) => {
            const rel = game.relationships[npc.id] || { trust: 0, romance: 0, fear: 0 };
            const isDead = npc.simulatedState.isDead;
            
            return (
              <div key={npc.id} className={`p-4 bg-slate-900/50 rounded border ${isDead ? 'border-red-900/50 opacity-50' : 'border-slate-700'} relative overflow-hidden`}>
                
                {isDead && (
                    <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black text-red-500/20 uppercase rotate-[-15deg]">Deceased</span>
                    </div>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="font-bold text-amber-500 flex items-center gap-2">
                        {npc.name}
                        {npc.isGenerated && <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">Local</span>}
                    </div>
                    <div className="text-[10px] uppercase text-slate-500">{npc.title} • {npc.factionId}</div>
                  </div>
                </div>

                {/* The Social Matrix Bars */}
                <div className="space-y-3 relative z-10">
                    {/* TRUST */}
                    <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                            <span>Trust</span>
                            <span className={rel.trust > 0 ? 'text-emerald-400' : rel.trust < 0 ? 'text-red-400' : ''}>{rel.trust}</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${rel.trust >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ 
                                width: `${Math.abs(rel.trust)}%`,
                                marginLeft: rel.trust >= 0 ? '50%' : `${50 - Math.abs(rel.trust)}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* FEAR/ROMANCE hidden for brevity unless relevant */}
                </div>
                
                <div className="mt-4 text-[9px] text-slate-500 italic uppercase tracking-wider">
                    Interaction available in Console
                </div>
              </div>
            );
          }) : (
            <div className="text-center p-8 border border-dashed border-slate-800 rounded text-slate-600">
                <div className="text-xs uppercase font-bold mb-1">No known figures</div>
                <div className="text-[10px]">Explore or move to find others</div>
            </div>
          )}
        </div>
      </div>

      {/* Companions */}
      <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Active Companions</h4>
        <div className="space-y-2">
          {game.companions.length > 0 ? (
            game.companions.map(compId => {
                const c = game.npcs[compId];
                return (
                    <div key={compId} className="text-xs text-amber-200 font-bold uppercase">{c ? c.name : compId}</div>
                );
            })
          ) : (
            <div className="text-xs text-slate-600 italic">Traveling alone</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KinshipRoster;
