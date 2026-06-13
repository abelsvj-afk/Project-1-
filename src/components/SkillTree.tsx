import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { spendSkillPoint } from '../store/slices/playerSlice';
import type { RootState } from '../store';
import type { PlayerStats } from '../types/game';

const SkillTree: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);

  const attributes = [
    { 
      key: 'vessel', 
      label: 'Vessel', 
      magic: 'Thermal Entropy', 
      desc: 'Physical capacity to hold magic. Powers Fire, Ice, and Lightning.',
      color: 'text-orange-500'
    },
    { 
      key: 'logic', 
      label: 'Logic', 
      magic: 'Vector Resonance', 
      desc: 'Calculating resonance frequencies. Powers Earth, Wind, and Gravity.',
      color: 'text-blue-400'
    },
    { 
      key: 'finesse', 
      label: 'Finesse', 
      magic: 'Cognitive Distortion', 
      desc: 'Precision in channeling. Powers Light, Mind, and Shadow.',
      color: 'text-purple-400'
    },
    { 
      key: 'resonance', 
      label: 'Resonance', 
      magic: 'Biomorphic Flux', 
      desc: 'Connection to the spirit world. Powers Nature, Poison, and Healing.',
      color: 'text-emerald-400'
    },
  ];

  const handleLevelUp = (stat: keyof PlayerStats) => {
    if (player.skillPoints > 0) {
      dispatch(spendSkillPoint(stat));
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em]">The Resonance Pillars</h3>
        <div className="bg-amber-900/20 px-3 py-1 rounded border border-amber-900/50">
          <span className="text-[10px] uppercase font-bold text-amber-500">Skill Points: {player.skillPoints}</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {attributes.map((attr) => (
          <div key={attr.key} className="p-4 bg-slate-900/50 rounded border border-slate-700 group hover:border-slate-500 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className={`text-xl font-black uppercase tracking-tighter ${attr.color}`}>{attr.label}</span>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Focus: {attr.magic}</div>
              </div>
              <span className="text-3xl font-black text-slate-100">{player.stats[attr.key as keyof PlayerStats]}</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase mt-2 mb-4 leading-relaxed tracking-wider">{attr.desc}</p>
            
            <button 
              onClick={() => handleLevelUp(attr.key as keyof PlayerStats)}
              disabled={player.skillPoints <= 0}
              className={`w-full py-2 text-[10px] uppercase font-bold border rounded transition-all ${
                player.skillPoints > 0 
                ? 'bg-slate-800 hover:bg-amber-600 hover:text-slate-900 text-slate-400 border-slate-700' 
                : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'
              }`}
            >
              {player.skillPoints > 0 ? `Strengthen Pillar (-1 Point)` : 'Insufficient Points'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillTree;
