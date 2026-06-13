import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as Sentry from "@sentry/react";
import type { RootState } from './store';
import { setLocation, changeAlignment, changePurity, addItem, changeWealth, gainExperience, setBlessedAbility, revealBlessedSkill } from './store/slices/playerSlice';
import { filterStorylets, morphText, assembleProse, dealFromDeck } from './engine/narrativeEngine';
import { processHistoryConsolidation } from './engine/historyEngine';
import { setGlobalFlag, markStoryletSeen, revealName, revealKnowledge, setLastChoiceId, addNarrativeHistory } from './store/slices/gameSlice';
import storyletsData from './data/storylets.json';
import type { Storylet, Choice } from './types/game';
import CharacterCreator from './components/CharacterCreator';
import Inventory from './components/Inventory';
import SkillTree from './components/SkillTree';
import BlueprintLibrary from './components/BlueprintLibrary';
import CombatConsole from './components/CombatConsole';
import LoadingScreen from './components/LoadingScreen';
import { useWorldEngine } from './hooks/useWorldEngine';
import CivicDashboard from './components/CivicDashboard';
import KinshipRoster from './components/KinshipRoster';
import { tts } from './engine/ttsEngine';
import { triggerLootDrop } from './engine/lootEngine';
import { simulateWorldTurn } from './engine/worldSimulationEngine';
import { populateLocation } from './engine/populationEngine';

// eslint-disable-next-line react-refresh/only-export-components
const App: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);
  const game = useSelector((state: RootState) => state.game);
  const state = useSelector((state: RootState) => state);

  const [activeStorylet, setActiveStorylet] = useState<Storylet | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'skills' | 'blueprints' | 'civic' | 'social'>('inventory');
  const [view, setView] = useState<'narrative' | 'combat'>('narrative');
  const [isNarrating, setIsNarrating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTTSFinished, setIsTTSFinished] = useState(true);

  useWorldEngine(isInitialized);

  // Populate generic NPCs when entering a new location
  useEffect(() => {
    if (isInitialized) {
      populateLocation(player.location, game.npcs, dispatch);
    }
  }, [player.location, isInitialized, dispatch]); // We omit game.npcs to prevent infinite loops, only triggering on location change

  // Auto-scroll to bottom of narrative
  useEffect(() => {
    const scrollAnchor = document.getElementById('scroll-anchor');
    if (scrollAnchor) {
      scrollAnchor.scrollIntoView({ behavior: 'smooth' });
    }
  }, [game.narrativeHistory]);

  const handleChoice = React.useCallback((choice: Choice) => {
    const { effects } = choice;
    tts.stop();
    setIsNarrating(false);
    setTimeLeft(null); 
    setIsTTSFinished(true);

    // Add choice to history in store
    dispatch(addNarrativeHistory({ id: choice.id, type: 'choice', text: choice.text }));
    dispatch(setLastChoiceId(choice.id));

    if (effects.alignmentChange) dispatch(changeAlignment(effects.alignmentChange));
    if (effects.purityChange) dispatch(changePurity(effects.purityChange));
    if (effects.wealthChange) dispatch(changeWealth(effects.wealthChange));
    if (effects.experienceGain) dispatch(gainExperience(effects.experienceGain));
    if (effects.setBlessedAbility) dispatch(setBlessedAbility(effects.setBlessedAbility));
    if (effects.moveToLocation) dispatch(setLocation(effects.moveToLocation));
    if (effects.addItem) {
      effects.addItem.forEach(item => dispatch(addItem(item)));
    }
    if (effects.setGlobalFlags) {
      Object.entries(effects.setGlobalFlags).forEach(([flag, value]) => {
        dispatch(setGlobalFlag({ flag, value }));
      });
    }
    if (effects.revealNames) {
        effects.revealNames.forEach(name => dispatch(revealName(name)));
    }
    if (effects.revealKnowledge) {
        effects.revealKnowledge.forEach(k => dispatch(revealKnowledge(k)));
    }
    if ((effects as any).revealBlessedSkill) {
        dispatch(revealBlessedSkill());
    }
    if ((effects as any).triggerLoot) {
        triggerLootDrop((effects as any).triggerLoot, dispatch);
    }

    // Trigger autonomous world movement
    simulateWorldTurn(state, dispatch);

    // After choice, refresh storylets
    setActiveStorylet(null);
  }, [dispatch]);

  // Timer Logic for Time-Sensitive Storylets (Starts AFTER TTS)
  useEffect(() => {
    if (activeStorylet?.timeLimit && timeLeft === null && isTTSFinished) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(activeStorylet.timeLimit);
    }

    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      const defaultChoice = activeStorylet?.choices.find(c => c.id === activeStorylet.defaultChoiceId) || activeStorylet?.choices[0];
      if (defaultChoice) handleChoice(defaultChoice);
      setTimeLeft(null);
    }
  }, [timeLeft, activeStorylet, handleChoice, isTTSFinished]);

  // Storylet Filtering & Auto-TTS
  useEffect(() => {
    if (!isInitialized) return;

    const nextStorylet = dealFromDeck(storyletsData as Storylet[], state);
    
    if (nextStorylet) {
      // If we have a new storylet, or if it's a repeatable one and we've just made a choice,
      // we refresh the active storylet to update the 'Scene' assembly.
      const isNewId = !activeStorylet || activeStorylet.id !== nextStorylet.id;
      const isRepeatableRefresh = nextStorylet.repeatable && game.lastChoiceId !== state.game.lastChoiceId;

      if (isNewId || isRepeatableRefresh) {
        setActiveStorylet(nextStorylet);
        dispatch(markStoryletSeen(nextStorylet.id));
        setTimeLeft(null);
        setIsTTSFinished(false); // TTS starts now
        
        // Add to history in store (Assembled Prose)
        const baseContent = morphText(nextStorylet.content, state);
        const assembledContent = assembleProse(state, baseContent);
        
        dispatch(addNarrativeHistory({ 
            id: nextStorylet.id, 
            type: 'storylet', 
            text: assembledContent, 
            title: nextStorylet.title 
        }));

        // Trigger Auto-TTS
        tts.stop();
        setIsNarrating(true);
        tts.speak(assembledContent, {
            onend: () => {
                setIsTTSFinished(true);
                setIsNarrating(false);
            }
        });
      }
    }
  }, [player.location, player.alignment, player.purity, game.seenStorylets, game.lastChoiceId, state, activeStorylet, isInitialized, dispatch]);

  // History Consolidation
  useEffect(() => {
    processHistoryConsolidation(state, dispatch);
  }, [game.narrativeHistory, state, dispatch]);

  const toggleNarration = (text: string) => {
    if (isNarrating) {
      tts.stop();
      setIsNarrating(false);
      setIsTTSFinished(true); // Manually stopping counts as finished for the timer
    } else {
      setIsNarrating(true);
      setIsTTSFinished(false);
      
      const assembledText = assembleProse(state, text);
      
      tts.speak(assembledText, {
          onend: () => {
              setIsTTSFinished(true);
              setIsNarrating(false);
          }
      });
    }
  };

  // Theme Morphing Effect
  useEffect(() => {
    let theme = 'default';
    if (player.alignment > 500) theme = 'adept';
    else if (player.alignment < -500) theme = 'debaser';
    else if (player.purity < -500) theme = 'corrupted';
    
    document.body.setAttribute('data-theme', theme);
  }, [player.alignment, player.purity]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen p-8 font-mono flex items-center justify-center">
        <CharacterCreator onComplete={() => {
            setIsLoading(true);
            setIsInitialized(true);
        }} />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="h-screen w-full overflow-hidden p-2 md:p-6 font-mono flex flex-col items-center transition-all-custom text-slate-300 bg-[#0a0a0c]">
      <header className="shrink-0 w-full max-w-5xl mb-4 border-b pb-2 flex justify-between items-end" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase" style={{ color: 'var(--accent-color)' }}>Eldoria</h1>
          <p className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>A Systemic Text-Based RPG</p>
          <div className="mt-1 text-[10px] md:text-xs font-bold" style={{ color: 'var(--accent-color)', opacity: 0.8 }}>{player.name} | {player.appearance.bodyType} | {player.appearance.hairStyle}</div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Status</div>
          <div className="flex gap-4">
            <div className="px-3 py-1 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="mr-2" style={{ color: 'var(--text-muted)' }}>Alignment</span>
              <span className={`${player.alignment >= 0 ? 'text-blue-400' : 'text-red-400'} font-bold`}>
                {player.alignment}
              </span>
            </div>
            <div className="px-3 py-1 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="mr-2" style={{ color: 'var(--text-muted)' }}>Purity</span>
              <span className={`${player.purity >= 0 ? 'text-emerald-400' : 'text-purple-400'} font-bold`}>
                {player.purity}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl flex-1 flex flex-col md:flex-row gap-6 overflow-hidden mb-2">
        {/* Left Column: Primary Interface */}
        <section className="flex-1 flex flex-col bg-slate-800 rounded-lg border border-slate-700 shadow-2xl overflow-hidden relative">
          <div className="shrink-0 flex justify-between items-center p-3 md:p-4 border-b border-slate-700 bg-slate-800 z-10">
            <div className="flex gap-4">
              <button 
                onClick={() => setView('narrative')}
                className={`text-xs uppercase font-bold tracking-widest pb-1 border-b-2 transition-all ${view === 'narrative' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
              >
                Narrative
              </button>
              <button 
                onClick={() => setView('combat')}
                className={`text-xs uppercase font-bold tracking-widest pb-1 border-b-2 transition-all ${view === 'combat' ? 'border-red-500 text-red-500' : 'border-transparent text-slate-500'}`}
              >
                Combat
              </button>
            </div>
          </div>

          {/* Independent Scrolling Area for Narrative */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth" id="narrative-scroll">
            {view === 'narrative' ? (
                <>
                {/* PERSISTENT HUB SCENE HEADER */}
                {!activeStorylet && (
                    <div className="mb-8 p-4 rounded bg-slate-800/40 border border-slate-700/50 animate-in fade-in duration-1000">
                        <div className="text-[10px] text-amber-600 uppercase font-black tracking-[0.3em] mb-2">Current Scene</div>
                        <p className="text-xl leading-relaxed text-slate-200 first-letter:text-3xl first-letter:font-bold first-letter:text-amber-500">
                            {assembleProse(state, "")}
                        </p>
                    </div>
                )}

                {game.narrativeHistory.map((item, index) => (
                  <div key={`${item.id}-${index}`} className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${item.type === 'choice' ? 'border-l-2 border-amber-500/30 pl-4 py-2 italic text-slate-400' : ''}`}>
                    {item.title && <h2 className="text-xl font-bold mb-3 text-amber-200 uppercase tracking-tight">{item.title}</h2>}
                    <p className={`text-lg leading-relaxed ${item.type === 'storylet' ? 'first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-amber-500 text-slate-300' : 'text-slate-400'}`}>
                      {item.text}
                    </p>
                  </div>
                ))}
                {!activeStorylet && game.narrativeHistory.length === 0 && (
                   <div className="h-full flex items-center justify-center text-slate-500 italic">
                    The world is still...
                   </div>
                )}
                {/* Scroll Anchor */}
                <div id="scroll-anchor" />
              </>
            ) : (
              <CombatConsole />
            )}
          </div>
        </section>

        {/* Right Column: Stats & Inventory */}
        <aside className="w-full md:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          <div className="shrink-0 flex bg-slate-800 p-1 rounded-lg border border-slate-700 overflow-x-auto">
            {(['inventory', 'skills', 'blueprints', 'civic', 'social'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[50px] py-2 text-[8px] md:text-[9px] uppercase font-bold tracking-widest rounded transition-all ${
                  activeTab === tab ? 'bg-slate-700 text-amber-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-800 rounded-lg border border-slate-700 p-4">
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'skills' && <SkillTree />}
            {activeTab === 'blueprints' && <BlueprintLibrary />}
            {activeTab === 'civic' && <CivicDashboard />}
            {activeTab === 'social' && <KinshipRoster />}
          </div>

          <div className="shrink-0 bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
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

          <div className="shrink-0 bg-slate-800 p-4 rounded-lg border border-slate-700">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-widest">Level {player.level}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{player.experience} / {player.level * 100} XP</span>
             </div>
             <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${(player.experience / (player.level * 100)) * 100}%` }}
                />
             </div>
          </div>
        </aside>
      </main>

      {/* KEYBOARD-STYLE STICKY CHOICES BAR */}
      {view === 'narrative' && (
        <div className="w-full max-w-5xl shrink-0 bg-slate-900 border-t-2 border-x-2 border-amber-500/30 rounded-t-xl p-3 md:p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-50 mb-0 transition-transform">
           <div className="flex justify-between items-center mb-3">
             <div className="text-xs md:text-sm uppercase font-black text-amber-500 tracking-widest flex items-center">
               <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
               {activeStorylet ? 'Your Move' : 'Systemic Actions'}
             </div>
             {activeStorylet && (
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => toggleNarration(morphText(activeStorylet.content, state))}
                        className={`text-[10px] uppercase font-black px-4 py-1.5 rounded border transition-all ${isNarrating ? 'bg-amber-500 text-slate-900 border-amber-500 animate-pulse' : 'bg-slate-900 text-amber-500 border-slate-700 hover:border-amber-500'}`}
                    >
                        {isNarrating ? '[ STOP ]' : '[ NARRATE ]'}
                    </button>
                    {timeLeft !== null && activeStorylet.timeLimit && (
                        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded border border-red-900/50">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-tighter">{timeLeft}s</span>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                            <div 
                            className="bg-red-500 h-full transition-all duration-1000 linear" 
                            style={{ width: `${(timeLeft / activeStorylet.timeLimit) * 100}%` }}
                            />
                        </div>
                        </div>
                    )}
                </div>
             )}
           </div>
           
           <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
             {activeStorylet ? (
                 activeStorylet.choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoice(choice)}
                      className="w-full text-left p-4 rounded-lg bg-slate-800 hover:bg-amber-900/50 hover:border-amber-500 border border-slate-600 transition-all group flex items-center text-sm md:text-base shrink-0 shadow-sm"
                    >
                      <span className="text-amber-500 mr-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">»</span>
                      <span className="font-medium text-slate-200 group-hover:text-amber-50">{choice.text}</span>
                    </button>
                  ))
             ) : (
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => dispatch(setGlobalFlag({ flag: 'hub_action', value: 'scavenge' }))}
                        className="px-6 py-3 rounded border border-amber-500/50 bg-amber-500/10 text-amber-500 font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all text-xs"
                    >
                        [SCAVENGE]
                    </button>
                    <button 
                        onClick={() => dispatch(setGlobalFlag({ flag: 'hub_action', value: 'socialize' }))}
                        className="px-6 py-3 rounded border border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-900 transition-all text-xs"
                    >
                        [SOCIALIZE]
                    </button>
                    <button 
                        onClick={() => {/* TODO: Travel System */}}
                        className="px-6 py-3 rounded border border-blue-500/50 bg-blue-500/10 text-blue-500 font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-slate-900 transition-all text-xs"
                    >
                        [TRAVEL]
                    </button>
                </div>
             )}
           </div>
        </div>
      )}

      <footer className={`w-full max-w-5xl pt-2 border-t border-slate-700 text-[10px] text-slate-600 flex justify-between items-center uppercase tracking-[0.2em] mb-1 shrink-0 ${view === 'narrative' && activeStorylet ? 'hidden md:flex' : ''}`}>
        <div>Systemic Core v0.1.0</div>
        <div className="flex gap-4">
            <button 
            onClick={() => { throw new Error("Sentry Frontend Test Error"); }}
            className="hover:text-red-500 transition-colors"
            >
            [ Sentry Test ]
            </button>
            <div>Engineered via Vibe Coding</div>
        </div>
      </footer>
    </div>
  );
};

export default Sentry.withErrorBoundary(App, { fallback: <div>Something went wrong.</div> });
