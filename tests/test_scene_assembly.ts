import { assembleProse } from '../src/engine/narrativeEngine';
import type { RootState } from '../src/store';

const mockState: Partial<RootState> = {
    player: {
        location: 'borderlands_warrens',
        alignment: 0,
        purity: 0,
        wealth: 100,
        inventory: [],
        stats: { prowess: 10, logic: 10, finesse: 10, sync: 10, vitality: 100, mentality: 100 },
        companions: [],
        isBlessedSkillRevealed: false,
        name: 'Test',
        pronouns: { subject: 'they', object: 'them', possessive: 'their' },
        appearance: {
            bodyType: 'average', musculature: 'lean', height: 'average',
            hairStyle: 'cropped', hairColor: 'dark', eyeColor: 'grey',
            eyeType: 'organic', skinTone: 'tan', scars: [], tattoos: [], facialFeatures: []
        },
        level: 1,
        experience: 0,
        skillPoints: 0,
        afflictions: [],
        balance: 100,
        equilibrium: 100,
        history: { majorChoices: [], factionInfluence: {}, factionMenace: {} }
    } as any,
    game: {
        seenStorylets: [],
        npcs: {
            kaelen: {
                id: 'kaelen',
                simulatedState: { lastLocation: 'borderlands_warrens' },
                disposition: 'friendly'
            },
            vane: {
                id: 'vane',
                simulatedState: { lastLocation: 'elsewhere' },
                disposition: 'neutral'
            }
        },
        globalFlags: {},
        knowledgeFlags: [],
        narrativeHistory: []
    } as any
};

console.log('=== TESTING SCENE ASSEMBLY WITH NPC PRESENCE ===');

try {
    // 1. Kaelen is present
    console.log('Test 1: NPC Present');
    const prose1 = assembleProse(mockState as RootState, 'Base text.');
    console.log('Prose:', prose1);
    
    // Note: assembleProse uses actorFragments from fragments.json
    // Kaelen's fragments should contain "scavenger" or "Kaelen"
    if (prose1.toLowerCase().includes('scavenger') || prose1.toLowerCase().includes('kaelen')) {
        console.log('✔ PASS: Present NPC included in prose.');
    } else {
        console.error('✘ FAIL: Present NPC (Kaelen) missing from prose!');
    }

    // 2. Vane is NOT present
    console.log('\nTest 2: NPC Absent');
    if (!prose1.toLowerCase().includes('vane') && !prose1.toLowerCase().includes('overseer')) {
        console.log('✔ PASS: Absent NPC excluded from prose.');
    } else {
        console.error('✘ FAIL: Absent NPC (Vane) included in prose!');
    }

} catch (e) {
    console.error('✘ CRASH during test:', e);
}
