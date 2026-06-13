import { dealFromDeck } from '../src/engine/narrativeEngine';
import type { Storylet } from '../src/types/game';
import type { RootState } from '../src/store';

// Mock Storylets
const mockStorylets: Storylet[] = [
    {
        id: 'plot_critical',
        title: 'Main Plot',
        content: 'Critical plot event.',
        priority: 100,
        repeatable: false,
        prerequisites: {}
    },
    {
        id: 'npc_encounter',
        title: 'NPC Event',
        content: 'Meeting an NPC.',
        priority: 50,
        repeatable: true,
        prerequisites: { requiredNpc: 'kaelen' } as any
    },
    {
        id: 'repeatable_scavenge',
        title: 'Scavenge',
        content: 'Finding junk.',
        priority: 10,
        repeatable: true,
        prerequisites: {}
    }
];

// Mock State
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
                simulatedState: { lastLocation: 'borderlands_warrens' }
            }
        },
        globalFlags: {},
        knowledgeFlags: [],
        narrativeHistory: []
    } as any
};

console.log('=== TESTING DEAL FROM DECK ===');

try {
    // 1. Plot Storylet should win
    console.log('Test 1: Plot Priority');
    const result1 = dealFromDeck(mockStorylets, mockState as RootState);
    if (result1 && result1.id === 'plot_critical') {
        console.log('✔ PASS: Plot storylet selected.');
    } else {
        console.error('✘ FAIL: Expected plot_critical, got', result1?.id);
    }

    // 2. Repetition Protection
    console.log('\nTest 2: Repetition Protection');
    const stateWithSeen = {
        ...mockState,
        game: { ...mockState.game, seenStorylets: ['plot_critical'] }
    };
    const result2 = dealFromDeck(mockStorylets, stateWithSeen as RootState);
    if (result2 && result2.id === 'npc_encounter') {
        console.log('✔ PASS: NPC encounter selected after plot seen.');
    } else {
        console.error('✘ FAIL: Expected npc_encounter, got', result2?.id);
    }

    // 3. NPC Presence Check
    console.log('\nTest 3: NPC Presence Check');
    const stateWithNPCGone = {
        ...stateWithSeen,
        game: {
            ...stateWithSeen.game,
            npcs: {
                kaelen: {
                    id: 'kaelen',
                    simulatedState: { lastLocation: 'elsewhere' }
                }
            }
        }
    };
    const result3 = dealFromDeck(mockStorylets, stateWithNPCGone as RootState);
    if (result3 && result3.id === 'repeatable_scavenge') {
        console.log('✔ PASS: Scavenge selected when NPC is gone.');
    } else {
        console.error('✘ FAIL: Expected repeatable_scavenge, got', result3?.id);
    }

} catch (e) {
    console.error('✘ CRASH during test:', e);
}
