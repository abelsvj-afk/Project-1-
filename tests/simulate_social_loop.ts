import { store } from '../src/store';
import { updateRelationship } from '../src/store/slices/gameSlice';

async function runSocialStressTest() {
    console.log('=== SOCIAL MATRIX STRESS TEST ===\n');

    const npcs = ['kaelen', 'seraphina', 'ryker'];
    
    const logNPC = (npcId: string) => {
        const rel = store.getState().game.relationships[npcId] || { trust: 0, romance: 0, fear: 0 };
        console.log(`[NPC: ${npcId}] Trust: ${rel.trust} | Fear: ${rel.fear} | Romance: ${rel.romance}`);
    };

    // 1. Initial State
    console.log('--- Initial State ---');
    npcs.forEach(logNPC);

    // 2. Cascade 1: Fear leads to Trust drop
    console.log('\n--- SCENARIO 1: Intimidating Kaelen (Fear +80) ---');
    store.dispatch(updateRelationship({ npcId: 'kaelen', type: 'fear', change: 80 }));
    await new Promise(resolve => setTimeout(resolve, 50));
    logNPC('kaelen');

    // 3. Cascade 2: Romance leads to Trust boost
    console.log('\n--- SCENARIO 2: Flirting with Seraphina (Romance +40) ---');
    store.dispatch(updateRelationship({ npcId: 'seraphina', type: 'romance', change: 40 }));
    await new Promise(resolve => setTimeout(resolve, 50));
    logNPC('seraphina');

    // 4. Scenario 3: Mixed Interactions (Ryker)
    console.log('\n--- SCENARIO 3: Complex Interaction with Ryker (Trust -20, Fear +30) ---');
    store.dispatch(updateRelationship({ npcId: 'ryker', type: 'trust', change: -20 }));
    store.dispatch(updateRelationship({ npcId: 'ryker', type: 'fear', change: 30 }));
    await new Promise(resolve => setTimeout(resolve, 50));
    logNPC('ryker');

    // 5. Scenario 4: Global Tensions (Faction Menace simulated via state)
    // (This would normally be in a separate engine, but we verify store consistency here)
    console.log('\n--- SCENARIO 4: Verifying Relationship Bounds (-100 to 100 for Trust) ---');
    console.log('[SIM] Pushing Kaelen Trust to the limit (Change -200)...');
    store.dispatch(updateRelationship({ npcId: 'kaelen', type: 'trust', change: -200 }));
    await new Promise(resolve => setTimeout(resolve, 50));
    const finalKaelen = store.getState().game.relationships['kaelen'];
    if (finalKaelen.trust === -100) {
        console.log('✔ SUCCESS: Kaelen trust correctly clamped at -100.');
    } else {
        console.error(`✘ FAILURE: Kaelen trust is ${finalKaelen.trust}, expected -100.`);
    }

    console.log('\n=== STRESS TEST COMPLETE ===');
}

runSocialStressTest();
