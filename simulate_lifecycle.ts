import { store } from './src/store';
import { setIdentity, changeWealth } from './src/store/slices/playerSlice';
import { processCombatTick, useCure } from './src/engine/combatEngine';
import { addAffliction, addItem } from './src/store/slices/playerSlice';

async function runEndToEndSimulation() {
    console.log('=== END-TO-END LIFECYCLE SIMULATION ===\n');

    // 1. SIMULATE CHARACTER CREATION (BOOT)
    console.log('[PHASE 1] Character Creation');
    store.dispatch(setIdentity({
        name: 'Vaelen',
        appearance: {
            bodyType: 'athletic', musculature: 'lean', height: 'average',
            hairStyle: 'cropped', hairColor: 'dark', eyeColor: 'grey',
            eyeType: 'organic', skinTone: 'tan', scars: [], tattoos: [], facialFeatures: []
        },
        pronouns: { subject: 'he', object: 'him', possessive: 'his' },
        presence: { intimidating: 10, uncanny: 50, exotic: 20, normalized: 20 },
        presenceDescription: 'A focused individual with an unsettlingly intense grey gaze.'
    }));
    console.log('✔ Character Identity Set');

    // 2. SIMULATE LOADING (STATE TRANSITION)
    console.log('\n[PHASE 2] Loading Simulation');
    // In actual app, this is UI only, but we verify store integrity here
    const state = store.getState();
    if (!state.player.name || state.player.name === 'Stranger') {
        console.error('✘ PITFALL: Identity not persisted during boot!');
    } else {
        console.log('✔ State persistence verified.');
    }

    // 3. SIMULATE COMBAT & AFFLICTIONS (THE "ACHAEA" TEST)
    console.log('\n[PHASE 3] Combat & Cure Simulation');
    store.dispatch(addAffliction('ghost_static')); // Give player an affliction
    store.dispatch(addItem('epidermal_salve'));   // Give player a cure
    
    console.log('Initial State:', {
        afflictions: store.getState().player.afflictions,
        inventory: store.getState().player.inventory,
        balance: store.getState().player.balance
    });

    // Try to use a cure
    console.log('\n[SIM] Attempting to use Epidermal Salve...');
    // Mocking combatData since we are in node
    // In real app, combatData.json is loaded
    // Here we check if the engine logic handles the dispatch correctly
    useCure('epidermal_salve', store.getState(), store.dispatch);

    console.log('State after Cure attempt:', {
        afflictions: store.getState().player.afflictions,
        inventory: store.getState().player.inventory,
        balance: store.getState().player.balance
    });

    // 4. PITFALL CHECK: REDUNDANT STATE UPDATES
    console.log('\n[PHASE 4] Pitfall Analysis');
    const startWealth = store.getState().player.wealth;
    store.dispatch(changeWealth(-50));
    store.dispatch(changeWealth(-50));
    if (store.getState().player.wealth !== startWealth - 100) {
        console.error('✘ PITFALL: Wealth calculation race condition!');
    } else {
        console.log('✔ Atomic state updates verified.');
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

runEndToEndSimulation();
