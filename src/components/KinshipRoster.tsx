import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { updateAffinity } from '../store/slices/gameSlice';
import socialData from '../data/socialData.json';

const KinshipRoster: React.FC = () => {
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Relationships */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Social Network</h4>
        <div className="grid grid-cols-1 gap-3">
          {socialData.npcs.map((npc) => {
            const affinity = game.affinity[npc.id] || 0;
            const status = game.relationships[npc.id] || 'stranger';
            
            return (
              <div key={npc.id} className="p-4 bg-slate-900/50 rounded border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-slate-200">{npc.name}</div>
                    <div className="text-[10px] uppercase text-slate-500">{npc.factionId?.replace(/_/g, ' ') || 'Freelancer'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-bold uppercase ${
                      status === 'friend' ? 'text-emerald-400' : 
                      status === 'enemy' ? 'text-red-400' : 'text-slate-500'
                    }`}>{status}</div>
                  </div>
                </div>

                {/* Affinity Bar */}
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full transition-all duration-500 ${affinity >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ 
                      width: `${Math.abs(affinity)}%`,
                      marginLeft: affinity >= 0 ? '50%' : `${50 - Math.abs(affinity)}%`
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => dispatch(updateAffinity({ npcId: npc.id, change: 5 }))}
                    className="flex-1 text-[8px] uppercase font-bold py-1 bg-slate-800 hover:bg-emerald-900/40 text-slate-500 hover:text-emerald-400 rounded border border-slate-700 transition-all"
                  >
                    Gift / Aid
                  </button>
                  <button 
                    onClick={() => dispatch(updateAffinity({ npcId: npc.id, change: -5 }))}
                    className="flex-1 text-[8px] uppercase font-bold py-1 bg-slate-800 hover:bg-red-900/40 text-slate-500 hover:text-red-400 rounded border border-slate-700 transition-all"
                  >
                    Insult / Harm
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Companions & Family */}
      <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Companions & Kin</h4>
        <div className="space-y-2">
          {game.companions.length > 0 ? (
            game.companions.map(compId => (
              <div key={compId} className="text-xs text-amber-200 font-bold uppercase">{compId}</div>
            ))
          ) : (
            <div className="text-xs text-slate-600 italic">Traveling alone</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KinshipRoster;
