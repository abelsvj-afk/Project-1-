import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  tips?: string[];
}

const DEFAULT_TIPS = [
  "Alignment is not just morality; it is your physical resonance with the world's underlying entropy.",
  "The Syndicate values static order. The Adepts value fluid chaos. You are the anomaly between them.",
  "Scavenging in the Low Wastes carries a high risk of 'Ghost-Static'—a memory infection from the spirit fragments.",
  "Trust {npc:kaelen} only as far as their knife reaches. In Eldoria, even shadows have agendas.",
  "Listen to the rhythmic pulsing in your bones. It is the world's heartbeat... or its death rattle."
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, tips = DEFAULT_TIPS }) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(tips[0]);
  const [phase, setPhase] = useState<'boot' | 'data' | 'ready'>('boot');

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 4000);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 1000);
          return 100;
        }
        
        // Dynamic loading speed simulation (Elden Ring style pauses)
        if (prev === 20) setPhase('data');
        if (prev === 85) setPhase('ready');
        
        const increment = Math.random() * (prev > 80 ? 2 : 15);
        return Math.min(100, prev + increment);
      });
    }, 300);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete, tips]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[100] flex flex-col items-center justify-center font-mono text-slate-400 p-12 overflow-hidden">
      {/* Background Ambience (Minimalist) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-2xl flex flex-col items-center">
        {/* Elden Ring Style Rune/Symbol (Minimalist CSS) */}
        <div className="mb-12 relative">
          <div className="w-16 h-16 border-2 border-amber-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 bg-amber-500 rounded-full blur-[8px] opacity-40 animate-pulse" />
             <div className="w-1 h-24 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent absolute" />
          </div>
        </div>

        <div className="w-full space-y-8">
           <div className="flex justify-between items-end mb-2">
             <div className="text-[10px] uppercase tracking-[0.4em] font-black text-amber-500/80">
               {phase === 'boot' && 'Initializing Core Systems...'}
               {phase === 'data' && 'Syncing World Narrative...'}
               {phase === 'ready' && 'Materializing Reality...'}
             </div>
             <div className="text-[12px] font-mono tabular-nums text-slate-500">
               {Math.floor(progress)}%
             </div>
           </div>

           <div className="w-full h-[1px] bg-slate-800 relative overflow-hidden">
             <div 
               className="absolute top-0 left-0 h-full bg-amber-500/80 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
               style={{ width: `${progress}%` }}
             />
           </div>

           <div className="pt-8 h-32 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-1000">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 mb-4">— Fragment —</span>
              <p className="text-sm leading-relaxed text-slate-300 italic max-w-md">
                "{currentTip}"
              </p>
           </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-[8px] uppercase tracking-[0.5em] text-slate-700">
        Eldoria Systemic Core v0.1.0 // Build 2026.06.12
      </div>
    </div>
  );
};

export default LoadingScreen;
