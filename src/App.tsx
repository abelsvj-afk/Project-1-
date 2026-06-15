import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as Sentry from "@sentry/react";
import type { RootState } from './store';
import {
  setLocation, changeAlignment, changePurity, addItem, removeItem as removeItemAction,
  changeWealth, gainExperience, setBlessedAbility, revealBlessedSkill, updateStats,
  useStamina, useFocus, restoreResources, addCompanion, removeCompanion,
} from './store/slices/playerSlice';
import { morphText, assembleProse, dealFromDeck, narrativeBridge } from './engine/narrativeEngine';
import { processHistoryConsolidation } from './engine/historyEngine';
import {
  setGlobalFlag, markStoryletSeen, revealName, revealKnowledge, setLastChoiceId, reinforceContext, visitNode,
  openThread, resolveThread,
  addNarrativeHistory, setForcedStorylet, setActiveConversationNpc, incrementTime,
  startCombat,
} from './store/slices/gameSlice';
import storyletsData from './data/storylets.json';
import combatData from './data/combatData.json';
import type { Storylet, Choice, EnemyTemplate } from './types/game';
import CharacterCreator from './components/CharacterCreator';
import Inventory from './components/Inventory';
import SkillTree from './components/SkillTree';
import BlueprintLibrary from './components/BlueprintLibrary';
import CombatConsole from './components/CombatConsole';
import WorldMap from './components/WorldMap';
import LoadingScreen from './components/LoadingScreen';
import { useWorldEngine } from './hooks/useWorldEngine';
import CivicDashboard from './components/CivicDashboard';
import KinshipRoster from './components/KinshipRoster';
import { tts } from './engine/ttsEngine';
import { triggerLootDrop } from './engine/lootEngine';
import { simulateWorldTurn } from './engine/worldSimulationEngine';
import { populateLocation } from './engine/populationEngine';
import Status from './components/Status';

const enemies = (combatData as any).enemies as EnemyTemplate[];

const App: React.FC = () => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);
  const game = useSelector((state: RootState) => state.game);
  // Full state for engines — only used where engines require it
  const state = useSelector((state: RootState) => state);

  const [activeStorylet, setActiveStorylet] = useState<Storylet | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'skills' | 'blueprints' | 'civic' | 'social' | 'status' | 'map'>('status');
  const [view, setView] = useState<'narrative' | 'combat'>('narrative');
  const [isNarrating, setIsNarrating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTTSFinished, setIsTTSFinished] = useState(true);

  // TTS fallback: if onend never fires, unblock the game after 45s
  const ttsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTTSTimeout = () => {
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
  };

  const finishTTS = () => {
    clearTTSTimeout();
    setIsTTSFinished(true);
    setIsNarrating(false);
  };

  useWorldEngine(isInitialized);

  // Populate generic NPCs on location change
  useEffect(() => {
    if (isInitialized) {
      populateLocation(player.location, game.npcs, dispatch);
      dispatch(visitNode(player.location));
    }
  }, [player.location, isInitialized, dispatch]); // omit game.npcs — only trigger on location change

  // Auto-scroll narrative
  useEffect(() => {
    const el = document.getElementById('scroll-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [game.narrativeHistory]);

  const handleChoice = React.useCallback((choice: Choice) => {
    const { effects } = choice;
    tts.stop();
    clearTTSTimeout();
    setIsNarrating(false);
    setTimeLeft(null);
    setIsTTSFinished(true);

    dispatch(addNarrativeHistory({ id: choice.id, type: 'choice', text: choice.text }));
    dispatch(setLastChoiceId(choice.id));

    // Feed the player's expressed leaning into the hidden Context Profile.
    if (choice.tags?.length) dispatch(reinforceContext(choice.tags));

    // Forced continuity
    if (choice.followUpId) {
      dispatch(setForcedStorylet(choice.followUpId));
    } else {
      dispatch(setForcedStorylet(undefined));
      dispatch(setActiveConversationNpc(undefined));
    }

    // Apply all effects
    if (effects.alignmentChange) dispatch(changeAlignment(effects.alignmentChange));
    if (effects.purityChange) dispatch(changePurity(effects.purityChange));
    if (effects.wealthChange) dispatch(changeWealth(effects.wealthChange));
    if (effects.experienceGain) dispatch(gainExperience(effects.experienceGain));
    if (effects.setBlessedAbility) dispatch(setBlessedAbility(effects.setBlessedAbility));
    if (effects.revealBlessedSkill) dispatch(revealBlessedSkill());
    if (effects.moveToLocation) dispatch(setLocation(effects.moveToLocation));

    if (effects.addItem) {
      effects.addItem.forEach(item => dispatch(addItem(item)));
    }
    if (effects.removeItem) {
      effects.removeItem.forEach(item => dispatch(removeItemAction(item)));
    }
    if (effects.statChange) {
      dispatch(updateStats(effects.statChange));
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
    if (effects.triggerLoot) {
      triggerLootDrop(effects.triggerLoot, dispatch);
    }
    if (effects.recruitCompanion) dispatch(addCompanion(effects.recruitCompanion));
    if (effects.dismissCompanion) dispatch(removeCompanion(effects.dismissCompanion));
    if (effects.openThread) dispatch(openThread(effects.openThread));
    if (effects.resolveThread) dispatch(resolveThread(effects.resolveThread));

    // Trigger combat — switch to combat view automatically
    if (effects.triggerCombat) {
      const enemyTemplate = enemies.find(e => e.id === effects.triggerCombat);
      if (enemyTemplate) {
        dispatch(startCombat(enemyTemplate));
        setView('combat');
      }
    }

    // Tick world state
    simulateWorldTurn(state, dispatch);

    setActiveStorylet(null);
  }, [dispatch, state]);

  const handleHubAction = (action: 'scavenge' | 'socialize' | 'rest') => {
    if (action === 'rest') {
      dispatch(restoreResources());
      dispatch(incrementTime(800));
      dispatch(addNarrativeHistory({
        id: 'rest_action',
        type: 'storylet',
        text: "You find a relatively safe nook and collapse into a heavy, dreamless sleep. When you wake, your stamina is restored, but the world has moved on.",
        title: "Rest & Recovery"
      }));
      return;
    }

    if (action === 'scavenge' && player.stamina < 20) return;
    if (action === 'socialize' && player.focus < 10) return;

    if (action === 'socialize') {
      const presentNpcs = Object.values(game.npcs).filter(n => n.simulatedState.lastLocation === player.location);
      if (presentNpcs.length > 0) {
        const locked = presentNpcs[Math.floor(Math.random() * presentNpcs.length)];
        dispatch(setActiveConversationNpc(locked.id));
        dispatch(revealName(locked.id));
      }
    }

    if (action === 'scavenge') dispatch(useStamina(20));
    if (action === 'socialize') dispatch(useFocus(10));

    dispatch(setGlobalFlag({ flag: 'hub_action', value: action }));
  };

  // Timer for time-sensitive storylets (starts only after TTS finishes)
  useEffect(() => {
    if (activeStorylet?.timeLimit && timeLeft === null && isTTSFinished) {
      setTimeLeft(activeStorylet.timeLimit);
    }
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      const defaultChoice = activeStorylet?.choices.find(c => c.id === activeStorylet.defaultChoiceId) || activeStorylet?.choices[0];
      if (defaultChoice) handleChoice(defaultChoice);
      setTimeLeft(null);
    }
  }, [timeLeft, activeStorylet, handleChoice, isTTSFinished]);

  // Storylet filtering & auto-TTS
  useEffect(() => {
    if (!isInitialized || isNarrating || !isTTSFinished) return;

    const nextStorylet = dealFromDeck(storyletsData as Storylet[], state);

    // If forced ID was set but doesn't exist, clear it to prevent deadlock
    if (!nextStorylet && game.forcedStoryletId) {
      dispatch(setForcedStorylet(undefined));
      return;
    }

    if (nextStorylet) {
      const isNewId = !activeStorylet || activeStorylet.id !== nextStorylet.id;
      const isForced = game.forcedStoryletId === nextStorylet.id;

      if (isNewId || isForced) {
        setActiveStorylet(nextStorylet);
        dispatch(markStoryletSeen(nextStorylet.id));
        setTimeLeft(null);
        setIsTTSFinished(false);

        const baseContent = morphText(nextStorylet.content, state);
        const bridge = narrativeBridge(state, nextStorylet);
        const assembledContent = bridge + assembleProse(state, baseContent);

        dispatch(addNarrativeHistory({
          id: nextStorylet.id,
          type: 'storylet',
          text: assembledContent,
          title: nextStorylet.title
        }));

        tts.stop();
        setIsNarrating(true);

        // TTS with 45s fallback in case onend never fires
        clearTTSTimeout();
        tts.speak(assembledContent, {
          onend: finishTTS,
        });
        ttsTimeoutRef.current = setTimeout(finishTTS, 45000);
      }
    }
  }, [
    player.location, player.alignment, player.purity,
    game.seenStorylets, game.lastChoiceId, game.forcedStoryletId,
    state, activeStorylet, isInitialized, dispatch,
    isNarrating, isTTSFinished,
  ]);

  // History consolidation — only when narrativeHistory changes (not on every tick)
  useEffect(() => {
    processHistoryConsolidation(state, dispatch);
  }, [game.narrativeHistory.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize the hub scene description to avoid re-assembling on every render
  const hubSceneDescription = useMemo(() => {
    return assembleProse(state, '');
  }, [player.location, player.companions, game.npcs, game.gameTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleNarration = (text: string) => {
    if (isNarrating) {
      tts.stop();
      clearTTSTimeout();
      setIsNarrating(false);
      setIsTTSFinished(true);
    } else {
      const morphed = morphText(text, state);
      const assembledText = assembleProse(state, morphed);
      setIsNarrating(true);
      setIsTTSFinished(false);
      clearTTSTimeout();
      tts.speak(assembledText, { onend: finishTTS });
      ttsTimeoutRef.current = setTimeout(finishTTS, 45000);
    }
  };

  // Theme morphing
  useEffect(() => {
    let theme = 'default';
    if (player.alignment > 500) theme = 'adept';
    else if (player.alignment < -500) theme = 'debaser';
    else if (player.purity < -500) theme = 'corrupted';
    document.body.setAttribute('data-theme', theme);
  }, [player.alignment, player.purity]);

  // Switch to narrative view when combat ends
  useEffect(() => {
    if (game.activeCombat?.isOver && view === 'combat') {
      // Stay on combat view so the player can see the result — they manually return
    }
  }, [game.activeCombat?.isOver, view]);

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
          <div className="mt-1 text-[10px] md:text-xs font-bold" style={{ color: 'var(--accent-color)', opacity: 0.8 }}>
            {player.name} | {player.appearance.bodyType} | {player.appearance.hairStyle}
            {game.activeCombat && !game.activeCombat.isOver && (
              <span className="ml-2 text-red-400 animate-pulse">⚔ IN COMBAT</span>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Status</div>
          <div className="flex gap-4">
            <div className="px-3 py-1 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="mr-2" style={{ color: 'var(--text-muted)' }}>Alignment</span>
              <span className={`${player.alignment >= 0 ? 'text-blue-400' : 'text-red-400'} font-bold`}>{player.alignment}</span>
            </div>
            <div className="px-3 py-1 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <span className="mr-2" style={{ color: 'var(--text-muted)' }}>Purity</span>
              <span className={`${player.purity >= 0 ? 'text-emerald-400' : 'text-purple-400'} font-bold`}>{player.purity}</span>
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
                className={`text-xs uppercase font-bold tracking-widest pb-1 border-b-2 transition-all ${view === 'combat' ? 'border-red-500 text-red-500' : 'border-transparent text-slate-500'} ${game.activeCombat && !game.activeCombat.isOver ? 'text-red-400 animate-pulse' : ''}`}
              >
                Combat {game.activeCombat && !game.activeCombat.isOver ? '⚔' : ''}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth" id="narrative-scroll">
            {view === 'narrative' ? (
              <>
                {!activeStorylet && (
                  <div className="mb-8 p-4 rounded bg-slate-800/40 border border-slate-700/50 animate-in fade-in duration-1000">
                    <div className="text-[10px] text-amber-600 uppercase font-black tracking-[0.3em] mb-2">Current Scene</div>
                    <p className="text-xl leading-relaxed text-slate-200 first-letter:text-3xl first-letter:font-bold first-letter:text-amber-500">
                      {hubSceneDescription}
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
                <div id="scroll-anchor" />
              </>
            ) : (
              <CombatConsole onExit={() => setView('narrative')} />
            )}
          </div>
        </section>

        {/* Right Column */}
        <aside className="w-full md:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 gap-1 overflow-x-auto no-scrollbar">
            {['status', 'map', 'inventory', 'skills', 'blueprints', 'civic', 'social'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 min-w-[50px] py-2 text-[8px] md:text-[9px] uppercase font-bold tracking-widest rounded transition-all ${
                  activeTab === tab ? 'bg-slate-700 text-amber-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-800 rounded-lg border border-slate-700 p-4 custom-scrollbar">
            {activeTab === 'status' && <Status />}
            {activeTab === 'map' && <WorldMap />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'skills' && <SkillTree />}
            {activeTab === 'blueprints' && <BlueprintLibrary />}
            {activeTab === 'civic' && <CivicDashboard />}
            {activeTab === 'social' && <KinshipRoster />}
          </div>

          <div className="shrink-0 bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
            <div className="flex gap-4">
              <div>
                <h3 className="text-[8px] uppercase font-bold text-orange-500 mb-1 tracking-widest">Stamina</h3>
                <div className="text-sm text-slate-100 font-bold">{player.stamina}/{player.stats.stamina}</div>
              </div>
              <div>
                <h3 className="text-[8px] uppercase font-bold text-blue-400 mb-1 tracking-widest">Focus</h3>
                <div className="text-sm text-slate-100 font-bold">{player.focus}/{player.stats.focus}</div>
              </div>
              <div>
                <h3 className="text-[8px] uppercase font-bold text-red-400 mb-1 tracking-widest">Vitality</h3>
                <div className="text-sm text-slate-100 font-bold">{player.stats.vitality}</div>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-[8px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Time</h3>
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

      {/* Choices Bar */}
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
                  onClick={() => toggleNarration(activeStorylet.content)}
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
                  {choice.effects.triggerCombat && (
                    <span className="ml-auto text-[10px] text-red-400 font-bold uppercase tracking-widest">⚔ Combat</span>
                  )}
                </button>
              ))
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleHubAction('scavenge')}
                  disabled={player.stamina < 20}
                  className={`px-6 py-3 rounded border font-bold uppercase tracking-widest transition-all text-xs ${player.stamina >= 20 ? 'border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900' : 'border-slate-800 bg-slate-900 text-slate-700 cursor-not-allowed'}`}
                >
                  [SCAVENGE - 20 STAM]
                </button>
                <button
                  onClick={() => handleHubAction('socialize')}
                  disabled={player.focus < 10}
                  className={`px-6 py-3 rounded border font-bold uppercase tracking-widest transition-all text-xs ${player.focus >= 10 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-900' : 'border-slate-800 bg-slate-900 text-slate-700 cursor-not-allowed'}`}
                >
                  [SOCIALIZE - 10 FOCUS]
                </button>
                <button
                  onClick={() => handleHubAction('rest')}
                  className="px-6 py-3 rounded border border-blue-500/50 bg-blue-500/10 text-blue-500 font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-slate-900 transition-all text-xs"
                >
                  [REST & RECOVER]
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className={`w-full max-w-5xl pt-2 border-t border-slate-700 text-[10px] text-slate-600 flex justify-between items-center uppercase tracking-[0.2em] mb-1 shrink-0 ${view === 'narrative' && activeStorylet ? 'hidden md:flex' : ''}`}>
        <div>Systemic Core v0.2.0</div>
        <div className="flex gap-4">
          <button
            onClick={() => { throw new Error("Sentry Frontend Test Error"); }}
            className="hover:text-red-500 transition-colors"
          >
            [ Sentry Test ]
          </button>
          <div>Eldoria — {player.location.replace(/_/g, ' ')}</div>
        </div>
      </footer>
    </div>
  );
};

export default Sentry.withErrorBoundary(App, { fallback: <div>Something went wrong.</div> });
