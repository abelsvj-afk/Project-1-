import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { equipItem } from '../store/slices/playerSlice';
import type { Equipment } from '../types/game';

const Inventory: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);

  const handleItemAction = (item: string | Equipment) => {
      if (typeof item !== 'string') {
          dispatch(equipItem(item));
      }
      // TODO: Handle consumables like salves
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <h3 className="text-xs uppercase font-bold text-slate-400 tracking-[0.2em]">The Scavenger's Bag</h3>
        <span className="text-[10px] font-black text-slate-500 uppercase">{player.inventory.length} / 20 Items</span>
      </div>
      
      <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
        {player.inventory.length > 0 ? (
          player.inventory.map((item, i) => {
            const isString = typeof item === 'string';
            const name = isString ? item.replace(/_/g, ' ') : item.name;
            const id = isString ? item : item.id;
            
            return (
              <div 
                key={`${id}-${i}`} 
                className="group flex flex-col p-3 bg-slate-900/50 rounded border border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer"
                onClick={() => handleItemAction(item)}
              >
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{name}</span>
                    {!isString && (
                        <div className="flex gap-2 items-center">
                            <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 uppercase font-black">{item.quality}</span>
                            <span className="text-[10px] text-amber-500 font-bold uppercase">EQUIP</span>
                        </div>
                    )}
                    {isString && <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Resource</span>}
                </div>
                {!isString && (
                    <div className="mt-2 text-[10px] text-slate-500 line-clamp-1 italic">
                        {item.description}
                    </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-slate-600 italic p-10 border border-dashed border-slate-700 rounded text-center">
            The bag is empty
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
        <h4 className="text-[9px] uppercase font-black text-slate-500 mb-2 tracking-widest text-center">Item Management</h4>
        <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            Click equipment to secure it to your person. Resources and fragments are used automatically by the engine when appropriate.
        </p>
      </div>
    </div>
  );
};

export default Inventory;
