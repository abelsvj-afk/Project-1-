import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { upgradeEquipment, unequipItem } from '../store/slices/playerSlice';
import type { PlayerStats } from '../types/game';

const Status: React.FC = () => {
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
        const cost = item.level * 100;
        dispatch(upgradeEquipment({ slot, cost }));
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 shadow-2xl space-y-8">
      {/* Header Info */}
      <div className="flex justify-between items-start border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-100">{player.name}</h2>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] mt-1">Level {player.level} Anchor</p>
        </div>
        <div className="text-right">
            <div className="flex gap-4">
                <div>
                    <div className="text-[8px] font-bold text-orange-500 uppercase">Stamina</div>
                    <div className="text-lg font-black text-slate-100">{player.stamina}/{player.stats.stamina}</div>
                </div>
                <div>
                    <div className="text-[8px] font-bold text-blue-400 uppercase">Focus</div>
                    <div className="text-lg font-black text-slate-100">{player.focus}/{player.stats.focus}</div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Attributes Section */}
        <div className="space-y-6">
          <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-widest border-l-2 border-amber-600 pl-2">Resonance Pillars</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {attributes.map(attr => (
                <div key={attr.key}>
                <div className="flex justify-between items-end mb-1">
                    <span className={`text-xs font-black uppercase tracking-tight ${attr.color}`}>{attr.label}</span>
                    <span className="text-lg font-black text-slate-200">{player.stats[attr.key as keyof PlayerStats]}</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${attr.color.replace('text', 'bg')}`} 
                        style={{ width: `${(player.stats[attr.key as keyof PlayerStats] / 50) * 100}%` }}
                    />
                </div>
                </div>
            ))}
          </div>
        </div>

        {/* Equipment Section */}
        <div className="space-y-6">
          <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-widest border-l-2 border-blue-600 pl-2">Active Equipment</h3>
          <div className="grid grid-cols-1 gap-3">
            {(['head', 'chest', 'hands', 'weapon', 'relic'] as const).map(slot => {
                const item = player.equipment[slot];
                return (
                <div key={slot} className="p-3 bg-slate-800/40 rounded border border-slate-700/50 flex justify-between items-center group">
                    <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase">
                            {slot[0]}
                        </div>
                        <div>
                            <div className="text-[8px] uppercase font-bold text-slate-500">{slot}</div>
                            <div className={`text-xs font-bold ${item ? 'text-slate-100' : 'text-slate-700 italic'}`}>
                                {item ? item.name : 'Empty Slot'}
                            </div>
                        </div>
                    </div>

                    {item && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleUpgrade(slot)}
                                className="px-3 py-1 bg-slate-700 hover:bg-amber-600 text-[8px] font-black uppercase rounded text-slate-300 hover:text-slate-950"
                            >
                                Refine
                            </button>
                            <button 
                                onClick={() => dispatch(unequipItem(slot))}
                                className="px-3 py-1 bg-slate-700 hover:bg-red-900 text-[8px] font-black uppercase rounded text-slate-300"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;
