import { store } from './src/store';
import { 
  setLocation, 
  changeWealth, 
  setIdentity, 
  gainExperience 
} from './src/store/slices/playerSlice';
import { 
  setLastChoiceId, 
  addNarrativeHistory, 
  markStoryletSeen,
  setGlobalFlag,
  revealKnowledge,
  revealName
} from './src/store/slices/gameSlice';
import { filterStorylets, morphText } from './src/engine/narrativeEngine';
import storyletsData from './src/data/storylets.json';
import type { Storylet, Choice } from './src/types/game';

const storylets = storyletsData as Storylet[];

async function runAutoSim(maxTurns: number = 20) {
    console.log('=== ADVANCED NARRATIVE SIMULATION START ===\n');

    // Initial State Setup
    store.dispatch(setIdentity({
        name: 'Elara',
        appearance: {
            bodyType: 'lean',
            musculature: 'athletic',
            height: 'tall',
            hairStyle: 'braided',
            hairColor: 'silver',
            eyeColor: 'amber',
            eyeType: 'organic',
            skinTone: 'olive',
            scars: [],
            tattoos: [],
            facialFeatures: []
        },
        pronouns: { subject: 'she', object: 'her', possessive: 'her' },
        presence: { intimidating: 20, uncanny: 10, exotic: 40, normalized: 30 },
        presenceDescription: 'A tall, silver-haired stranger with a steady amber gaze.'
    }));

    for (let turn = 1; turn <= maxTurns; turn++) {
        const state = store.getState();
        const available = filterStorylets(storylets, state);

        if (available.length === 0) {
            console.log(`[Turn ${turn}] No storylets available. Ending simulation.`);
            break;
        }

        const active = available[0];
        console.log(`[Turn ${turn}] STORYLET: ${active.title} (ID: ${active.id})`);
        
        // Log the text
        const morphed = morphText(active.content, state);
        console.log(`PROSE: ${morphed.substring(0, 150)}...`);

        // Record it
        store.dispatch(markStoryletSeen(active.id));
        store.dispatch(addNarrativeHistory({
            id: active.id,
            type: 'storylet',
            text: morphed,
            title: active.title
        }));

        // Pick a choice (Priority: Next Storylet Trigger > Gain XP > Random)
        // For simulation, let's pick the first choice but simulate different paths based on turn count or random
        let choiceIndex = 0;
        if (active.choices.length > 1) {
            // Favor paths that move locations or have specific flags
            choiceIndex = active.choices.findIndex(c => c.effects.moveToLocation) || 0;
            if (choiceIndex === -1) choiceIndex = 0;
        }
        
        const choice = active.choices[choiceIndex];
        console.log(`CHOICE: ${choice.text}`);

        // Apply Effects
        store.dispatch(addNarrativeHistory({ id: choice.id, type: 'choice', text: choice.text }));
        store.dispatch(setLastChoiceId(choice.id));

        const e = choice.effects;
        if (e.moveToLocation) store.dispatch(setLocation(e.moveToLocation));
        if (e.wealthChange) store.dispatch(changeWealth(e.wealthChange));
        if (e.experienceGain) store.dispatch(gainExperience(e.experienceGain));
        if (e.setGlobalFlags) {
            Object.entries(e.setGlobalFlags).forEach(([f, v]) => store.dispatch(setGlobalFlag({ flag: f, value: v })));
        }
        if (e.revealKnowledge) e.revealKnowledge.forEach(k => store.dispatch(revealKnowledge(k)));
        if (e.revealNames) e.revealNames.forEach(n => store.dispatch(revealName(n)));

        console.log('--------------------------------------------\n');
        
        // Minor Delay simulation if needed, but here we just loop
    }

    console.log('=== SIMULATION COMPLETE ===');
    const finalState = store.getState();
    console.log('Final Location:', finalState.player.location);
    console.log('Final Wealth:', finalState.player.wealth);
    console.log('Flags:', JSON.stringify(finalState.game.globalFlags));
}

runAutoSim();
