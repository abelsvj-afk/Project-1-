import { store } from '../src/store';
import { updateRelationship } from '../src/store/slices/gameSlice';

async function testSocialMatrixMiddleware() {
    console.log('=== SOCIAL MATRIX MIDDLEWARE TEST (RED PHASE) ===\n');

    const npcId = 'kaelen';
    
    // Initial state check
    const initialRel = store.getState().game.relationships[npcId] || { trust: 0, romance: 0, fear: 0 };
    console.log('Initial Relationship:', initialRel);

    // Dispatch high fear
    console.log('\n[SIM] Increasing Fear by 80...');
    store.dispatch(updateRelationship({ npcId, type: 'fear', change: 80 }));

    // Wait for cascade
    await new Promise(resolve => setTimeout(resolve, 50));

    const afterFearRel = store.getState().game.relationships[npcId];
    console.log('Relationship after Fear increase:', afterFearRel);

    if (afterFearRel.trust < initialRel.trust) {
        console.log('✔ SUCCESS: High fear automatically lowered trust.');
    } else {
        console.error('✘ FAILURE: Trust remains unchanged despite high fear.');
    }

    console.log('\n=== TEST COMPLETE ===');
}

testSocialMatrixMiddleware();
