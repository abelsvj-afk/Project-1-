import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const BlueprintLibrary: React.FC = () => {
  const game = useSelector((state: RootState) => state.game);

  const blueprints = [
    { id: 'germ_theory', name: 'Germ Theory', desc: 'Modern understanding of microscopic pathogens.' },
    { id: 'double_entry', name: 'Double-Entry Bookkeeping', desc: 'Advanced financial tracking systems.' },
    { id: 'steam_cycle', name: 'Rankine Cycle', desc: 'Efficiency optimization for steam engines.' },
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
      <h3 className="text-xs uppercase font-bold text-slate-500 mb-6 tracking-[0.2em]">Isekai Blueprints</h3>
      
      <div className="space-y-4">
        {blueprints.map((b) => {
          const isUnlocked = game.unlockedBlueprints?.includes(b.id);
          return (
            <div key={b.id} className={`p-4 rounded border ${isUnlocked ? 'bg-slate-900/50 border-emerald-900/50' : 'bg-slate-900/20 border-slate-800 opacity-50'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold uppercase tracking-tight ${isUnlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {b.name}
                </span>
                {isUnlocked && <span className="text-[10px] bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700/50">UNLOCKED</span>}
              </div>
              <p className="text-xs text-slate-500">{b.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlueprintLibrary;
