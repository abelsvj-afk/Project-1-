import type { AppDispatch, RootState } from '../store';
import { moveNPC, logWorldEvent } from '../store/slices/gameSlice';
import worldMap from '../data/world_map.json';
import { withDiagnostics } from './utils/diagnostics';

/**
 * World Simulation Engine
 * Handles autonomous NPC movement, schedules, and hierarchy-based behavior.
 */
const _simulateWorldTurn = (state: RootState, dispatch: AppDispatch) => {
  const { npcs, gameTime } = state.game;
  const { player } = state;

  Object.entries(npcs).forEach(([npcId, npcData]) => {
    // 1. COMPANION LOCK: Companions don't move autonomously
    if (state.player.companions.includes(npcId)) return;

    let targetLocation = npcData.simulatedState.lastLocation;
    let currentGoal = npcData.simulatedState.goal;

    // 2. SCHEDULE LAYER: NPCs follow their basic routine
    const activeTask = npcData.schedule.find(s => gameTime >= s.timeStart && gameTime <= s.timeEnd);
    if (activeTask) {
        targetLocation = activeTask.location;
        currentGoal = activeTask.activity as any;
    }

    // 3. HIERARCHY OVERRIDES
    // TIER 1 (Grunts): 50% chance to deviate from schedule to patrol nearby connections
    if (npcData.statusTier === 1 && Math.random() < 0.5) {
        const currentNode = worldMap.nodes.find(n => n.id === npcData.simulatedState.lastLocation);
        if (currentNode && currentNode.connections.length > 0) {
            targetLocation = currentNode.connections[Math.floor(Math.random() * currentNode.connections.length)];
            currentGoal = 'patrol';
        }
    }

    // TIER 3+ (Elites/Apex): If player is high menace or high wealth, they may 'hunt'
    if (npcData.statusTier >= 3 && (player.wealth > 1000 || player.history.factionMenace[npcData.factionId || ''] > 50)) {
        if (Math.random() < 0.3) {
            targetLocation = player.location; // Track player
            currentGoal = 'hunt_player';
        }
    }

    // 4. EXECUTION: If location has changed, dispatch move
    if (targetLocation !== npcData.simulatedState.lastLocation) {
        dispatch(moveNPC({ npcId, locationId: targetLocation }));
        
        // Log movement if near player
        if (targetLocation === player.location || npcData.simulatedState.lastLocation === player.location) {
          dispatch(logWorldEvent(`${npcData.name} (${npcData.title}) moved to ${targetLocation}`));
          console.log(`[SIM] NPC MOVEMENT: ${npcId} -> ${targetLocation} [Goal: ${currentGoal}]`);
        }
    }
  });
};

export const simulateWorldTurn = withDiagnostics(_simulateWorldTurn, 'simulateWorldTurn');
