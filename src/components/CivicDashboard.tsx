import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { buyProperty, hireEmployee, fireEmployee, promoteEmployee } from '../store/slices/gameSlice';
import { changeWealth } from '../store/slices/playerSlice';
import { EMPLOYEE_ROLES, HIRE_FEE, promotionCost, employeeDailyIncome } from '../engine/economicEngine';
import politicalData from '../data/politicalData.json';
import type { Property } from '../types/game';

const CivicDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);
  const player = useSelector((state: RootState) => state.player);
  const [roleChoice, setRoleChoice] = useState<{ [npcId: string]: string }>({});

  const handleBuy = (property: Property) => {
    if (player.wealth >= property.purchasePrice) {
      dispatch(changeWealth(-property.purchasePrice));
      dispatch(buyProperty(property.id));
    }
  };

  const employeeIds = new Set(game.employees?.map(e => e.npcId) ?? []);
  // Known NPCs present here who aren't already employed (companions can also work).
  const hireable = Object.values(game.npcs).filter(npc =>
    game.knownNames.includes(npc.id) &&
    npc.simulatedState.lastLocation === player.location &&
    !employeeIds.has(npc.id) &&
    !npc.simulatedState.isDead
  );

  const handleHire = (npcId: string) => {
    const role = roleChoice[npcId] || 'scavenger';
    if (player.wealth >= HIRE_FEE) {
      dispatch(changeWealth(-HIRE_FEE));
      dispatch(hireEmployee({ npcId, role }));
    }
  };

  const handlePromote = (npcId: string, tier: number) => {
    const cost = promotionCost(tier);
    if (player.wealth >= cost) {
      dispatch(changeWealth(-cost));
      dispatch(promoteEmployee(npcId));
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Reputation & Bounties */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
          <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Faction Reputation</h4>
          <div className="space-y-2">
            {Object.entries(game.reputation).map(([faction, value]) => (
              <div key={faction} className="flex justify-between items-center">
                <span className="text-xs uppercase text-slate-400">{faction.replace(/_/g, ' ')}</span>
                <span className={`text-xs font-bold ${value >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{value}</span>
              </div>
            ))}
            {Object.keys(game.reputation).length === 0 && <div className="text-xs text-slate-600 italic">No reputation data</div>}
          </div>
        </div>
        
        <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
          <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Active Bounties</h4>
          <div className="space-y-2">
            {game.activeBounties.length > 0 ? (
              game.activeBounties.map((b, i) => (
                <div key={i} className="bg-red-900/20 p-2 rounded border border-red-900/50 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold text-red-400 uppercase">{b.factionId}</div>
                    <div className="text-[8px] text-red-500 italic">{b.reason}</div>
                  </div>
                  <div className="text-xs font-bold text-amber-500">{b.amount} Shards</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-600 italic text-center py-2">Clear Record</div>
            )}
          </div>
        </div>
      </div>

      {/* Real Estate Market */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Borderlands Real Estate</h4>
        <div className="grid grid-cols-1 gap-3">
          {politicalData.properties.map((p) => {
            const isOwned = game.ownedProperties.includes(p.id);
            const canAfford = player.wealth >= p.purchasePrice;
            
            return (
              <div key={p.id} className={`p-4 rounded border ${isOwned ? 'bg-emerald-900/10 border-emerald-800' : 'bg-slate-900/50 border-slate-700'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-slate-200">{p.name}</div>
                    <div className="text-[10px] uppercase text-slate-500">{p.type} | {p.location.replace(/_/g, ' ')}</div>
                  </div>
                  {isOwned ? (
                    <span className="text-[10px] bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700 font-bold uppercase">Owned</span>
                  ) : (
                    <div className="text-right">
                      <div className="text-amber-500 font-bold">{p.purchasePrice} Shards</div>
                      <button 
                        disabled={!canAfford}
                        onClick={() => handleBuy(p as Property)}
                        className={`text-[10px] uppercase font-bold mt-1 px-3 py-1 rounded border transition-all ${canAfford ? 'border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-slate-900' : 'border-slate-800 text-slate-700'}`}
                      >
                        Purchase
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 text-[10px] uppercase tracking-tighter">
                  <div className="text-emerald-500">Income: <span className="font-bold">+{p.baseIncome}/tick</span></div>
                  <div className="text-red-500">Upkeep: <span className="font-bold">-{p.upkeep}/tick</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workforce — hire / fire / promote NPCs for passive income */}
      <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Workforce</h4>
          <span className="text-[9px] text-emerald-500 font-mono">
            +{(game.employees ?? []).reduce((s, e) => s + employeeDailyIncome(e.role, e.tier), 0)}/day
          </span>
        </div>

        {/* Current employees */}
        <div className="space-y-2 mb-3">
          {(game.employees ?? []).length > 0 ? (game.employees ?? []).map(emp => {
            const npc = game.npcs[emp.npcId];
            const role = EMPLOYEE_ROLES[emp.role];
            const promoCost = promotionCost(emp.tier);
            const maxed = emp.tier >= 3;
            return (
              <div key={emp.npcId} className="flex items-center justify-between bg-slate-800/60 p-2 rounded border border-slate-700">
                <div>
                  <div className="text-xs text-amber-200 font-bold">{npc?.name || emp.npcId}</div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    {role?.label || emp.role} · T{emp.tier} · <span className="text-emerald-500">+{employeeDailyIncome(emp.role, emp.tier)}/day</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    disabled={maxed || player.wealth < promoCost}
                    onClick={() => handlePromote(emp.npcId, emp.tier)}
                    className={`text-[9px] uppercase font-bold px-2 py-1 rounded border transition-all ${maxed ? 'border-slate-800 text-slate-700' : player.wealth >= promoCost ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-700 hover:text-slate-900' : 'border-slate-800 text-slate-700'}`}
                  >
                    {maxed ? 'Max' : `Promote ${promoCost}`}
                  </button>
                  <button
                    onClick={() => dispatch(fireEmployee(emp.npcId))}
                    className="text-[9px] uppercase font-bold px-2 py-1 rounded border border-red-900 text-red-400 hover:bg-red-900/40 transition-all"
                  >
                    Fire
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-[10px] text-slate-600 italic">No one on the payroll.</div>
          )}
        </div>

        {/* Hire panel */}
        {hireable.length > 0 && (
          <div className="border-t border-slate-800 pt-2 space-y-2">
            <div className="text-[9px] uppercase text-slate-500 tracking-wider">Hire nearby ({HIRE_FEE} shards)</div>
            {hireable.map(npc => (
              <div key={npc.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300 flex-1 truncate">{npc.name}</span>
                <select
                  value={roleChoice[npc.id] || 'scavenger'}
                  onChange={e => setRoleChoice(prev => ({ ...prev, [npc.id]: e.target.value }))}
                  className="text-[9px] bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-300"
                >
                  {Object.entries(EMPLOYEE_ROLES).map(([id, r]) => (
                    <option key={id} value={id}>{r.label}</option>
                  ))}
                </select>
                <button
                  disabled={player.wealth < HIRE_FEE}
                  onClick={() => handleHire(npc.id)}
                  className={`text-[9px] uppercase font-bold px-2 py-1 rounded border transition-all ${player.wealth >= HIRE_FEE ? 'border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-slate-900' : 'border-slate-800 text-slate-700'}`}
                >
                  Hire
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Town Laws */}
      <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Active Laws</h4>
        <div className="flex gap-2 flex-wrap">
          {game.activeLaws.length > 0 ? (
            game.activeLaws.map(lawId => {
              const law = politicalData.laws.find(l => l.id === lawId);
              return law ? (
                <span key={lawId} className="bg-blue-900/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-800/50 uppercase">
                  {law.name}
                </span>
              ) : null;
            })
          ) : (
            <span className="text-[10px] text-slate-600 italic">No civic restrictions</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CivicDashboard;
