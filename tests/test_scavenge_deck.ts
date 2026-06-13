import { filterStorylets } from '../src/engine/narrativeEngine';
import type { RootState } from '../src/store';
import storyletsData from '../src/data/storylets.json';
import type { Storylet } from '../src/types/game';

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
        npcs: {},
        globalFlags: { hub_action: 'scavenge' },
        knowledgeFlags: [],
        narrativeHistory: []
    } as any
};

async function testScavengeDeck() {
    console.log('=== TESTING SCAVENGE DECK VARIETY ===');

    const available = filterStorylets(storyletsData as Storylet[], mockState as RootState);
    const scavengeStorylets = available.filter(s => s.id.startsWith('scavenge_') || s.id === 'outcome_hub_scavenge');

    console.log('Available Scavenge storylets:', scavengeStorylets.map(s => s.id));

    if (scavengeStorylets.length >= 3) {
        console.log('✔ PASS: Found at least 3 unique scavenge storylets.');
    } else {
        console.error('✘ FAIL: Expected at least 3 unique scavenge storylets, found', scavengeStorylets.length);
    }
}

testScavengeDeck();
