import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateStats } from '../store/slices/playerSlice';
import type { RootState } from '../store';

const SkillTree: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);

  const stats = [
    { key: 'sync', label: 'Sync', desc: 'Resonance with spirits' },
    { key: 'logic', label: 'Logic', desc: 'Mechanical & Physical laws' },
    { key: 'prowess', label: 'Prowess', desc: 'Direct combat strength' },
    { key: 'finesse', label: 'Finesse', desc: 'Agility & Precision' },
  ];

  const handleLevelUp = (stat: keyof typeof player.stats) => {
    dispatch(updateStats({ [stat]: player.stats[stat] + 1 }));
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
      <h3 className="text-xs uppercase font-bold text-slate-500 mb-6 tracking-[0.2em]">Attribute Tree</h3>
      
      <div className="space-y-6">
        {stats.map((s) => (
          <div key={s.key} className="p-4 bg-slate-900/50 rounded border border-slate-700 group hover:border-amber-900/50 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-amber-500 font-bold uppercase tracking-tighter text-lg">{s.label}</span>
              <span className="text-2xl font-black text-slate-100">{player.stats[s.key as keyof typeof player.stats]}</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase mb-4 tracking-widest">{s.desc}</p>
            
            <button 
              onClick={() => handleLevelUp(s.key as keyof typeof player.stats)}
              className="w-full py-2 bg-slate-800 hover:bg-amber-600 hover:text-slate-900 text-slate-400 text-[10px] uppercase font-bold border border-slate-700 rounded transition-all"
            >
              Enhance Component
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillTree;
