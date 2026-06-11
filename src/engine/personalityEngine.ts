import personalities from '../data/personalities.json';

export type TraitType = 'greed' | 'fear' | 'bravery';

export interface NPCPersonality {
  trait: TraitType;
  voiceSeed: number;
}

/**
 * Generates a stable personality based on an NPC ID and a world seed.
 */
export const rollPersonality = (npcId: string, worldSeed: number): NPCPersonality => {
  // Simple deterministic hash based on ID and world seed
  const hash = Array.from(npcId + worldSeed).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc),
    0
  );
  
  const traits: TraitType[] = ['greed', 'fear', 'bravery'];
  const trait = traits[Math.abs(hash) % traits.length];
  
  return {
    trait,
    voiceSeed: Math.abs(hash),
  };
};

/**
 * Returns a greeting based on the NPC's rolled personality.
 */
export const getGreeting = (personality: NPCPersonality): string => {
  const bucket = personalities.traitBuckets[personality.trait];
  const index = personality.voiceSeed % bucket.greetings.length;
  return bucket.greetings[index];
};

/**
 * Returns a reaction based on the player's choice type.
 */
export const getReaction = (
  personality: NPCPersonality,
  choiceType: 'help' | 'threat' | 'silence'
): string => {
  return personalities.traitBuckets[personality.trait].reactions[choiceType];
};
