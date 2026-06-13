import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { upgradeEquipment } from '../store/slices/playerSlice';
import type { Equipment, PlayerStats } from '../types/game';

const CharacterDossier: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);

  const attributes = [
    { key: 'vessel', label: 'Vessel', color: 'text-orange-500', magic: 'Thermal' },
    { key: 'logic', label: 'Logic', color: 'text-blue-400', magic: 'Vector' },
    { key: 'finesse', label: 'Finesse', color: 'text-purple-400', magic: 'Cognitive' },
    { key: 'resonance', label: 'Resonance', color: 'text-emerald-400', magic: 'Biomorphic' },
  ];

  const handleUpgrade = (slot: keyof typeof player.equipment) => {
    const item = player.equipment[slot];
    if (item) {
        const cost = item.level * 100; // Simplified cost logic
        dispatch(upgradeEquipment({ slot, cost }));
    }
  };

  return (
    <div className="bg-slate-900 p-8 rounded-lg border border-slate-700 shadow-2xl max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-10 border-b border-slate-800 pb-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-100">{player.name}</h2>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-[0.3em] mt-2">Level {player.level} Anchor • {player.presenceDescription}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-slate-100">{player.wealth}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Shards</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Attributes Column */}
        <div className="space-y-8">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em] mb-4">Core Resonance Pillars</h3>
          {attributes.map(attr => (
            <div key={attr.key} className="relative">
              <div className="flex justify-between items-end mb-2">
                <span className={`text-lg font-black uppercase tracking-tight ${attr.color}`}>{attr.label}</span>
                <span className="text-2xl font-black text-slate-200">{player.stats[attr.key as keyof PlayerStats]}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-current ${attr.color.replace('text', 'bg')}`} 
                    style={{ width: `${(player.stats[attr.key as keyof PlayerStats] / 50) * 100}%` }}
                />
              </div>
              <div className="text-[9px] uppercase font-bold text-slate-600 mt-1 tracking-widest">Powers {attr.magic} Currents</div>
            </div>
          ))}
        </div>

        {/* Equipment Column */}
        <div className="space-y-6">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em] mb-4">Active Equipment</h3>
          {(['head', 'chest', 'hands', 'weapon', 'relic'] as const).map(slot => {
            const item = player.equipment[slot];
            return (
              <div key={slot} className="p-4 bg-slate-800/40 rounded border border-slate-700/50 group hover:border-slate-500 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1">{slot}</div>
                    <div className={`font-bold ${item ? 'text-slate-100' : 'text-slate-700 italic'}`}>
                        {item ? item.name : 'Unassigned Slot'}
                    </div>
                  </div>
                  {item && (
                    <div className="text-right">
                        <div className="text-[10px] font-black text-amber-500 uppercase">Lv. {item.level}/{item.maxLevel}</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold">{item.quality}</div>
                    </div>
                  )}
                </div>

                {item && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex gap-4 mb-4">
                            {Object.entries(item.attributes).map(([k, v]) => (
                                <div key={k} className="text-[10px] font-bold text-emerald-400 uppercase">+{v} {k}</div>
                            ))}
                        </div>
                        <button 
                            onClick={() => handleUpgrade(slot)}
                            disabled={item.level >= item.maxLevel || player.wealth < item.level * 100}
                            className={`w-full py-2 text-[9px] uppercase font-black tracking-widest rounded transition-all ${
                                item.level < item.maxLevel && player.wealth >= item.level * 100
                                ? 'bg-slate-700 hover:bg-emerald-600 hover:text-slate-900 text-slate-300'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            {item.level < item.maxLevel ? `Refine Component (${item.level * 100} Shards)` : 'Maximum Refinement Reached'}
                        </button>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CharacterDossier;
