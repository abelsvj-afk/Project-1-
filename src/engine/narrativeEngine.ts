import type { Storylet } from '../types/game';
import type { RootState } from '../store';
import { withDiagnostics } from './utils/diagnostics';
import fragments from '../data/fragments.json';

/**
 * Assembles dynamic prose based on the current world state.
 */
const _assembleProse = (state: RootState, baseContent: string): string => {
  const { player, game } = state;
  const assembled: string[] = [];

  // 1. Location Intro (20% chance to add flavor)
  if (Math.random() < 0.2) {
    const intros = (fragments.locationIntros as any)[player.location];
    if (intros) assembled.push(intros[Math.floor(Math.random() * intros.length)]);
  }

  // 2. Base Content
  assembled.push(interpolate(baseContent, state));

  // 3. Companion Context
  player.companions.forEach(companionId => {
    const compFrags = (fragments.companionFragments as any)[companionId];
    if (compFrags) assembled.push(compFrags[Math.floor(Math.random() * compFrags.length)]);
  });

  // 4. Autonomous Actor Context (If NPCs are at this location)
  Object.entries(game.npcs).forEach(([npcId, npcData]) => {
    if (npcData.simulatedState.lastLocation === player.location && !player.companions.includes(npcId)) {
      const actorFrags = (fragments.actorFragments as any)[npcId];
      if (actorFrags) {
        const frag = actorFrags[npcData.disposition || 'neutral'] || actorFrags['neutral'];
        if (frag) assembled.push(frag);
      }
    }
  });

  // 5. Appearance Context (50% chance to add flavor)
  if (Math.random() < 0.5) {
    const appearanceFrag = fragments.appearanceFragments[Math.floor(Math.random() * fragments.appearanceFragments.length)];
    assembled.push(interpolate(appearanceFrag, state));
  }

  // 6. Faction Context
  if (player.history.factionMenace?.syndicate > 50) {
      assembled.push(fragments.factionFragments.syndicate.menace_high);
  }

  // 7. MAIN STORY OVERLAYS (The Blighted Sovereign)
  // These inject global arc hints into the systemic prose
  if ((game.globalFlags as any).story_weight > 50) {
      if (Math.random() < 0.3) {
          assembled.push("A sickening pulse of black-violet light ripples through the air—the Sovereign's shadow is lengthening.");
      }
  }

  if (player.isBlessedSkillRevealed && player.location === 'iron_watch_hq') {
      assembled.push("Your Echo-Anchor recoils as if sensing a predator. A voice that isn't yours echoes: 'So... the Anchor has returned.'");
  }

  return assembled.join(' ');
};

export const assembleProse = withDiagnostics(_assembleProse, 'assembleProse');

/**
 * Filters storylets based on their prerequisites and the current game state.
 */
const _filterStorylets = (
  storylets: Storylet[],
  state: RootState
): Storylet[] => {
  const { player, game } = state;

  const filtered = storylets.filter((storylet) => {
    const { prerequisites: pre } = storylet;

    // Check if already seen and not repeatable
    if (game.seenStorylets.includes(storylet.id) && !storylet.repeatable) return false;

    // Check Location
    if (pre.location && pre.location !== player.location) return false;

    // --- NEW: NPC PRESENCE REQUIREMENT ---
    // If a storylet requires an NPC to be at the player's location
    if ((pre as any).requiredNpc && game.npcs[(pre as any).requiredNpc]?.simulatedState.lastLocation !== player.location) {
        return false;
    }

    // --- NEW: ANY NPC PRESENCE REQUIREMENT ---
    if ((pre as any).requiredAnyNpc) {
        const anyNpcPresent = Object.values(game.npcs).some(npc => npc.simulatedState.lastLocation === player.location);
        if (!anyNpcPresent) return false;
    }

    // --- NEW: WORLD MILESTONE GATING ---
    if ((pre as any).requiredMilestone && !game.knowledgeFlags.includes((pre as any).requiredMilestone)) {
        return false;
    }

    // Check Alignment (Good/Evil)
    if (pre.minAlignment !== undefined && player.alignment < pre.minAlignment) return false;
    if (pre.maxAlignment !== undefined && player.alignment > pre.maxAlignment) return false;

    // Check Purity (Pure/Corrupt)
    if (pre.minPurity !== undefined && player.purity < pre.minPurity) return false;
    if (pre.maxPurity !== undefined && player.purity > pre.maxPurity) return false;

    // Check Wealth
    if (pre.minWealth !== undefined && player.wealth < pre.minWealth) return false;

    // Check Required Stats
    if (pre.requiredStats) {
      if ((pre.requiredStats as any).vessel && player.stats.vessel < (pre.requiredStats as any).vessel) return false;
      if (pre.requiredStats.logic && player.stats.logic < pre.requiredStats.logic) return false;
      if (pre.requiredStats.finesse && player.stats.finesse < pre.requiredStats.finesse) return false;
      if ((pre.requiredStats as any).resonance && player.stats.resonance < (pre.requiredStats as any).resonance) return false;
    }

    // Check Required Items
    if (pre.requiredItems) {
      const hasAllItems = pre.requiredItems.every((item) =>
        player.inventory.includes(item)
      );
      if (!hasAllItems) return false;
    }

    // Check Knowledge Flags
    if (pre.knowledgeFlags) {
      const hasAllKnowledge = pre.knowledgeFlags.every((flag) =>
        game.knowledgeFlags.includes(flag)
      );
      if (!hasAllKnowledge) return false;
    }

    // Check Global Flags
    if (pre.globalFlags) {
      for (const [flag, value] of Object.entries(pre.globalFlags)) {
        if (game.globalFlags[flag] !== value) return false;
      }
    }

    // Check Last Storylet/Choice (Strict Linkage)
    if (pre.lastStoryletId && pre.lastStoryletId !== game.lastStoryletId) return false;
    if (pre.lastChoiceId && pre.lastChoiceId !== game.lastChoiceId) return false;

    return true;
  });

  // Calculate dynamic priority
  const scored = filtered.map(s => {
      let score = s.priority || 0;
      
      // Direct Linkage Boost (Massive priority for storylets that explicitly follow the last choice/storylet)
      if (s.prerequisites.lastChoiceId === game.lastChoiceId) score += 1000;
      if (s.prerequisites.lastStoryletId === game.lastStoryletId) score += 500;
      
      // "Newness" Boost (Prefer storylets never seen before over repeatable ones)
      if (!game.seenStorylets.includes(s.id)) score += 50;

      return { ...s, dynamicScore: score };
  });

  // Sort by dynamic score (higher first)
  return scored.sort((a, b) => b.dynamicScore - a.dynamicScore);
};

export const filterStorylets = withDiagnostics(_filterStorylets, 'filterStorylets');

/**
 * Weighted deck dealer. 
 * Picks the best storylet from available ones based on priority and a small amount of randomness.
 */
const _dealFromDeck = (storylets: Storylet[], state: RootState): Storylet | null => {
  const { game } = state;

  // --- NEW: FORCED STORYLET LOGIC ---
  if (game.forcedStoryletId) {
    const forced = storylets.find(s => s.id === game.forcedStoryletId);
    if (forced) return forced;
  }

  const available = _filterStorylets(storylets, state);
  
  if (available.length === 0) return null;

  // The 'filtered' list is already sorted by dynamicScore descending.
  // To implement a "Deck" feel, we pick from the top-tier candidates.
  const topScore = (available[0] as any).dynamicScore;
  
  // Get all candidates within a small range of the top score to allow some variety
  // among equally valid procedural storylets.
  const threshold = 10; 
  const candidates = available.filter(s => (s as any).dynamicScore >= topScore - threshold);

  // Pick one randomly from the candidates
  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  return selected;
};

export const dealFromDeck = withDiagnostics(_dealFromDeck, 'dealFromDeck');

/**
 * Replaces tags like {player.name} or {npc:kaelen} with actual values from the state.
 */
const _interpolate = (text: string, state: RootState): string => {
  const { player, game } = state;
  
  let interpolated = text
    .replace(/{player.name}/g, player.name)
    .replace(/{player.subject}/g, player.pronouns.subject)
    .replace(/{player.object}/g, player.pronouns.object)
    .replace(/{player.possessive}/g, player.pronouns.possessive)
    .replace(/{player.hairColor}/g, player.appearance.hairColor)
    .replace(/{player.eyeColor}/g, player.appearance.eyeColor)
    .replace(/{player.bodyType}/g, player.appearance.bodyType)
    .replace(/{player.skinTone}/g, player.appearance.skinTone)
    .replace(/{player.height}/g, player.appearance.height)
    .replace(/{player.musculature}/g, player.appearance.musculature)
    .replace(/{player.presenceDescription}/g, player.presenceDescription || '')
    .replace(/{player.stamina}/g, player.stamina.toString())
    .replace(/{player.focus}/g, player.focus.toString())
    .replace(/{player.blessedSkill}/g, () => {
        if (!player.isBlessedSkillRevealed) return 'a strange, dormant warmth in your marrow';
        return player.blessedAbility || 'your Echo-Anchor resonance';
    })
    .replace(/{game.lastLoot}/g, () => {
        const name = game.globalFlags['last_loot_name'] || 'nothing';
        const amount = game.globalFlags['last_loot_amount'];
        return amount ? `${amount} Shards worth of ${name}` : String(name);
    });

  // Dynamic NPC Name Reveal Logic
  const npcNameRegex = /{npc:(.*?)}/g;
  interpolated = interpolated.replace(npcNameRegex, (_match, npcId) => {
    let finalId = npcId;
    
    // Resolve 'active' NPC from conversation context
    if (npcId === 'active') {
        finalId = game.activeConversationNpcId || 'stranger';
    }

    if (game.knownNames.includes(finalId)) {
        const npc = game.npcs[finalId];
        return npc ? npc.name : (finalId.charAt(0).toUpperCase() + finalId.slice(1));
    }
    
    // Fallback descriptors based on initial encounter logic
    if (finalId === 'kaelen') return 'the scavenger';
    if (finalId === 'syndicate_enforcer_grunt') return 'the enforcer';
    if (finalId === 'vane') return 'the Overseer';
    return 'the stranger';
  });

  return interpolated;
};

export const interpolate = withDiagnostics(_interpolate, 'interpolate');

/**
 * Procedural text generation based on player state (Extreme Morphing).
 * Replaces placeholders and applies conditional modifiers.
 */
const _morphText = (text: string, state: RootState): string => {
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

export const morphText = withDiagnostics(_morphText, 'morphText');
