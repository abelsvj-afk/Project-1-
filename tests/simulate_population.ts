import { store } from '../src/store';
import { setLocation } from '../src/store/slices/playerSlice';
import { populateLocation } from '../src/engine/populationEngine';

async function runPopulationSim() {
    console.log('=== FABLE-STYLE POPULATION SIMULATION ===\n');

    const logLocationGenerics = (loc: string) => {
        const npcs = Object.values(store.getState().game.npcs).filter(n => n.simulatedState.lastLocation === loc && n.isGenerated);
        console.log(`[Location: ${loc}] Found ${npcs.length} generic NPCs:`);
        npcs.forEach(n => {
            console.log(`  - ${n.name} (${n.title}) | Faction: ${n.factionId}`);
            console.log(`    Backstory: "${n.backstory}"`);
            console.log(`    Personality: ${n.personality.archetype} | Bravery: ${n.personality.braveryThreshold}`);
        });
    };

    // 1. Move to a location and trigger population
    console.log('[STEP 1] Entering Borderlands Outpost');
    store.dispatch(setLocation('borderlands_outpost'));
    populateLocation('borderlands_outpost', store.getState().game.npcs, store.dispatch);
    
    logLocationGenerics('borderlands_outpost');

    // 2. Move to a new location
    console.log('\n[STEP 2] Entering Static Crater');
    store.dispatch(setLocation('static_crater'));
    populateLocation('static_crater', store.getState().game.npcs, store.dispatch);

    logLocationGenerics('static_crater');

    // 3. Verify they persist when returning
    console.log('\n[STEP 3] Returning to Borderlands Outpost');
    store.dispatch(setLocation('borderlands_outpost'));
    populateLocation('borderlands_outpost', store.getState().game.npcs, store.dispatch);

    // Should still be exactly 3 (or whatever count is set to), not 6
    logLocationGenerics('borderlands_outpost');

    console.log('\n=== SIMULATION COMPLETE ===');
}

runPopulationSim();
