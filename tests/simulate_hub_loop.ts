import { dealFromDeck } from '../src/engine/narrativeEngine';
import storyletsData from '../src/data/storylets.json';
import type { Storylet } from '../src/types/game';
import type { RootState } from '../src/store';

const mockState: Partial<RootState> = {
    player: {
        location: 'outpost_market',
        alignment: 0,
        purity: 0,
        wealth: 100,
        inventory: [],
        stats: { prowess: 10, logic: 10, finesse: 10, sync: 10, vitality: 100, mentality: 100 },
        companions: [],
        isBlessedSkillRevealed: true,
        name: 'Test',
        pronouns: { subject: 'they', object: 'them', possessive: 'their' },
        appearance: {
            bodyType: 'average', musculature: 'lean', height: 'average',
            hairStyle: 'cropped', hairColor: 'dark', eyeColor: 'grey',
            eyeType: 'organic', skinTone: 'tan', scars: [], tattoos: [], facialFeatures: []
        },
        history: { majorChoices: [], factionInfluence: {}, factionMenace: {} }
    } as any,
    game: {
        seenStorylets: [],
        npcs: {
            kaelen: {
                id: 'kaelen',
                simulatedState: { lastLocation: 'outpost_market' },
                disposition: 'friendly'
            },
            thorne_merchant: {
                id: 'thorne_merchant',
                simulatedState: { lastLocation: 'outpost_market' },
                disposition: 'neutral'
            }
        },
        globalFlags: { hub_action: 'none' },
        knowledgeFlags: [],
        knownNames: ['kaelen', 'thorne_merchant'],
        narrativeHistory: []
    } as any
};

async function simulateHubLoop() {
    console.log('=== SIMULATING EMERGENT HUB LOOP (50 ITERATIONS) ===\n');
    
    let state = { ...mockState } as RootState;
    const stats = {
        scavenge: 0,
        socialize: 0,
        encounters: {} as Record<string, number>,
        stalls: 0
    };

    for (let i = 1; i <= 50; i++) {
        // 1. Randomly pick an action
        const action = Math.random() < 0.5 ? 'scavenge' : 'socialize';
        state.game.globalFlags.hub_action = action;
        if (action === 'scavenge') stats.scavenge++;
        else stats.socialize++;

        // 2. Deal from deck
        const selected = dealFromDeck(storyletsData as Storylet[], state);

        if (!selected) {
            console.error(`[Iter ${i}] ✘ STALL: No storylet available for action: ${action}`);
            stats.stalls++;
        } else {
            stats.encounters[selected.id] = (stats.encounters[selected.id] || 0) + 1;
            
            // 3. Verify action match (if not a high-priority event)
            if (selected.priority < 50) {
                 const pre = selected.prerequisites.globalFlags;
                 if (pre && pre.hub_action && pre.hub_action !== action) {
                     console.warn(`[Iter ${i}] ⚠ MISMATCH: Expected ${action}, got ${selected.id} (Prereq: ${pre.hub_action})`);
                 }
            }

            // 4. Simulate choice (Reset action)
            state.game.globalFlags.hub_action = 'none';
            state.game.seenStorylets = [...state.game.seenStorylets, selected.id];
            
            // If it's a social encounter, it might have injected an NPC
            const activeNpc = (selected as any).activeNpcId;
            const npcText = activeNpc ? ` (NPC: ${activeNpc})` : '';

            if (i % 10 === 0) {
                console.log(`[Iter ${i}] Decided to ${action} -> Encountered: ${selected.id}${npcText}`);
            }
        }
    }

    console.log('\n--- Simulation Statistics ---');
    console.log(`Total Iterations: 50`);
    console.log(`Scavenge Actions: ${stats.scavenge}`);
    console.log(`Socialize Actions: ${stats.socialize}`);
    console.log(`Total Stalls: ${stats.stalls}`);
    console.log(`Unique Encounters: ${Object.keys(stats.encounters).length}`);
    
    console.log('\nEncounter Frequency:');
    Object.entries(stats.encounters)
        .sort((a, b) => b[1] - a[1])
        .forEach(([id, count]) => console.log(` - ${id}: ${count}`));

    if (stats.stalls === 0 && Object.keys(stats.encounters).length >= 5) {
        console.log('\n✔ PASS: Hub loop is robust and varied.');
    } else {
        console.error('\n✘ FAIL: Hub loop lacks variety or encountered stalls.');
    }
}

simulateHubLoop();
