import { store } from '../src/store';
import { simulateWorldTurn } from '../src/engine/worldSimulationEngine';
import { incrementTime } from '../src/store/slices/gameSlice';
import { changeWealth, changeMenace } from '../src/store/slices/playerSlice';

async function runHierarchySim() {
    console.log('=== NPC HIERARCHY & SCHEDULE SIMULATION ===\n');

    const runTurns = (count: number) => {
        for (let i = 1; i <= count; i++) {
            const state = store.getState();
            const timeStr = `${Math.floor(state.game.gameTime / 100)}:${(state.game.gameTime % 100).toString().padStart(2, '0')}`;
            
            console.log(`[Turn ${i}] Time: ${timeStr}`);
            simulateWorldTurn(state, store.dispatch);
            store.dispatch(incrementTime(100)); // Advance 1 hour per turn for sim speed
        }
    };

    console.log('--- PHASE 1: Baseline Schedules (Turns 1-10) ---');
    runTurns(10);

    console.log('\n--- PHASE 2: High Player Wealth Override (Elite Hunting) ---');
    console.log('[SIM] Setting Player Wealth to 2000');
    store.dispatch(changeWealth(1900)); // Start was 100
    runTurns(5);

    console.log('\n--- PHASE 3: High Player Menace Override ---');
    console.log('[SIM] Setting Syndicate Menace to 80');
    store.dispatch(changeMenace({ faction: 'syndicate', amount: 80 }));
    runTurns(5);

    console.log('\n=== SIMULATION COMPLETE ===');
    const finalState = store.getState();
    Object.entries(finalState.game.npcs).forEach(([id, data]) => {
        console.log(`NPC: ${id} | Final Location: ${data.simulatedState.lastLocation} | Goal: ${data.simulatedState.goal}`);
    });
}

runHierarchySim();
