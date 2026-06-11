import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setIdentity } from '../store/slices/playerSlice';

interface CharacterCreatorProps {
  onComplete: () => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  
  const [name, setName] = useState('Stranger');
  const [subject, setSubject] = useState('they');
  const [object, setObject] = useState('them');
  const [possessive, setPossessive] = useState('their');
  
  const [bodyType, setBodyType] = useState('average');
  const [hairStyle, setHairStyle] = useState('unkempt');
  const [hairColor, setHairColor] = useState('dusty');
  const [eyeColor, setEyeColor] = useState('clear');

  const handleFinish = () => {
    dispatch(setIdentity({
      name,
      appearance: {
        bodyType,
        hairStyle,
        hairColor,
        eyeColor,
        facialFeatures: [],
      },
      pronouns: {
        subject,
        object,
        possessive,
      }
    }));
    onComplete();
  };

  const previewText = `You are ${name}, a ${bodyType} traveler with ${hairStyle}, ${hairColor} hair and ${eyeColor} eyes. ${subject.charAt(0).toUpperCase() + subject.slice(1)} look(s) ready for the trials of Eldoria.`;

  return (
    <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-2xl max-w-2xl w-full">
      <h2 className="text-3xl font-bold text-amber-500 mb-6 uppercase tracking-tighter">Initialize Identity</h2>
      
      <div className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-xs uppercase text-slate-500 mb-2 tracking-widest">Designation</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-slate-100 focus:border-amber-500 outline-none"
          />
        </div>

        {/* Pronouns */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-2 tracking-widest">Subject (He/She/They)</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-100" />
          </div>
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-2 tracking-widest">Object (Him/Her/Them)</label>
            <input type="text" value={object} onChange={(e) => setObject(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-100" />
          </div>
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-2 tracking-widest">Possessive</label>
            <input type="text" value={possessive} onChange={(e) => setPossessive(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-100" />
          </div>
        </div>

        {/* Physical Traits */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-2 tracking-widest">Build</label>
            <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-100">
              <option value="slight">Slight</option>
              <option value="average">Average</option>
              <option value="athletic">Athletic</option>
              <option value="burly">Burly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-2 tracking-widest">Hair Style</label>
            <select value={hairStyle} onChange={(e) => setHairStyle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-100">
              <option value="shaved">Shaved</option>
              <option value="short">Short</option>
              <option value="long">Long</option>
              <option value="braided">Braided</option>
              <option value="unkempt">Unkempt</option>
            </select>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-8 p-4 bg-slate-900/50 rounded border border-slate-700 italic text-slate-400">
          {previewText}
        </div>

        <button 
          onClick={handleFinish}
          className="w-full bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-4 rounded uppercase tracking-widest transition-colors mt-4"
        >
          Confirm Existence
        </button>
      </div>
    </div>
  );
};

export default CharacterCreator;
