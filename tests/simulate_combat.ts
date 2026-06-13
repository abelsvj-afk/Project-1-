import { store } from '../src/store';
import { processCombatTick, useCure, castSpell } from '../src/engine/combatEngine';
import { addAffliction, addItem, updateStats } from '../src/store/slices/playerSlice';

async function runCombatSim() {
    console.log('=== SYSTEMIC COMBAT SIMULATION (ACHAEA-STYLE) ===\n');

    // 1. Initial State: Max stats and inventory
    store.dispatch(updateStats({ vitality: 200, mentality: 150 }));
    store.dispatch(addItem('bloodroot'));
    store.dispatch(addItem('mending_salve'));
    store.dispatch(addItem('epidermal_salve'));
    
    console.log('✔ Initialized: 200 Vit, 150 Ment. Items: Bloodroot, Mending, Epidermal.');

    const logState = () => {
        const p = store.getState().player;
        console.log(`[STATUS] HP: ${p.stats.vitality} | Bal: ${p.balance} | Eq: ${p.equilibrium} | Affs: [${p.afflictions.join(', ')}]`);
    };

    // 2. ENEMY PHASE: Application of Afflictions
    console.log('\n--- ENEMY PHASE: Heavy Ambush ---');
    console.log('[SIM] Enemy hits with "Vector Crush" and "Biomorphic Frost"');
    store.dispatch(addAffliction('broken_limbs'));
    store.dispatch(addAffliction('paralysis'));
    store.dispatch(addAffliction('blindness'));
    logState();

    // 3. PLAYER PHASE: Action Economy Logic
    console.log('\n--- PLAYER PHASE: The Cure Matrix ---');
    
    // T1: Attempt to use Bloodroot (Ingestion -> Equilibrium)
    console.log('\n[PLAYER] Attempting to use Bloodroot to cure Paralysis...');
    useCure('bloodroot', store.getState(), store.dispatch);
    logState();

    // T2: Tick Combat (Simulating 100ms passing)
    console.log('\n[SIM] Ticking Combat (Simulating 500ms recovery)...');
    for(let i=0; i<5; i++) processCombatTick(store.getState(), store.dispatch);
    logState();

    // T3: Attempt to use Mending Salve while Paralysis/Balance is high
    // (Topical -> Balance)
    console.log('\n[PLAYER] Attempting to use Mending Salve (Physical Balance Check)...');
    const mendingSuccess = useCure('mending_salve', store.getState(), store.dispatch);
    if (!mendingSuccess) console.log('✔ FAILED as expected (Still off-balance or paralyzed logic)');
    
    // T4: Attempt to cast a spell while off-equilibrium
    console.log('\n[PLAYER] Attempting to cast "Thermal Flare" while off-equilibrium...');
    const castSuccess = castSpell('thermal_flare', store.getState(), store.dispatch);
    if (!castSuccess) console.log('✔ FAILED as expected (Lack of Equilibrium)');

    // T5: Recovery Cycle
    console.log('\n--- RECOVERY CYCLE ---');
    console.log('[SIM] Ticking until Balance/Equilibrium recovered...');
    for(let i=0; i<20; i++) processCombatTick(store.getState(), store.dispatch);
    logState();

    // T6: Final Clean-up
    console.log('\n[PLAYER] Final attempt to clear remaining afflictions...');
    useCure('mending_salve', store.getState(), store.dispatch);
    useCure('epidermal_salve', store.getState(), store.dispatch);
    logState();

    console.log('\n=== SIMULATION COMPLETE ===');
}

runCombatSim();
