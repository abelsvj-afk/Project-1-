import { store } from '../src/store';
import { setLocation, revealBlessedSkill } from '../src/store/slices/playerSlice';
import { setGlobalFlag } from '../src/store/slices/gameSlice';
import { assembleProse } from '../src/engine/narrativeEngine';

async function runMainStorySim() {
    console.log('=== MAIN STORY OVERLAY SIMULATION ===\n');

    // 1. Initial State: Low Story Weight
    console.log('[STEP 1] Standard World State (Low Story Weight)');
    store.dispatch(setLocation('borderlands_outpost'));
    let text = assembleProse(store.getState(), "You walk the perimeter.");
    console.log('PROSE:', text);

    // 2. State Change: Increased Story Weight
    console.log('\n[STEP 2] Escalating Story Weight (The Sovereign Awakens)');
    store.dispatch(setGlobalFlag({ flag: 'story_weight', value: 75 }));
    
    // Run several times to hit the random fragment chance
    for (let i = 0; i < 3; i++) {
        text = assembleProse(store.getState(), "You walk the perimeter.");
        console.log(`PROSE ${i+1}:`, text);
    }

    // 3. State Change: Revealed Skill at Enemy HQ
    console.log('\n[STEP 3] Entering Syndicate HQ with revealed Anchor...');
    store.dispatch(setLocation('iron_watch_hq'));
    store.dispatch(revealBlessedSkill());

    text = assembleProse(store.getState(), "The iron doors hiss open.");
    console.log('CLIMAX PROSE:', text);

    if (text.includes("the Anchor has returned")) {
        console.log('\n✔ SUCCESS: The Blighted Sovereign directly acknowledged the player!');
    } else {
        console.error('\n✘ FAILURE: Climax fragment not injected.');
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

runMainStorySim();
