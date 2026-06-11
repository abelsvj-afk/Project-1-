import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { useCombat } from '../hooks/useCombat';
import { applyCure, setBalance, setEquilibrium } from '../store/slices/playerSlice';
import combatData from '../data/combatData.json';
import { CombatSpell } from '../types/game';

const CombatConsole: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);
  const game = useSelector((state: RootState) => state.game);
  
  const [log, setLog] = useState<{ msg: string; type: 'info' | 'warn' | 'error' | 'success' }[]>([]);
  const [inCombat, setInCombat] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useCombat(inCombat);

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLog(prev => [...prev, { msg, type }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const handleCast = (spellId: string) => {
    const spell = combatData.spells.find(s => s.id === spellId) as CombatSpell | undefined;
    if (!spell) return;

    if (player.balance > 0 && spell.cost.balance) {
      addLog("You are off-balance!", "error");
      return;
    }
    if (player.equilibrium > 0 && spell.cost.equilibrium) {
      addLog("Your mind is not composed!", "error");
      return;
    }

    addLog(`You cast ${spell.name}.`, "success");
    if (spell.cost.balance) dispatch(setBalance(spell.cost.balance));
    if (spell.cost.equilibrium) dispatch(setEquilibrium(spell.cost.equilibrium));
    
    // Simulate enemy reaction
    setTimeout(() => {
      addLog("The enemy strikes back!", "warn");
    }, 1500);
  };

  const handleCure = (cureId: string) => {
    const cure = combatData.cures.find(c => c.id === cureId);
    if (cure) {
      dispatch(applyCure(cure.cures));
      addLog(`You apply ${cure.name}.`, "success");
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tactical Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/80 p-3 rounded border border-slate-700">
          <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
            <span className="text-slate-500">Balance</span>
            <span className={player.balance > 0 ? 'text-red-400' : 'text-emerald-400'}>
              {player.balance > 0 ? `${(player.balance/1000).toFixed(1)}s` : 'READY'}
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100" 
              style={{ width: `${Math.max(0, 100 - (player.balance / 3000) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded border border-slate-700">
          <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
            <span className="text-slate-500">Equilibrium</span>
            <span className={player.equilibrium > 0 ? 'text-purple-400' : 'text-emerald-400'}>
              {player.equilibrium > 0 ? `${(player.equilibrium/1000).toFixed(1)}s` : 'READY'}
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-100" 
              style={{ width: `${Math.max(0, 100 - (player.equilibrium / 3000) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Afflictions */}
      <div className="flex gap-2 flex-wrap">
        {player.afflictions.length > 0 ? (
          player.afflictions.map(a => (
            <span key={a} className="bg-red-900/40 text-red-400 text-[10px] font-bold px-2 py-1 rounded border border-red-700 uppercase">
              {a.replace(/_/g, ' ')}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-slate-600 italic">No active afflictions</span>
        )}
      </div>

      {/* Combat Log */}
      <div className="flex-1 bg-slate-900 p-4 rounded border border-slate-800 font-mono text-sm overflow-y-auto min-h-[200px] flex flex-col gap-1">
        {log.map((entry, i) => (
          <div key={i} className={
            entry.type === 'error' ? 'text-red-500' : 
            entry.type === 'warn' ? 'text-amber-500' : 
            entry.type === 'success' ? 'text-emerald-500' : 'text-slate-400'
          }>
            <span className="text-slate-700 mr-2">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            {entry.msg}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Spells</h4>
          <div className="grid grid-cols-1 gap-1">
            {combatData.spells.map(s => (
              <button
                key={s.id}
                disabled={!inCombat}
                onClick={() => handleCast(s.id)}
                className="text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded border border-slate-700 disabled:opacity-50"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Cures</h4>
          <div className="grid grid-cols-1 gap-1">
            {combatData.cures.map(c => (
              <button
                key={c.id}
                disabled={!inCombat}
                onClick={() => handleCure(c.id)}
                className="text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded border border-slate-700 disabled:opacity-50"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setInCombat(!inCombat)}
        className={`w-full py-2 rounded font-bold uppercase tracking-widest ${inCombat ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
      >
        {inCombat ? 'Disengage' : 'Enter Combat Stance'}
      </button>
    </div>
  );
};

export default CombatConsole;
