import type { Storylet } from '../types/game';
import type { RootState } from '../store';

/**
 * Filters storylets based on their prerequisites and the current game state.
 */
export const filterStorylets = (
  storylets: Storylet[],
  state: RootState
): Storylet[] => {
  const { player, game } = state;

  return storylets.filter((storylet) => {
    const { prerequisites: pre } = storylet;

    // Check Location
    if (pre.location && pre.location !== player.location) return false;

    // Check Alignment (Good/Evil)
    if (pre.minAlignment !== undefined && player.alignment < pre.minAlignment) return false;
    if (pre.maxAlignment !== undefined && player.alignment > pre.maxAlignment) return false;

    // Check Purity (Pure/Corrupt)
    if (pre.minPurity !== undefined && player.purity < pre.minPurity) return false;
    if (pre.maxPurity !== undefined && player.purity > pre.maxPurity) return false;

    // Check Wealth
    if (pre.minWealth !== undefined && player.wealth < pre.minWealth) return false;

    // Check Required Items
    if (pre.requiredItems) {
      const hasAllItems = pre.requiredItems.every((item) =>
        player.inventory.includes(item)
      );
      if (!hasAllItems) return false;
    }

    // Check Global Flags
    if (pre.globalFlags) {
      for (const [flag, value] of Object.entries(pre.globalFlags)) {
        if (game.globalFlags[flag] !== value) return false;
      }
    }

    return true;
  });
};

/**
 * Replaces tags like {player.name} with actual values from the state.
 */
export const interpolate = (text: string, state: RootState): string => {
  const { player } = state;
  
  return text
    .replace(/{player.name}/g, player.name)
    .replace(/{player.subject}/g, player.pronouns.subject)
    .replace(/{player.object}/g, player.pronouns.object)
    .replace(/{player.possessive}/g, player.pronouns.possessive)
    .replace(/{player.hairColor}/g, player.appearance.hairColor)
    .replace(/{player.eyeColor}/g, player.appearance.eyeColor)
    .replace(/{player.bodyType}/g, player.appearance.bodyType);
};

/**
 * Procedural text generation based on player state (Extreme Morphing).
 * Replaces placeholders and applies conditional modifiers.
 */
export const morphText = (text: string, state: RootState): string => {
  const { player } = state;

  let morphed = interpolate(text, state);

  // 2. Presence-Based Context Injection
  if (player.presence && morphed.includes('[NPC_REACT]')) {
    let reaction = "gives you a wary but indifferent nod";
    if (player.presence.intimidating > 60) {
      reaction = "steps back, clearly intimidated by your formidable presence";
    } else if (player.presence.uncanny > 60) {
      reaction = "stares at you with visible discomfort, unsettled by your unnatural form";
    } else if (player.presence.exotic > 60) {
      reaction = "cannot hide their fascination, eyes lingering on your strange features";
    } else if (player.presence.normalized > 70) {
      reaction = "barely seems to register you, treating you like just another commoner";
    }
    morphed = morphed.replace(/\[NPC_REACT\]/g, reaction);
  }

  // 3. Faction Influence Injections
  if (morphed.includes('[SCAVENGER_REACT]')) {
    const inf = player.history?.factionInfluence?.['scavengers'] || 0;
    let scavReact = "eyes you suspiciously";
    if (inf > 20) scavReact = "gives you a quick, respectful salute";
    if (inf < -20) scavReact = "spits at your feet, clearly despising you";
    morphed = morphed.replace(/\[SCAVENGER_REACT\]/g, scavReact);
  }

  // Example of alignment-based morphing
  if (player.alignment < -500) {
    morphed = morphed.replace(
      /hand(s)?/g,
      'clawed hand$1'
    );
  } else if (player.alignment > 500) {
    morphed = morphed.replace(
      /hand(s)?/g,
      'steady, luminous hand$1'
    );
  }

  if (player.purity < -500) {
      morphed = morphed.replace(
          /\./g,
          ', the air around you shimmering with a faint, sickly green miasma.'
      );
  }

  return morphed;
};
