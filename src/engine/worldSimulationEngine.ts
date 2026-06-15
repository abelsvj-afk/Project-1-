import type { AppDispatch, RootState } from '../store';
import { moveNPC, logWorldEvent } from '../store/slices/gameSlice';
import worldMap from '../data/world_map.json';
import { withDiagnostics } from './utils/diagnostics';

const validNodeIds = new Set(worldMap.nodes.map(n => n.id));

/**
 * World Simulation Engine
 * Handles autonomous NPC movement, schedules, and hierarchy-based behavior.
 * Called once per player choice (not on a timer) to keep the world reactive.
 */
const _simulateWorldTurn = (state: RootState, dispatch: AppDispatch) => {
  const { npcs, gameTime } = state.game;
  const { player } = state;

  Object.entries(npcs).forEach(([npcId, npcData]) => {
    // Companions don't move autonomously
    if (player.companions.includes(npcId)) return;
    // Dead NPCs stay put
    if (npcData.simulatedState.isDead) return;

    const currentLocation = npcData.simulatedState.lastLocation;
    let targetLocation = currentLocation;

    // 1. Schedule Layer — NPCs follow their basic routine
    const activeTask = npcData.schedule.find(s => {
      // Handle schedules that wrap midnight (e.g. timeStart: 1801, timeEnd: 799)
      if (s.timeStart > s.timeEnd) {
        return gameTime >= s.timeStart || gameTime <= s.timeEnd;
      }
      return gameTime >= s.timeStart && gameTime <= s.timeEnd;
    });
    if (activeTask) {
      targetLocation = activeTask.location;
    }

    // 2. Hierarchy Overrides
    // Tier 1 (Grunts): 30% chance to patrol a connected node
    if (npcData.statusTier === 1 && Math.random() < 0.3) {
      const currentNode = worldMap.nodes.find(n => n.id === currentLocation);
      if (currentNode && currentNode.connections.length > 0) {
        const candidate = currentNode.connections[Math.floor(Math.random() * currentNode.connections.length)];
        if (validNodeIds.has(candidate)) {
          targetLocation = candidate;
        }
      }
    }

    // Tier 3+ (Elites): Hunt player on high menace or wealth
    if (npcData.statusTier >= 3) {
      const factionMenace = player.history.factionMenace[npcData.factionId || ''] || 0;
      if ((player.wealth > 1000 || factionMenace > 50) && Math.random() < 0.3) {
        targetLocation = player.location;
      }
    }

    // 3. Validate target before moving
    if (!validNodeIds.has(targetLocation)) {
      console.warn(`[SIM] NPC ${npcId} tried to move to invalid location: ${targetLocation} — skipped.`);
      return;
    }

    // 4. Execute movement
    if (targetLocation !== currentLocation) {
      dispatch(moveNPC({ npcId, locationId: targetLocation }));

      if (targetLocation === player.location || currentLocation === player.location) {
        const verb = targetLocation === player.location ? 'arrives at' : 'leaves';
        dispatch(logWorldEvent(`${npcData.name} ${verb} your location.`));
      }
    }
  });
};

export const simulateWorldTurn = withDiagnostics(_simulateWorldTurn, 'simulateWorldTurn');
