import { filterStorylets, dealFromDeck, interpolate } from '../src/engine/narrativeEngine';
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
        npcs: {
            kaelen: {
                id: 'kaelen',
                simulatedState: { lastLocation: 'outpost_market' },
                disposition: 'friendly'
            }
        },
        globalFlags: { hub_action: 'socialize' },
        knowledgeFlags: [],
        knownNames: ['kaelen'],
        narrativeHistory: []
    } as any
};

async function testSocialDeck() {
    console.log('=== TESTING SOCIAL DECK VARIETY ===');

    const available = filterStorylets(storyletsData as Storylet[], mockState as RootState);
    const socialStorylets = available.filter(s => s.id.startsWith('social_'));

    console.log('Available Social storylets:', socialStorylets.map(s => s.id));

    if (socialStorylets.length >= 2) {
        console.log('✔ PASS: Found at least 2 unique social templates.');
    } else {
        console.error('✘ FAIL: Expected at least 2 unique social templates, found', socialStorylets.length);
    }

    console.log('=== TESTING NPC INJECTION ===');
    const selected = dealFromDeck(storyletsData as Storylet[], mockState as RootState);
    
    if (selected && (selected as any).activeNpcId) {
        console.log(`✔ PASS: dealFromDeck injected activeNpcId: ${(selected as any).activeNpcId}`);
        
        const interpolated = interpolate(selected.content, mockState as RootState, selected);
        console.log('Interpolated Content Snippet:', interpolated.substring(0, 100));
        
        if (interpolated.includes('Kaelen')) {
            console.log('✔ PASS: Interpolation correctly resolved Kaelen.');
        } else {
            console.error('✘ FAIL: Interpolation did not resolve Kaelen. Content:', interpolated);
        }
    } else {
        console.error('✘ FAIL: dealFromDeck did not inject activeNpcId or no storylet selected.');
    }
}

testSocialDeck();
