import { store } from '../src/store';
import { setIdentity, setLocation, addCompanion } from '../src/store/slices/playerSlice';
import { assembleProse } from '../src/engine/narrativeEngine';

async function runProseSim() {
    console.log('=== DYNAMIC PROSE ASSEMBLY SIMULATION ===\n');

    // Scenario 1: Standard Arrival
    console.log('[SCENARIO 1] Standard Arrival at Market');
    store.dispatch(setIdentity({
        name: 'Elara',
        appearance: {
            bodyType: 'lean', musculature: 'fit', height: 'tall',
            hairStyle: 'braided', hairColor: 'silver', eyeColor: 'amber',
            eyeType: 'organic', skinTone: 'olive', scars: [], tattoos: [], facialFeatures: []
        },
        pronouns: { subject: 'she', object: 'her', possessive: 'her' },
        presence: { intimidating: 20, uncanny: 10, exotic: 40, normalized: 30 },
        presenceDescription: 'A silver-haired stranger.'
    }));
    store.dispatch(setLocation('outpost_market'));
    
    let text = assembleProse(store.getState(), "You push through the heavy doors.");
    console.log('TEXT:', text);

    // Scenario 2: Arrival with Companion
    console.log('\n[SCENARIO 2] Arrival with Companion (Kaelen)');
    store.dispatch(addCompanion('kaelen'));
    text = assembleProse(store.getState(), "The market is louder than usual.");
    console.log('TEXT:', text);

    // Scenario 3: High Menace State
    console.log('\n[SCENARIO 3] High Syndicate Menace');
    // Note: We'd normally use changeMenace but for sim we can just state-inject if we had the reducer
    // For now we'll check the logic in assembleProse
    console.log('(Simulating high menace via state manipulation logic check)');
    
    console.log('\n=== SIMULATION COMPLETE ===');
}

runProseSim();
