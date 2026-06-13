import { processHistoryConsolidation } from '../src/engine/historyEngine';
import { store } from '../src/store';
import { addNarrativeHistory } from '../src/store/slices/gameSlice';

async function testHistoryConsolidation() {
    console.log('=== TESTING HISTORY CONSOLIDATION ===');

    // 1. Fill history with many entries
    console.log('Filling history...');
    for (let i = 0; i < 35; i++) {
        store.dispatch(addNarrativeHistory({
            id: `entry_${i}`,
            type: 'storylet',
            text: `Entry number ${i}`,
            title: i % 5 === 0 ? 'Major Event' : undefined
        }));
    }

    const stateBefore = store.getState();
    console.log('History length before:', stateBefore.game.narrativeHistory.length);

    // 2. Run consolidation
    processHistoryConsolidation(stateBefore, store.dispatch);

    const stateAfter = store.getState();
    console.log('History length after:', stateAfter.game.narrativeHistory.length);

    if (stateAfter.game.narrativeHistory.length <= 15) {
        console.log('✔ PASS: History consolidated.');
        console.log('Summary Entry:', stateAfter.game.narrativeHistory[0]);
    } else {
        console.error('✘ FAIL: History not consolidated! Length:', stateAfter.game.narrativeHistory.length);
    }
}

testHistoryConsolidation();
