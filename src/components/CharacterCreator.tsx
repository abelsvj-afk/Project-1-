import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setIdentity } from '../store/slices/playerSlice';
import type { BodyMarking } from '../types/game';
import { calculatePresence, getPresenceDescription } from '../engine/presenceEngine';

interface CharacterCreatorProps {
  onComplete: () => void;
}

const MARKING_LOCATIONS = [
  { id: 'face', label: 'Face' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'left_arm', label: 'Left Arm' },
  { id: 'right_arm', label: 'Right Arm' },
  { id: 'left_leg', label: 'Left Leg' },
  { id: 'right_leg', label: 'Right Leg' },
] as const;

const SCAR_TYPES = ['jagged slash', 'chemical burn', 'surgical seam', 'mechanical port', 'shrapnel pockmarks', 'branding iron mark', 'frostbite scars', 'acid pitting', 'claw grooves'];
const TATTOO_TYPES = ['geometric patterns', 'syndicate crest', 'ancient runes', 'faded blueprints', 'bio-luminescent ink', 'tribal etchings', 'star charts', 'industrial barcodes', 'occult sigils'];

const PRONOUN_SETS = [
  { label: 'He / Him / His', subject: 'he', object: 'him', possessive: 'his' },
  { label: 'She / Her / Hers', subject: 'she', object: 'her', possessive: 'her' },
  { label: 'They / Them / Theirs', subject: 'they', object: 'them', possessive: 'their' },
  { label: 'Xe / Xem / Xir', subject: 'xe', object: 'xem', possessive: 'xir' },
  { label: 'Custom', subject: '', object: '', possessive: '' },
];

const EYE_COLORS = ['clear', 'steel blue', 'emerald', 'amber', 'crimson', 'void black', 'luminescent violet', 'gold-flecked', 'icy white', 'molten orange', 'toxic green', 'amethyst', 'heterochromia (blue/green)', 'heterochromia (red/black)'];
const EYE_TYPES = ['organic', 'cybernetic (lens)', 'cat-like', 'milky (blind)', 'glowing iris', 'hollow', 'reptilian', 'vertical slit', 'star-pupiled', 'clockwork', 'many-pupiled'];

// High-fidelity audio URLs
const UI_SOUNDS = {
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7335661d40.mp3', // Sharp high-tech click
  hover: 'https://cdn.pixabay.com/audio/2022/03/10/audio_f507b99c8a.mp3', // Subtle resonance
  type: 'https://cdn.pixabay.com/audio/2022/03/10/audio_5f2c253457.mp3', // Fast tech blips
  bgm: 'https://cdn.pixabay.com/audio/2023/02/24/audio_34b07f879b.mp3' // High quality cinematic ambient
};

const playSound = (type: keyof typeof UI_SOUNDS) => {
  const audio = new Audio(UI_SOUNDS[type]);
  audio.volume = type === 'bgm' ? 0.1 : 0.2;
  if (type === 'bgm') audio.loop = true;
  audio.play().catch(() => {});
  return audio;
};

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    let currentText = '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayedText('');
    const interval = setInterval(() => {
      currentText += text.charAt(i);
      setDisplayedText(currentText);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 8);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
};

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  
  const [name, setName] = useState('Stranger');
  const [pronounIndex, setPronounIndex] = useState(2);
  const [customSubject, setCustomSubject] = useState('');
  const [customObject, setCustomObject] = useState('');
  const [customPossessive, setCustomPossessive] = useState('');
  
  const [height, setHeight] = useState('average');
  const [bodyType, setBodyType] = useState('average');
  const [musculature, setMusculature] = useState('lean');
  const [skinTone, setSkinTone] = useState('pale');
  
  const [hairStyle, setHairStyle] = useState('unkempt');
  const [hairColor, setHairColor] = useState('dusty');
  const [eyeColor, setEyeColor] = useState('clear');
  const [eyeType, setEyeType] = useState('organic');
  
  const [scars, setScars] = useState<BodyMarking[]>([]);
  const [tattoos, setTattoos] = useState<BodyMarking[]>([]);

  const [pendingType, setPendingType] = useState(SCAR_TYPES[0]);
  const [pendingLoc, setPendingLoc] = useState<BodyMarking['location']>('face');

  const startAtmosphere = () => {
    if (!isAudioStarted) {
      bgmRef.current = playSound('bgm');
      setIsAudioStarted(true);
    }
  };

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  const getPronouns = () => {
    if (PRONOUN_SETS[pronounIndex].label === 'Custom') {
      return { subject: customSubject || 'they', object: customObject || 'them', possessive: customPossessive || 'their' };
    }
    return {
      subject: PRONOUN_SETS[pronounIndex].subject,
      object: PRONOUN_SETS[pronounIndex].object,
      possessive: PRONOUN_SETS[pronounIndex].possessive,
    };
  };

  const currentAppearance = {
    bodyType, musculature, height, hairStyle, hairColor, eyeColor, eyeType, skinTone,
    scars, tattoos, facialFeatures: [],
  };

  const presence = calculatePresence(currentAppearance);
  const presenceDesc = getPresenceDescription(presence);

  const addMarking = (isScar: boolean) => {
    startAtmosphere();
    playSound('click');
    const newMarking: BodyMarking = {
      id: Math.random().toString(36).substr(2, 9),
      type: pendingType,
      location: pendingLoc,
      description: `${pendingType} on ${pendingLoc.replace('_', ' ')}`
    };
    if (isScar) setScars([...scars, newMarking]);
    else setTattoos([...tattoos, newMarking]);
  };

  const removeMarking = (id: string, isScar: boolean) => {
    playSound('click');
    if (isScar) setScars(scars.filter(m => m.id !== id));
    else setTattoos(tattoos.filter(m => m.id !== id));
  };

  const handleFinish = () => {
    playSound('click');
    const { subject, object, possessive } = getPronouns();
    dispatch(setIdentity({
      name,
      appearance: currentAppearance,
      pronouns: { subject, object, possessive },
      presence,
      presenceDescription: presenceDesc
    }));
    onComplete();
  };

  const pronouns = getPronouns();
  const previewText = `You stand ${height}, a ${bodyType} and ${musculature} figure with ${skinTone} skin. Your ${hairStyle}, ${hairColor} hair frames a face marked by ${eyeColor} ${eyeType} eyes. ${scars.length > 0 ? `Your flesh bears the history of ${scars.map(s => s.description).join(', ')}. ` : ''}${tattoos.length > 0 ? `Ink depicting ${tattoos.map(t => t.description).join(', ')} is etched into your skin. ` : ''}${pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1)} look(s) forged by the Borderlands. ${presenceDesc}`;

  return (
    <div className="relative bg-slate-950 text-slate-100 p-6 md:p-10 rounded-xl border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-5xl w-full h-[95vh] flex flex-col font-sans animate-fade-in" onClick={startAtmosphere}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-slate-800 pb-8 shrink-0">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-black text-amber-500 uppercase tracking-tighter italic">Biometric Manifestation</h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">World Resonance: {presence.normalized}% Stable</p>
        </div>
        <div className="flex flex-col items-center md:items-end">
          <div className="flex gap-4 mb-2">
            <div className="text-right">
              <div className="text-[8px] uppercase text-slate-600 font-bold tracking-widest">Uncanny</div>
              <div className={`text-xs font-mono ${presence.uncanny > 50 ? 'text-red-500' : 'text-slate-400'}`}>{presence.uncanny}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] uppercase text-slate-600 font-bold tracking-widest">Awe</div>
              <div className="text-xs font-mono text-blue-400">{presence.exotic}</div>
            </div>
          </div>
          {!isAudioStarted && (
            <div className="text-[10px] text-amber-500/50 animate-pulse font-mono tracking-widest cursor-pointer hover:text-amber-500">[ START BIOMETRIC BGM ]</div>
          )}
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-10">
          <div className="space-y-10">
            <section>
              <h3 className="text-slate-400 text-xs uppercase font-black mb-6 tracking-widest flex items-center border-l-2 border-amber-500 pl-3">Designation</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="NAME"
                  value={name} 
                  onChange={(e) => { setName(e.target.value); playSound('type'); }}
                  className="w-full bg-slate-900 border border-slate-800 p-4 rounded text-slate-100 focus:border-amber-500 outline-none font-mono uppercase text-xl transition-colors hover:bg-slate-800"
                />
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase text-slate-500 font-bold tracking-widest">Pronoun Protocol</label>
                  <select 
                    value={pronounIndex} 
                    onChange={(e) => { setPronounIndex(parseInt(e.target.value)); playSound('click'); }}
                    className="w-full bg-slate-900 border border-slate-800 p-3 rounded text-slate-300 text-xs uppercase transition-all hover:border-amber-500"
                  >
                    {PRONOUN_SETS.map((set, i) => <option key={i} value={i}>{set.label}</option>)}
                  </select>
                  {PRONOUN_SETS[pronounIndex].label === 'Custom' && (
                    <div className="grid grid-cols-3 gap-2 mt-2 animate-fade-in">
                      <input placeholder="SUBJECT" value={customSubject} onChange={(e) => { setCustomSubject(e.target.value); playSound('type'); }} className="bg-slate-900 border border-slate-800 p-2 rounded text-slate-100 text-[10px] font-mono uppercase" />
                      <input placeholder="OBJECT" value={customObject} onChange={(e) => { setCustomObject(e.target.value); playSound('type'); }} className="bg-slate-900 border border-slate-800 p-2 rounded text-slate-100 text-[10px] font-mono uppercase" />
                      <input placeholder="POSSESSIVE" value={customPossessive} onChange={(e) => { setCustomPossessive(e.target.value); playSound('type'); }} className="bg-slate-900 border border-slate-800 p-2 rounded text-slate-100 text-[10px] font-mono uppercase" />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-slate-400 text-xs uppercase font-black mb-6 tracking-widest flex items-center border-l-2 border-amber-500 pl-3">Somatic Frame</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Height', val: height, set: setHeight, options: ['diminutive', 'short', 'average', 'tall', 'towering', 'monstrous'] },
                  { label: 'Build', val: bodyType, set: setBodyType, options: ['slight', 'average', 'athletic', 'burly', 'stocky', 'heavy'] },
                  { label: 'Musculature', val: musculature, set: setMusculature, options: ['soft', 'lean', 'wiry', 'defined', 'rippling (abs)', 'powerlifter', 'massive'] },
                  { label: 'Skin Tone', val: skinTone, set: setSkinTone, options: ['pale', 'olive', 'bronzed', 'deep', 'ashen', 'sallow', 'vitiligo'] },
                ].map(trait => (
                  <div key={trait.label}>
                    <label className="block text-[10px] uppercase text-slate-500 mb-2 font-bold tracking-widest">{trait.label}</label>
                    <select value={trait.val} onChange={(e) => { trait.set(e.target.value); playSound('click'); }} className="w-full bg-slate-900 border border-slate-800 p-3 rounded text-slate-300 text-xs uppercase transition-all hover:border-amber-500">
                      {trait.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-10">
            <section>
              <h3 className="text-slate-400 text-xs uppercase font-black mb-6 tracking-widest flex items-center border-l-2 border-amber-500 pl-3">Ocular & Cranial</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Eye Hue', val: eyeColor, set: setEyeColor, options: EYE_COLORS },
                  { label: 'Eye Type', val: eyeType, set: setEyeType, options: EYE_TYPES },
                  { label: 'Hair Style', val: hairStyle, set: setHairStyle, options: ['shaved', 'buzzcut', 'short', 'slicked back', 'long', 'braided', 'unkempt', 'wild mohawk', 'arcane pompadour'] },
                  { label: 'Hair Pigment', val: hairColor, set: setHairColor, options: ['dusty', 'raven', 'silver', 'copper', 'snow white', 'neon blue', 'toxic green', 'blood red'] },
                ].map(trait => (
                  <div key={trait.label}>
                    <label className="block text-[10px] uppercase text-slate-500 mb-2 font-bold tracking-widest">{trait.label}</label>
                    <select value={trait.val} onChange={(e) => { trait.set(e.target.value); playSound('click'); }} className="w-full bg-slate-900 border border-slate-800 p-3 rounded text-slate-300 text-xs uppercase transition-all hover:border-amber-500">
                      {trait.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-10">
            <section>
              <h3 className="text-slate-400 text-xs uppercase font-black mb-6 tracking-widest flex items-center border-l-2 border-amber-500 pl-3">Markings</h3>
              <div className="bg-slate-900 p-4 rounded border border-slate-800 space-y-4 mb-6">
                <div className="grid grid-cols-1 gap-2">
                  <select value={pendingType} onChange={(e) => setPendingType(e.target.value)} className="bg-slate-800 border border-slate-700 p-3 rounded text-xs uppercase text-slate-300">
                    <optgroup label="Scars">{SCAR_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
                    <optgroup label="Tattoos">{TATTOO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</optgroup>
                  </select>
                  <select value={pendingLoc} onChange={(e) => setPendingLoc(e.target.value as BodyMarking['location'])} className="bg-slate-800 border border-slate-700 p-3 rounded text-xs uppercase text-slate-300">
                    {MARKING_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
                <button onClick={() => addMarking(SCAR_TYPES.includes(pendingType))} className="w-full bg-slate-700 hover:bg-amber-600/20 hover:text-amber-500 p-3 rounded text-xs uppercase font-bold tracking-widest border border-slate-600 transition-all">Apply Marking</button>
              </div>
              <div className="space-y-2">
                {[...scars.map(s => ({...s, isScar: true})), ...tattoos.map(t => ({...t, isScar: false}))].map(m => (
                  <div key={m.id} className={`flex justify-between items-center p-3 rounded border animate-fade-in ${m.isScar ? 'bg-red-900/10 border-red-900/30' : 'bg-blue-900/10 border-blue-900/30'}`}>
                    <div>
                      <div className={`text-[10px] font-black uppercase ${m.isScar ? 'text-red-400' : 'text-blue-400'}`}>{m.type}</div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{m.location.replace('_', ' ')}</div>
                    </div>
                    <button onClick={() => removeMarking(m.id, m.isScar)} className="text-slate-600 hover:text-red-500 text-lg px-2">×</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Sticky Preview */}
      <div className="shrink-0 pt-6 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50">
        <div className="relative p-6 bg-black/40 rounded-lg border-l-4 border-amber-500 text-slate-400 text-xs leading-relaxed font-mono min-h-[80px]">
          <div className="absolute top-2 right-4 text-[8px] text-amber-500/20 font-black tracking-[1.5em] select-none uppercase">Analytical Preview Stream</div>
          <TypewriterText text={previewText} />
        </div>
        <button 
          onClick={handleFinish}
          className="group relative w-full mt-6 overflow-hidden rounded-lg bg-amber-600 p-5 font-black uppercase tracking-[0.6em] text-sm transition-all hover:bg-amber-500 shadow-[0_0_40px_rgba(217,119,6,0.2)] active:scale-[0.98]"
        >
          <span className="relative z-10 text-slate-950">Inject Consciousness</span>
          <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform group-hover:translate-y-0"></div>
        </button>
      </div>
    </div>
  );
};

export default CharacterCreator;
