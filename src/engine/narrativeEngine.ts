import type { Storylet } from '../types/game';
import type { RootState } from '../store';
import { withDiagnostics } from './utils/diagnostics';
import fragments from '../data/fragments.json';

/**
 * Assembles dynamic prose based on the current world state.
 * Uses seeded random to stay deterministic for the same game state snapshot.
 */
const _assembleProse = (state: RootState, baseContent: string): string => {
  const { player, game } = state;
  const assembled: string[] = [];

  // Seed a deterministic "random" from location + time to avoid different text each call
  const seed = player.location.length + game.gameTime + game.seenStorylets.length;
  const seededRand = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 * n;

  // 1. Location Intro (every other location visit)
  if (seed % 2 === 0) {
    const intros = (fragments.locationIntros as any)[player.location];
    if (intros) assembled.push(intros[Math.floor(seededRand(intros.length))]);
  }

  // 2. Base Content
  if (baseContent) assembled.push(interpolate(baseContent, state));

  // 3. Companion Context
  player.companions.forEach(companionId => {
    const compFrags = (fragments.companionFragments as any)[companionId];
    if (compFrags) assembled.push(compFrags[Math.floor(seededRand(compFrags.length))]);
  });

  // 4. Autonomous Actor Context
  Object.entries(game.npcs).forEach(([npcId, npcData]) => {
    if (npcData.simulatedState.lastLocation === player.location && !player.companions.includes(npcId)) {
      const actorFrags = (fragments.actorFragments as any)[npcId];
      if (actorFrags) {
        const frag = actorFrags[npcData.disposition || 'neutral'] || actorFrags['neutral'];
        if (frag) assembled.push(frag);
      }
    }
  });

  // 5. Appearance Context (seeded, not random every call)
  if (seed % 3 !== 0) {
    const appearanceFrag = fragments.appearanceFragments[Math.floor(seededRand(fragments.appearanceFragments.length))];
    assembled.push(interpolate(appearanceFrag, state));
  }

  // 6. Faction Context
  if (player.history.factionMenace?.syndicate > 50) {
    assembled.push(fragments.factionFragments.syndicate.menace_high);
  }

  // 7. Main Story Overlays
  if ((game.globalFlags as any).story_weight > 50) {
    if (seed % 5 === 0) {
      assembled.push("A sickening pulse of black-violet light ripples through the air — the Sovereign's shadow is lengthening.");
    }
  }

  if (player.isBlessedSkillRevealed && player.location === 'iron_watch_hq') {
    assembled.push("Your Echo-Anchor recoils as if sensing a predator. A voice that isn't yours echoes: 'So... the Anchor has returned.'");
  }

  return assembled.join(' ');
};

export const assembleProse = withDiagnostics(_assembleProse, 'assembleProse');

/**
 * Filters storylets based on prerequisites and current game state.
 */
const _filterStorylets = (
  storylets: Storylet[],
  state: RootState
): Storylet[] => {
  const { player, game } = state;

  const filtered = storylets.filter((storylet) => {
    const { prerequisites: pre } = storylet;

    if (game.seenStorylets.includes(storylet.id) && !storylet.repeatable) return false;
    if (pre.location && pre.location !== player.location) return false;

    if (pre.requiredNpc && game.npcs[pre.requiredNpc]?.simulatedState.lastLocation !== player.location) return false;
    if (pre.requiredAnyNpc) {
      const anyNpcPresent = Object.values(game.npcs).some(npc => npc.simulatedState.lastLocation === player.location);
      if (!anyNpcPresent) return false;
    }

    if (pre.requiredMilestone && !game.knowledgeFlags.includes(pre.requiredMilestone)) return false;
    if (pre.minAlignment !== undefined && player.alignment < pre.minAlignment) return false;
    if (pre.maxAlignment !== undefined && player.alignment > pre.maxAlignment) return false;
    if (pre.minPurity !== undefined && player.purity < pre.minPurity) return false;
    if (pre.maxPurity !== undefined && player.purity > pre.maxPurity) return false;
    if (pre.minWealth !== undefined && player.wealth < pre.minWealth) return false;

    if (pre.requiredStats) {
      const rs = pre.requiredStats as any;
      if (rs.vessel && player.stats.vessel < rs.vessel) return false;
      if (rs.logic && player.stats.logic < rs.logic) return false;
      if (rs.finesse && player.stats.finesse < rs.finesse) return false;
      if (rs.resonance && player.stats.resonance < rs.resonance) return false;
    }

    if (pre.requiredItems) {
      const hasAll = pre.requiredItems.every(item =>
        player.inventory.some(i => (typeof i === 'string' ? i : i.id) === item)
      );
      if (!hasAll) return false;
    }

    if (pre.knowledgeFlags) {
      if (!pre.knowledgeFlags.every(f => game.knowledgeFlags.includes(f))) return false;
    }

    if (pre.globalFlags) {
      for (const [flag, value] of Object.entries(pre.globalFlags)) {
        if (game.globalFlags[flag] !== value) return false;
      }
    }

    if (pre.lastStoryletId && pre.lastStoryletId !== game.lastStoryletId) return false;
    if (pre.lastChoiceId && pre.lastChoiceId !== game.lastChoiceId) return false;

    return true;
  });

  const scored = filtered.map(s => {
    let score = s.priority || 0;
    if (s.prerequisites.lastChoiceId === game.lastChoiceId) score += 1000;
    if (s.prerequisites.lastStoryletId === game.lastStoryletId) score += 500;
    if (!game.seenStorylets.includes(s.id)) score += 50;
    return { ...s, dynamicScore: score };
  });

  return scored.sort((a, b) => b.dynamicScore - a.dynamicScore);
};

export const filterStorylets = withDiagnostics(_filterStorylets, 'filterStorylets');

/**
 * Weighted deck dealer. Returns the best storylet or null.
 * Clears an invalid forcedStoryletId by returning null when the forced ID isn't found.
 */
const _dealFromDeck = (storylets: Storylet[], state: RootState): Storylet | null => {
  const { game } = state;

  if (game.forcedStoryletId) {
    const forced = storylets.find(s => s.id === game.forcedStoryletId);
    if (forced) return forced;
    // Forced ID not found — return null so caller can clear it
    return null;
  }

  const available = _filterStorylets(storylets, state);
  if (available.length === 0) return null;

  const topScore = (available[0] as any).dynamicScore;
  const threshold = 10;
  const candidates = available.filter(s => (s as any).dynamicScore >= topScore - threshold);

  return candidates[Math.floor(Math.random() * candidates.length)];
};

export const dealFromDeck = withDiagnostics(_dealFromDeck, 'dealFromDeck');

/**
 * Replaces {player.name}, {npc:id}, etc. with actual values.
 */
const _interpolate = (text: string, state: RootState): string => {
  const { player, game } = state;

  let interpolated = text
    .replace(/{player\.name}/g, player.name)
    .replace(/{player\.subject}/g, player.pronouns.subject)
    .replace(/{player\.object}/g, player.pronouns.object)
    .replace(/{player\.possessive}/g, player.pronouns.possessive)
    .replace(/{player\.hairColor}/g, player.appearance.hairColor)
    .replace(/{player\.eyeColor}/g, player.appearance.eyeColor)
    .replace(/{player\.bodyType}/g, player.appearance.bodyType)
    .replace(/{player\.skinTone}/g, player.appearance.skinTone)
    .replace(/{player\.height}/g, player.appearance.height)
    .replace(/{player\.musculature}/g, player.appearance.musculature)
    .replace(/{player\.presenceDescription}/g, player.presenceDescription || '')
    .replace(/{player\.stamina}/g, player.stamina.toString())
    .replace(/{player\.focus}/g, player.focus.toString())
    .replace(/{player\.blessedSkill}/g, () => {
      if (!player.isBlessedSkillRevealed) return 'a strange, dormant warmth in your marrow';
      return player.blessedAbility || 'your Echo-Anchor resonance';
    })
    .replace(/{game\.lastLoot}/g, () => {
      const name = game.globalFlags['last_loot_name'] || 'nothing';
      const amount = game.globalFlags['last_loot_amount'];
      return amount ? `${amount} Shards worth of ${name}` : String(name);
    });

  const npcNameRegex = /{npc:(.*?)}/g;
  interpolated = interpolated.replace(npcNameRegex, (_match, npcId) => {
    let finalId = npcId;
    if (npcId === 'active') {
      finalId = game.activeConversationNpcId || 'stranger';
    }
    if (game.knownNames.includes(finalId)) {
      const npc = game.npcs[finalId];
      return npc ? npc.name : (finalId.charAt(0).toUpperCase() + finalId.slice(1));
    }
    if (finalId === 'kaelen') return 'the scavenger';
    if (finalId === 'syndicate_enforcer_grunt') return 'the enforcer';
    if (finalId === 'vane') return 'the Overseer';
    return 'the stranger';
  });

  return interpolated;
};

export const interpolate = withDiagnostics(_interpolate, 'interpolate');

/**
 * Presence-based and alignment-based text morphing.
 */
const _morphText = (text: string, state: RootState): string => {
  const { player } = state;

  let morphed = interpolate(text, state);

  // Presence-based NPC reactions
  if (player.presence && morphed.includes('[NPC_REACT]')) {
    let reaction = "gives you a wary but indifferent nod";
    if (player.presence.intimidating > 60) reaction = "steps back, clearly intimidated by your formidable presence";
    else if (player.presence.uncanny > 60) reaction = "stares with visible discomfort, unsettled by your unnatural form";
    else if (player.presence.exotic > 60) reaction = "cannot hide their fascination, eyes lingering on your strange features";
    else if (player.presence.normalized > 70) reaction = "barely registers you, treating you like just another commoner";
    morphed = morphed.replace(/\[NPC_REACT\]/g, reaction);
  }

  // Faction reactions
  if (morphed.includes('[SCAVENGER_REACT]')) {
    const inf = player.history?.factionInfluence?.['scavengers'] || 0;
    let scavReact = "eyes you suspiciously";
    if (inf > 20) scavReact = "gives you a quick, respectful salute";
    if (inf < -20) scavReact = "spits at your feet, clearly despising you";
    morphed = morphed.replace(/\[SCAVENGER_REACT\]/g, scavReact);
  }

  // Alignment-based description morphs — replace "hand" variants only
  if (player.alignment < -500) {
    morphed = morphed.replace(/\bhands\b/g, 'clawed hands').replace(/\bhand\b/g, 'clawed hand');
  } else if (player.alignment > 500) {
    morphed = morphed.replace(/\bhands\b/g, 'steady, luminous hands').replace(/\bhand\b/g, 'steady, luminous hand');
  }

  // Purity corruption — add a tainted aura prefix instead of mangling every period
  if (player.purity < -500) {
    morphed = '[A sickly green miasma clings to the air around you.] ' + morphed;
  }

  return morphed;
};

export const morphText = withDiagnostics(_morphText, 'morphText');
