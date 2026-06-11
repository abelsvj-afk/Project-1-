import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './store';
import { setLocation, changeAlignment, changePurity, addItem } from './store/slices/playerSlice';
import { filterStorylets, morphText } from './engine/narrativeEngine';
import storyletsData from './data/storylets.json';
import type { Storylet, Choice } from './types/game';
import CharacterCreator from './components/CharacterCreator';
import Inventory from './components/Inventory';
import SkillTree from './components/SkillTree';
import BlueprintLibrary from './components/BlueprintLibrary';
import CombatConsole from './components/CombatConsole';
import { useWorldEngine } from './hooks/useWorldEngine';
import CivicDashboard from './components/CivicDashboard';
import KinshipRoster from './components/KinshipRoster';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);
  const state = useSelector((state: RootState) => state);

  const [activeStorylet, setActiveStorylet] = useState<Storylet | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'skills' | 'blueprints' | 'civic' | 'social'>('inventory');
  const [view, setView] = useState<'narrative' | 'combat'>('narrative');

  useWorldEngine(isInitialized);

  useEffect(() => {
    if (!isInitialized) return;
    const filtered = filterStorylets(storyletsData as Storylet[], state);
    if (filtered.length > 0 && !activeStorylet) {
      setActiveStorylet(filtered[0]);
    }
  }, [player.location, player.alignment, player.purity, state, activeStorylet, isInitialized]);

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

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-mono flex items-center justify-center">
        <CharacterCreator onComplete={() => setIsInitialized(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-mono flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 border-b border-slate-700 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-amber-500 uppercase">Eldoria</h1>
          <p className="text-slate-400 text-sm">A Systemic Text-Based RPG</p>
          <div className="text-amber-200 mt-2 text-xs font-bold">{player.name} | {player.appearance.bodyType} | {player.appearance.hairStyle}</div>
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
        {/* Left Column: Primary Interface */}
        <section className="flex-1 bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-2xl min-h-[600px] flex flex-col">
          <div className="flex gap-4 mb-6 border-b border-slate-700 pb-2">
            <button 
              onClick={() => setView('narrative')}
              className={`text-xs uppercase font-bold tracking-widest pb-2 border-b-2 transition-all ${view === 'narrative' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
            >
              Narrative
            </button>
            <button 
              onClick={() => setView('combat')}
              className={`text-xs uppercase font-bold tracking-widest pb-2 border-b-2 transition-all ${view === 'combat' ? 'border-red-500 text-red-500' : 'border-transparent text-slate-500'}`}
            >
              Combat
            </button>
          </div>

          {view === 'narrative' ? (
            activeStorylet ? (
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
            )
          ) : (
            <CombatConsole />
          )}
        </section>

        {/* Right Column: Stats & Inventory */}
        <aside className="w-80 space-y-6">
          <div className="flex bg-slate-800 p-1 rounded-t-lg border-t border-x border-slate-700 overflow-x-auto">
            {(['inventory', 'skills', 'blueprints', 'civic', 'social'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[60px] py-2 text-[8px] uppercase font-bold tracking-widest rounded transition-all ${
                  activeTab === tab ? 'bg-slate-700 text-amber-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="-mt-6">
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'skills' && <SkillTree />}
            {activeTab === 'blueprints' && <BlueprintLibrary />}
            {activeTab === 'civic' && <CivicDashboard />}
            {activeTab === 'social' && <KinshipRoster />}
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="text-xs uppercase font-bold text-slate-500 mb-1 tracking-widest">Location</h3>
              <div className="text-sm text-amber-600 font-bold uppercase tracking-tight">
                {player.location.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xs uppercase font-bold text-slate-500 mb-1 tracking-widest">Time</h3>
              <div className="text-sm text-blue-400 font-mono font-bold">
                {Math.floor(game.gameTime / 100)}:{(game.gameTime % 100).toString().padStart(2, '0')}
              </div>
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
