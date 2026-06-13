import { store } from '../src/store';
import { simulateWorldTurn } from '../src/engine/worldSimulationEngine';
import { setLocation } from '../src/store/slices/playerSlice';

async function runWorldSim() {
    console.log('=== NPC AUTONOMY SIMULATION START ===\n');

    store.dispatch(setLocation('borderlands_outpost'));
    console.log('Player Location: borderlands_outpost');

    for (let turn = 1; turn <= 20; turn++) {
        const state = store.getState();
        console.log(`\n[Turn ${turn}] NPC Locations:`, 
            Object.entries(state.game.npcs).map(([id, data]) => `${id}@${data.locationId}`).join(', ')
        );

        simulateWorldTurn(state, store.dispatch);
        
        // Check for local encounters
        const stateAfter = store.getState();
        const localNpcs = Object.entries(stateAfter.game.npcs).filter(([id, data]) => data.locationId === stateAfter.player.location);
        if (localNpcs.length > 0) {
            console.log(`>>> PROXIMITY ALERT: ${localNpcs.map(n => n[0]).join(', ')} is at your location!`);
        }
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

runWorldSim();
