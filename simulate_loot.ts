import { store } from './src/store';
import { setIdentity, setLocation } from './src/store/slices/playerSlice';
import { setGlobalFlag } from './src/store/slices/gameSlice';
import { filterStorylets, morphText } from './src/engine/narrativeEngine';
import storyletsData from './src/data/storylets.json';
import { triggerLootDrop } from './src/engine/lootEngine';

async function runLootSimulation() {
    console.log('=== LOOT SYSTEM SIMULATION ===\n');

    // 1. Setup Player in Market
    store.dispatch(setIdentity({
        name: 'Vaelen',
        appearance: {
            bodyType: 'athletic', musculature: 'lean', height: 'average',
            hairStyle: 'cropped', hairColor: 'dark', eyeColor: 'grey',
            eyeType: 'organic', skinTone: 'tan', scars: [], tattoos: [], facialFeatures: []
        },
        pronouns: { subject: 'he', object: 'him', possessive: 'his' },
        presence: { intimidating: 10, uncanny: 50, exotic: 20, normalized: 20 },
        presenceDescription: 'A focused individual.'
    }));
    store.dispatch(setLocation('outpost_market'));
    store.dispatch(setGlobalFlag({ flag: 'hub_action', value: 'scavenge' }));

    console.log('✔ Environment Setup: Location=Outpost Market, Action=Scavenge');

    // 2. Simulate Triggering Loot (Normally happens in handleChoice)
    console.log('\n[SIM] Triggering Procedural Loot Drop (Table: low_wastes)');
    const loot = triggerLootDrop('low_wastes', store.dispatch);
    console.log('✔ Loot Found:', loot);

    // 3. Verify Narrative Interpolation
    const state = store.getState();
    const available = filterStorylets(storyletsData as any, state);
    const outcomeStorylet = available.find(s => s.id === 'outcome_hub_scavenge');

    if (outcomeStorylet) {
        console.log('\n[SIM] Checking Storylet Interpolation:');
        const text = morphText(outcomeStorylet.content, state);
        console.log('FINAL TEXT:', text);
        
        if (text.includes(loot!.name)) {
            console.log('✔ SUCCESS: Narrative correctly displayed the procedural loot.');
        } else {
            console.error('✘ FAILURE: Narrative did not show the loot name!');
        }
    } else {
        console.error('✘ FAILURE: Outcome storylet not found in available list!');
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

runLootSimulation();
