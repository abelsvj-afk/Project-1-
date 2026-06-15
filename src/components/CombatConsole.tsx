import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { useCombat } from '../hooks/useCombat';
import { restoreResources } from '../store/slices/playerSlice';
import { clearCombat, addCombatLog, startCombat } from '../store/slices/gameSlice';
import { castSpell, useCure } from '../engine/combatEngine';
import combatData from '../data/combatData.json';
import type { CombatSpell, EnemyTemplate } from '../types/game';

const enemies = (combatData as any).enemies as EnemyTemplate[];

const CombatConsole: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);
  const game = useSelector((state: RootState) => state.game);
  const state = useSelector((state: RootState) => state);

  const [inCombat, setInCombat] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const combat = game.activeCombat;

  // Keep useCombat running as long as combat is active and not over
  useCombat(inCombat && !!combat && !combat.isOver);

  // Sync local inCombat state with store
  useEffect(() => {
    if (combat && !combat.isOver) setInCombat(true);
    if (!combat) setInCombat(false);
  }, [combat]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combat?.log]);

  const handleCast = (spellId: string) => {
    castSpell(spellId, state, dispatch);
  };

  const handleCure = (cureId: string) => {
    useCure(cureId, state, dispatch);
  };

  const handleEngageEnemy = (enemyId: string) => {
    const template = enemies.find(e => e.id === enemyId);
    if (template) {
      dispatch(startCombat(template));
      setInCombat(true);
    }
  };

  const handleFlee = () => {
    dispatch(addCombatLog({ msg: 'You disengage and flee the encounter!', type: 'system' }));
    setInCombat(false);
    // Small stamina penalty for fleeing
    dispatch({ type: 'player/useStamina', payload: 15 } as any);
    setTimeout(() => dispatch(clearCombat()), 1500);
  };

  const handleClearVictory = () => {
    dispatch(clearCombat());
    setInCombat(false);
  };

  const handleRevive = () => {
    dispatch(restoreResources());
    dispatch(clearCombat());
    setInCombat(false);
    dispatch(addCombatLog({ msg: 'You drag yourself back from the edge of death. Vitality restored.', type: 'system' }));
  };

  const vitalityPct = (player.stats.vitality / 100) * 100;
  const mentalityPct = (player.stats.mentality / 100) * 100;
  const enemyVitalityPct = combat ? (combat.enemy.vitality / combat.enemy.maxVitality) * 100 : 0;

  return (
    <div className="flex flex-col h-full gap-3 text-xs">

      {/* ── Combat Outcome Banners ── */}
      {combat?.isOver && combat.playerWon && (
        <div className="bg-emerald-900/40 border border-emerald-600 rounded-lg p-4 text-center animate-in fade-in duration-500">
          <div className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-1">Victory</div>
          <div className="text-emerald-300 text-sm mb-3">
            {combat.enemy.name} defeated. +{combat.enemy.xpReward} XP
          </div>
          <button onClick={handleClearVictory} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black uppercase rounded transition-all">
            Continue
          </button>
        </div>
      )}

      {combat?.isOver && !combat.playerWon && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-center animate-in fade-in duration-500">
          <div className="text-xl font-black text-red-400 uppercase tracking-widest mb-1">Defeated</div>
          <div className="text-red-300 text-sm mb-3">You were overwhelmed. Rise again.</div>
          <button onClick={handleRevive} className="px-6 py-2 bg-red-700 hover:bg-red-600 text-slate-100 font-black uppercase rounded transition-all">
            Recover
          </button>
        </div>
      )}

      {/* ── VS Display ── */}
      {combat && !combat.isOver && (
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-700">
          {/* Player */}
          <div>
            <div className="text-[9px] uppercase font-black text-amber-500 mb-1 tracking-widest">{player.name}</div>
            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-red-400">Vitality</span>
                  <span className="font-mono">{player.stats.vitality}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.max(0, vitalityPct)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-purple-400">Mentality</span>
                  <span className="font-mono">{player.stats.mentality}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${Math.max(0, mentalityPct)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Enemy */}
          <div>
            <div className="text-[9px] uppercase font-black text-red-400 mb-1 tracking-widest">{combat.enemy.name}</div>
            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-red-400">Vitality</span>
                  <span className="font-mono">{combat.enemy.vitality} / {combat.enemy.maxVitality}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${Math.max(0, enemyVitalityPct)}%` }} />
                </div>
              </div>
              {/* Enemy afflictions */}
              {combat.enemy.afflictions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {combat.enemy.afflictions.map(a => (
                    <span key={a} className="bg-purple-900/40 text-purple-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-purple-800/50 uppercase">
                      {a.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Cooldown Bars ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
          <div className="flex justify-between text-[9px] uppercase font-bold mb-1">
            <span className="text-slate-500">Balance</span>
            <span className={player.balance > 0 ? 'text-red-400' : 'text-emerald-400'}>
              {player.balance > 0 ? `${(player.balance / 1000).toFixed(1)}s` : 'READY'}
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${Math.max(0, 100 - (player.balance / 3000) * 100)}%` }} />
          </div>
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
          <div className="flex justify-between text-[9px] uppercase font-bold mb-1">
            <span className="text-slate-500">Equilibrium</span>
            <span className={player.equilibrium > 0 ? 'text-purple-400' : 'text-emerald-400'}>
              {player.equilibrium > 0 ? `${(player.equilibrium / 1000).toFixed(1)}s` : 'READY'}
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 transition-all duration-100"
              style={{ width: `${Math.max(0, 100 - (player.equilibrium / 3000) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ── Player Afflictions ── */}
      {player.afflictions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {player.afflictions.map(a => (
            <span key={a} className="bg-red-900/40 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded border border-red-700 uppercase">
              {a.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* ── Combat Log ── */}
      <div className="flex-1 bg-slate-900 p-3 rounded border border-slate-800 font-mono overflow-y-auto min-h-[120px] max-h-[200px] flex flex-col gap-0.5">
        {combat ? (
          combat.log.map((entry, i) => (
            <div key={i} className={
              entry.type === 'enemy' ? 'text-red-400' :
              entry.type === 'player' ? 'text-emerald-400' :
              'text-slate-500'
            }>
              <span className="text-slate-700 mr-1.5 text-[9px]">[R{combat.round}]</span>
              {entry.msg}
            </div>
          ))
        ) : (
          <div className="text-slate-600 italic text-center py-4">No active engagement</div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* ── Actions ── */}
      {(!combat || !combat.isOver) && (
        <div className="grid grid-cols-2 gap-3">
          {/* Spells */}
          <div className="space-y-1.5">
            <h4 className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Spells</h4>
            <div className="space-y-1">
              {combatData.spells.map(s => {
                const spell = s as CombatSpell;
                const equilibriumReady = !spell.cost.equilibrium || player.equilibrium === 0;
                const balanceReady = !spell.cost.balance || player.balance === 0;
                const mentalityOk = player.stats.mentality >= (spell.cost.mentality || 0);
                const canCast = inCombat && equilibriumReady && balanceReady && mentalityOk;
                return (
                  <button
                    key={s.id}
                    disabled={!canCast}
                    onClick={() => handleCast(s.id)}
                    title={s.description}
                    className={`w-full text-left px-2.5 py-1.5 rounded border text-[10px] transition-all
                      ${canCast
                        ? 'bg-slate-800 hover:bg-blue-900/40 border-slate-700 hover:border-blue-600 text-slate-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                  >
                    <span className="font-bold">{s.name}</span>
                    <span className="text-[9px] text-slate-500 block">
                      {spell.cost.mentality ? `-${spell.cost.mentality} MEN` : ''}
                      {spell.cost.equilibrium ? ` · ${(spell.cost.equilibrium / 1000).toFixed(1)}s EQ` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cures */}
          <div className="space-y-1.5">
            <h4 className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Cures</h4>
            <div className="space-y-1">
              {combatData.cures.map(c => {
                const count = player.inventory.filter(i => (typeof i === 'string' ? i : i.id) === c.id).length;
                if (count === 0) return null;
                const physReady = player.balance === 0;
                const mentalReady = player.equilibrium === 0;
                const deliveryReady = (c.delivery === 'topical' || c.delivery === 'smoke') ? physReady : mentalReady;
                const canUse = inCombat && deliveryReady;
                return (
                  <button
                    key={c.id}
                    disabled={!canUse}
                    onClick={() => handleCure(c.id)}
                    className={`w-full flex justify-between items-center px-2.5 py-1.5 rounded border text-[10px] transition-all
                      ${canUse
                        ? 'bg-slate-800 hover:bg-emerald-900/30 border-slate-700 hover:border-emerald-700 text-slate-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-slate-500 font-mono">x{count}</span>
                  </button>
                );
              })}
              {combatData.cures.every(c => !player.inventory.some(i => (typeof i === 'string' ? i : i.id) === c.id)) && (
                <div className="text-[10px] text-slate-600 italic px-2 py-1">No cures in bag.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Engage / Flee Controls ── */}
      {!combat && (
        <div className="space-y-2">
          <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Engage Enemy</div>
          <div className="grid grid-cols-2 gap-2">
            {enemies.map(enemy => (
              <button
                key={enemy.id}
                onClick={() => handleEngageEnemy(enemy.id)}
                className="text-left p-2.5 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-700 rounded transition-all"
              >
                <div className="font-bold text-[10px] text-slate-200 uppercase">{enemy.name}</div>
                <div className="text-[9px] text-slate-500">Lv.{enemy.level} · {enemy.maxVitality} HP</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {combat && !combat.isOver && (
        <button
          onClick={handleFlee}
          className="w-full py-2 rounded font-bold uppercase tracking-widest text-[10px] bg-slate-800 hover:bg-amber-900/30 border border-slate-700 hover:border-amber-600 text-slate-400 hover:text-amber-400 transition-all"
        >
          Disengage & Flee (−15 Stamina)
        </button>
      )}
    </div>
  );
};

export default CombatConsole;
