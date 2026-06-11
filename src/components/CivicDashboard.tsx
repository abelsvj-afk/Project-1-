import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { buyProperty } from '../store/slices/gameSlice';
import { changeWealth } from '../store/slices/playerSlice';
import politicalData from '../data/politicalData.json';
import type { Property } from '../types/game';

const CivicDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);
  const player = useSelector((state: RootState) => state.player);

  const handleBuy = (property: Property) => {
    if (player.wealth >= property.purchasePrice) {
      dispatch(changeWealth(-property.purchasePrice));
      dispatch(buyProperty(property.id));
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
                        onClick={() => handleBuy(p as any)}
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
