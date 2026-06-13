import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { addItem, changeWealth } from '../store/slices/playerSlice';
import type { NPC } from '../types/game';

interface TradeMenuProps {
  merchant: NPC;
  onClose: () => void;
}

const TradeMenu: React.FC<TradeMenuProps> = ({ merchant, onClose }) => {
  const dispatch = useDispatch();
  const playerWealth = useSelector((state: RootState) => state.player.wealth);

  const handleBuy = (item: { id: string; price: number; stock: number }) => {
    if (playerWealth >= item.price) {
      dispatch(changeWealth(-item.price));
      dispatch(addItem(item.id));
      console.log(`Bought ${item.id} for ${item.price} Shards.`);
    } else {
      console.warn("Insufficient Shards!");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-amber-500 uppercase tracking-tighter">{merchant.name}</h2>
          <p className="text-xs text-slate-500 italic uppercase tracking-widest">{merchant.title}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-xl font-bold p-2"
        >
          ✕
        </button>
      </div>

      <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-center">
        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Your Balance</span>
        <span className="text-xl font-mono font-bold text-amber-400">{playerWealth} <span className="text-[10px] text-slate-600">SHARDS</span></span>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] uppercase font-black text-slate-600 tracking-widest border-b border-slate-800 pb-2">Available Wares</h3>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {(merchant as any).tradeInventory?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded border border-slate-700 hover:border-amber-500/30 transition-all group">
              <div>
                <div className="text-sm font-bold text-slate-200 group-hover:text-amber-200 transition-colors uppercase tracking-tight">{item.id.replace(/_/g, ' ')}</div>
                <div className="text-[10px] text-slate-500">Stock: {item.stock}</div>
              </div>
              <button 
                onClick={() => handleBuy(item)}
                disabled={playerWealth < item.price}
                className={`px-4 py-2 rounded text-[10px] font-black uppercase transition-all ${
                    playerWealth >= item.price 
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-900' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                {item.price} Shards
              </button>
            </div>
          ))}
          {(!(merchant as any).tradeInventory || (merchant as any).tradeInventory.length === 0) && (
              <div className="text-center py-8 text-slate-600 italic text-sm">"Nothing to sell today, traveler."</div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-600 leading-relaxed italic text-center px-4">
        "Resonance trading is subject to Syndicate audit. All sales are final."
      </div>
    </div>
  );
};

export default TradeMenu;
