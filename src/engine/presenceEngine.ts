import type { Appearance, BodyMarking } from '../types/game';
import { withDiagnostics } from './utils/diagnostics';

export interface PresenceMatrix {
  uncanny: number;      // 0-100: How 'not right' the person looks (clashing traits)
  intimidating: number; // 0-100: Scars, height, massive build
  exotic: number;       // 0-100: Rare eye types, magical hair pigments
  normalized: number;   // 0-100: How 'average' or 'blend-in' the person is
  factionTags: string[]; // syndicate, occult, blueprint-devotee
}

const _calculatePresence = (appearance: Appearance): PresenceMatrix => {
  let uncanny = 0;
  let intimidating = 0;
  let exotic = 0;
  let normalized = 100;
  const factionTags: string[] = [];

  // 1. Somatic Frame Logic
  if (appearance.height === 'towering' || appearance.height === 'monstrous') {
    intimidating += 30;
    normalized -= 20;
  }
  
  if (appearance.musculature === 'massive' || appearance.musculature === 'powerlifter') {
    intimidating += 20;
    normalized -= 10;
  }

  // "Uncanny" Logic: Heavy but with rippling abs/massive muscle
  if (appearance.bodyType === 'heavy' && (appearance.musculature === 'rippling (abs)' || appearance.musculature === 'defined')) {
    uncanny += 40;
    normalized -= 30;
  }

  // 2. Ocular & Cranial Logic
  const exoticEyes = ['void black', 'luminescent violet', 'gold-flecked', 'molten orange', 'toxic green', 'crimson'];
  if (exoticEyes.includes(appearance.eyeColor)) {
    exotic += 30;
    normalized -= 20;
  }

  const weirdEyeTypes = ['cybernetic (lens)', 'cat-like', 'milky (blind)', 'glowing iris', 'hollow', 'reptilian', 'many-pupiled'];
  if (weirdEyeTypes.includes(appearance.eyeType)) {
    uncanny += 30;
    exotic += 20;
    normalized -= 20;
  }

  if (appearance.hairColor.includes('neon') || appearance.hairColor.includes('toxic')) {
    exotic += 20;
    normalized -= 10;
  }

  // 3. Markings Logic
  appearance.scars.forEach((scar: BodyMarking) => {
    normalized -= 5;
    if (scar.location === 'face') intimidating += 15;
    else intimidating += 5;
    
    if (scar.type === 'mechanical port') uncanny += 20;
  });

  appearance.tattoos.forEach((tattoo: BodyMarking) => {
    normalized -= 5;
    if (tattoo.type === 'syndicate crest') factionTags.push('syndicate');
    if (tattoo.type === 'ancient runes') {
      factionTags.push('occult');
      exotic += 10;
    }
    if (tattoo.type === 'faded blueprints') factionTags.push('blueprint-devotee');
  });

  return {
    uncanny: Math.min(100, Math.max(0, uncanny)),
    intimidating: Math.min(100, Math.max(0, intimidating)),
    exotic: Math.min(100, Math.max(0, exotic)),
    normalized: Math.min(100, Math.max(0, normalized)),
    factionTags: Array.from(new Set(factionTags))
  };
};

export const calculatePresence = withDiagnostics(_calculatePresence, 'calculatePresence');

const _getPresenceDescription = (matrix: PresenceMatrix): string => {
  if (matrix.uncanny > 60) return "You look deeply uncanny, your physical form defying natural logic.";
  if (matrix.intimidating > 60) return "You radiate a dangerous, predatory aura that makes people keep their distance.";
  if (matrix.exotic > 60) return "You look like a being from another world, marked by powerful, strange lineages.";
  if (matrix.normalized > 70) return "You look like just another face in the Borderlands, easily forgotten.";
  return "You have a distinct, varied presence that defies easy categorization.";
};

export const getPresenceDescription = withDiagnostics(_getPresenceDescription, 'getPresenceDescription');
