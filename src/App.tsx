import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './store';
import { setLocation, changeAlignment, changePurity, addItem } from './store/slices/playerSlice';
import { filterStorylets, morphText } from './engine/narrativeEngine';
import storyletsData from './data/storylets.json';
import type { Storylet, Choice } from './types/game';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);
  const state = useSelector((state: RootState) => state);

  const [activeStorylet, setActiveStorylet] = useState<Storylet | null>(null);

  useEffect(() => {
    const filtered = filterStorylets(storyletsData as Storylet[], state);
    if (filtered.length > 0 && !activeStorylet) {
      setActiveStorylet(filtered[0]);
    }
  }, [player.location, player.alignment, player.purity, state, activeStorylet]);

  const handleChoice = (choice: Choice) => {
    const { effects } = choice;

    if (effects.alignmentChange) dispatch(changeAlignment(effects.alignmentChange));
    if (effects.purityChange) dispatch(changePurity(effects.purityChange));
    if (effects.moveToLocation) dispatch(setLocation(effects.moveToLocation));
    if (effects.addItem) {
      effects.addItem.forEach(item => dispatch(addItem(item)));
    }

    // After choice, refresh storylets
    setActiveStorylet(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-mono flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 border-b border-slate-700 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-amber-500 uppercase">Eldoria</h1>
          <p className="text-slate-400 text-sm">A Systemic Text-Based RPG</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-slate-500 mb-1">Status</div>
          <div className="flex gap-4">
            <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700">
              <span className="text-slate-500 mr-2">Alignment</span>
              <span className={`${player.alignment >= 0 ? 'text-blue-400' : 'text-red-400'} font-bold`}>
                {player.alignment}
              </span>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700">
              <span className="text-slate-500 mr-2">Purity</span>
              <span className={`${player.purity >= 0 ? 'text-emerald-400' : 'text-purple-400'} font-bold`}>
                {player.purity}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl flex gap-8">
        {/* Left Column: Narrative Console */}
        <section className="flex-1 bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-2xl min-h-[500px] flex flex-col">
          {activeStorylet ? (
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-4 text-amber-200">{activeStorylet.title}</h2>
              <p className="text-lg leading-relaxed mb-12 text-slate-300 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-amber-500">
                {morphText(activeStorylet.content, state)}
              </p>
              
              <div className="mt-auto space-y-3">
                {activeStorylet.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice)}
                    className="w-full text-left p-4 rounded bg-slate-700 hover:bg-amber-900/40 hover:border-amber-700 border border-slate-600 transition-all group flex items-center"
                  >
                    <span className="text-amber-500 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">»</span>
                    <span>{choice.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 italic">
              No active storylets...
            </div>
          )}
        </section>

        {/* Right Column: Stats & Inventory */}
        <aside className="w-64 space-y-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-xs uppercase font-bold text-slate-500 mb-4 tracking-widest">Inventory</h3>
            <ul className="space-y-2">
              {player.inventory.length > 0 ? (
                player.inventory.map((item, i) => (
                  <li key={i} className="text-sm bg-slate-700 px-2 py-1 rounded border border-slate-600 text-slate-300">
                    {item.replace(/_/g, ' ')}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-600 italic">Empty</li>
              )}
            </ul>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-xs uppercase font-bold text-slate-500 mb-4 tracking-widest">Location</h3>
            <div className="text-sm text-amber-600 font-bold uppercase tracking-tight">
              {player.location.replace(/_/g, ' ')}
            </div>
          </div>
        </aside>
      </main>

      <footer className="w-full max-w-4xl mt-8 pt-4 border-t border-slate-700 text-[10px] text-slate-600 flex justify-between items-center uppercase tracking-[0.2em]">
        <div>Systemic Core v0.1.0</div>
        <div>Engineered via Vibe Coding Paradigm</div>
      </footer>
    </div>
  );
};

export default App;
