import { store } from '../src/store';
import { setIdentity, updateStats, setBlessedAbility } from '../src/store/slices/playerSlice';
import { revealKnowledge, setGlobalFlag } from '../src/store/slices/gameSlice';
import { filterStorylets, morphText, assembleProse } from '../src/engine/narrativeEngine';
import storyletsData from '../src/data/storylets.json';

async function runDiscoverySim() {
    console.log('=== HIDDEN SKILL DISCOVERY SIMULATION ===\n');

    // 1. Initial State: Unaware of skill
    console.log('[STEP 1] Setting up unaware character...');
    store.dispatch(setIdentity({
        name: 'Kael',
        appearance: {
            bodyType: 'average', musculature: 'lean', height: 'average',
            hairStyle: 'cropped', hairColor: 'dark', eyeColor: 'grey',
            eyeType: 'organic', skinTone: 'tan', scars: [], tattoos: [], facialFeatures: []
        },
        pronouns: { subject: 'he', object: 'him', possessive: 'his' },
        presence: { intimidating: 10, uncanny: 10, exotic: 10, normalized: 70 },
        presenceDescription: 'An average looking traveler.'
    }));
    store.dispatch(setBlessedAbility('Echo-Anchor Overload'));
    
    let text = assembleProse(store.getState(), "You sit by the fire.");
    console.log('UNREVEALED PROSE:', text);
    
    if (text.includes('a strange, dormant warmth in your marrow')) {
        console.log('✔ SUCCESS: Skill is correctly hidden in the prose.');
    } else {
        console.error('✘ FAILURE: Skill text revealed prematurely!');
    }

    // 2. Meet Prerequisites
    console.log('\n[STEP 2] Meeting discovery prerequisites (Knowledge + Sync)...');
    store.dispatch(revealKnowledge('spirit_merging'));
    store.dispatch(updateStats({ sync: 20 }));
    store.dispatch(setGlobalFlag({ flag: 'skill_discovery_imminent', value: true }));

    const available = filterStorylets(storyletsData as any, store.getState());
    const discoveryStorylet = available.find(s => s.id === 'discover_blessed_skill');

    if (discoveryStorylet) {
        console.log('✔ SUCCESS: Discovery storylet is now available.');
        
        // 3. Reveal Skill
        console.log('\n[STEP 3] Revealing the skill...');
        // In the real app, this happens when the player picks the choice
        // We'll manually dispatch the effect for sim
        const effect = discoveryStorylet.choices[0].effects;
        if ((effect as any).revealBlessedSkill) {
            const { revealBlessedSkill } = await import('../src/store/slices/playerSlice');
            store.dispatch(revealBlessedSkill());
        }

        text = assembleProse(store.getState(), "You stand tall.");
        console.log('REVEALED PROSE:', text);

        if (text.includes('Echo-Anchor Overload')) {
            console.log('✔ SUCCESS: Skill name is now dynamically injected into the prose.');
        } else {
            console.error('✘ FAILURE: Prose still hiding skill name after reveal!');
        }
    } else {
        console.error('✘ FAILURE: Discovery storylet not found despite meeting prerequisites!');
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

runDiscoverySim();
