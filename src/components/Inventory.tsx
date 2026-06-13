import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const Inventory: React.FC = () => {
  const player = useSelector((state: RootState) => state.player);

  const slots = [
    { label: 'Head', item: null },
    { label: 'Chest', item: 'Leather Duster' }, // Example starting item
    { label: 'Hands', item: null },
    { label: 'Weapon', item: 'Rusted Iron Knife' },
    { label: 'Relic', item: 'Damaged Resonance Torch' },
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
      <h3 className="text-xs uppercase font-bold text-slate-500 mb-6 tracking-[0.2em]">Equipment Slots</h3>
      
      <div className="grid grid-cols-1 gap-4 mb-8">
        {slots.map((slot) => (
          <div key={slot.label} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700">
            <span className="text-xs uppercase text-slate-500 font-bold">{slot.label}</span>
            <span className={slot.item ? 'text-amber-400 font-bold' : 'text-slate-600 italic text-sm'}>
              {slot.item || 'Empty'}
            </span>
          </div>
        ))}
      </div>

      <h3 className="text-xs uppercase font-bold text-slate-500 mb-4 tracking-[0.2em]">Bag</h3>
      <div className="grid grid-cols-1 gap-2">
        {player.inventory.length > 0 ? (
          player.inventory.map((item, i) => {
            const isString = typeof item === 'string';
            const name = isString ? item.replace(/_/g, ' ') : item.name;
            const id = isString ? item : item.id;
            
            return (
              <div key={`${id}-${i}`} className="text-sm bg-slate-700 px-3 py-2 rounded border border-slate-600 text-slate-300 flex justify-between items-center group">
                <span>{name}</span>
                {!isString && (
                  <span className="text-[10px] text-amber-500 font-bold uppercase">{item.quality}</span>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-slate-600 italic p-2 border border-dashed border-slate-700 rounded text-center">
            No loose items
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
