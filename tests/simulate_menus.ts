import { store } from '../src/store';
import { addCompanion, addItem, updateStats } from '../src/store/slices/playerSlice';

async function runMenuSim() {
    console.log('=== UI MENU & TAB SIMULATION ===\n');

    // 1. Setup State for Menus
    console.log('[STEP 1] Initializing Menu Context (Items, Stats, Companions)');
    store.dispatch(addItem('rusted_gear'));
    store.dispatch(updateStats({ prowess: 15 }));
    store.dispatch(addCompanion('kaelen'));
    
    const state = store.getState();
    console.log('✔ State Prepared.');

    // 2. Simulate Tab Logic (Logic verification)
    console.log('\n[STEP 2] Simulating Sidebar Tab Navigation');
    const tabs = ['inventory', 'skills', 'blueprints', 'civic', 'social'];
    tabs.forEach(tab => {
        console.log(`>>> Switching to TAB: ${tab}`);
        // In the real app, this is React state (activeTab), 
        // we verify that the data for these tabs exists in the store.
        if (tab === 'inventory' && state.player.inventory.length === 0) console.error('✘ Inventory Data Missing');
        if (tab === 'social' && state.player.companions.length === 0) console.error('✘ Social/Companion Data Missing');
    });

    // 3. Verify Companion Integration
    console.log('\n[STEP 3] Verifying Companion Connection');
    if (state.player.companions.includes('kaelen')) {
        console.log('✔ SUCCESS: Kaelen is correctly linked as a companion in the store.');
    } else {
        console.error('✘ FAILURE: Companion link broken.');
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

runMenuSim();
