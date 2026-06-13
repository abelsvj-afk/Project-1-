import { store } from '../src/store';
import { setLocation, changeWealth } from '../src/store/slices/playerSlice';
import { setGlobalFlag, revealKnowledge } from '../src/store/slices/gameSlice';
import { filterStorylets } from '../src/engine/narrativeEngine';
import storyletsData from '../src/data/storylets.json';

async function runGatingSim() {
    console.log('=== WORLD GATING & MILESTONE SIMULATION ===\n');

    // 1. Setup Initial State (Market, Wealthy, Knows Vane, but NO Milestone)
    store.dispatch(setLocation('outpost_market'));
    store.dispatch(changeWealth(500));
    store.dispatch(setGlobalFlag({ flag: 'story_progress', value: 'knows_vane' }));

    console.log('[STEP 1] Checking Summons WITHOUT "reached_outpost" milestone...');
    let available = filterStorylets(storyletsData as any, store.getState());
    let summons = available.find(s => s.id === 'story_vane_summon');
    
    if (!summons) {
        console.log('✔ SUCCESS: Summons is correctly locked.');
    } else {
        console.error('✘ FAILURE: Summons is visible despite missing milestone!');
    }

    // 2. Add Milestone
    console.log('\n[STEP 2] Adding "reached_outpost" milestone...');
    store.dispatch(revealKnowledge('reached_outpost'));

    available = filterStorylets(storyletsData as any, store.getState());
    summons = available.find(s => s.id === 'story_vane_summon');

    if (summons) {
        console.log('✔ SUCCESS: Summons is now unlocked and available.');
    } else {
        console.error('✘ FAILURE: Summons is still locked despite meeting all prerequisites!');
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

runGatingSim();
