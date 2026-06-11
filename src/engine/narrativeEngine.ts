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
 * Procedural text generation based on player state (Extreme Morphing).
 * Replaces placeholders and applies conditional modifiers.
 */
export const morphText = (text: string, state: RootState): string => {
  const { player } = state;

  let morphed = text;

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
