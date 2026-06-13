import { store } from '../src/store';

async function testMerchantInventory() {
    console.log('=== MERCHANT INVENTORY TEST (RED PHASE) ===\n');

    const state = store.getState();
    const npcs = state.game.npcs;

    const seraphina = npcs['seraphina'];
    const thorne = npcs['thorne_merchant'];

    if (!seraphina) {
        console.error('✘ Seraphina not found in game state.');
        return;
    }

    if (!thorne) {
        console.error('✘ Thorne not found in game state.');
        return;
    }

    console.log('Checking Seraphina...');
    if ((seraphina as any).tradeInventory) {
        console.log('✔ Seraphina has trade inventory.');
    } else {
        console.error('✘ Seraphina MISSING trade inventory.');
    }

    console.log('Checking Thorne...');
    if ((thorne as any).tradeInventory) {
        console.log('✔ Thorne has trade inventory.');
    } else {
        console.error('✘ Thorne MISSING trade inventory.');
    }

    console.log('\n=== TEST COMPLETE ===');
}

testMerchantInventory();
