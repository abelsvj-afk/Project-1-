import type { NPC } from '../types/game';
import { withDiagnostics } from './utils/diagnostics';
import type { AppDispatch } from '../store';
import { addNPC } from '../store/slices/gameSlice';

const FIRST_NAMES = ["Joran", "Elris", "Merrick", "Lyra", "Tess", "Cade", "Orik", "Vesper", "Sila", "Brant"];
const LAST_NAMES = ["of the Warrens", "Iron-Hand", "Rust-Lung", "the Quick", "Ash-Born", "the Quiet", "Gear-Head"];
const JOBS = ["Scavenger", "Guard", "Merchant", "Tinkerer", "Vagrant", "Adept-Initiate"];

const BACKSTORIES = [
    "Grew up in the dust flats. Lost a sibling to a static-storm and now refuses to leave the safety of the Outpost.",
    "A former Syndicate grunt who deserted after realizing the true nature of the Harvest. Now tries to blend in.",
    "An ambitious tinkerer hoping to find a pristine Aetherian relic and buy their way into the Adept Spires.",
    "A cynical survivor who trusts no one. They've seen too many 'heroes' get consumed by their own resonance.",
    "They claim to hear the 'hum' of the world. Most people think they're crazy, but their survival instincts are uncanny."
];

/**
 * Procedurally generates a Fable-style generic NPC.
 */
const _generateGenericNPC = (locationId: string): NPC => {
    const id = `npc_gen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const title = JOBS[Math.floor(Math.random() * JOBS.length)];
    
    // Assign generic faction based on job
    let factionId = 'neutral';
    if (title === 'Guard') factionId = 'syndicate';
    if (title === 'Scavenger' || title === 'Tinkerer') factionId = 'scavengers';
    if (title === 'Adept-Initiate') factionId = 'adepts';

    return {
        id,
        name: `${firstName} ${lastName}`,
        title,
        level: Math.floor(Math.random() * 5) + 1, // Levels 1-5
        statusTier: 1, // Always grunt-tier
        factionId,
        backstory: BACKSTORIES[Math.floor(Math.random() * BACKSTORIES.length)],
        isGenerated: true,
        stats: {
            vessel: 10,
            logic: 10,
            finesse: 10,
            resonance: 10,
            vitality: 100,
            mentality: 100
        },
        affinities: [],
        inventory: [],
        personality: {
            archetype: Math.random() > 0.5 ? 'pragmatist' : 'coward',
            braveryThreshold: Math.floor(Math.random() * 40) + 10, // 10-50
            tone: "cautious and weary",
            vocabulary: ["shards", "dust", "survive", "Watch"],
            visualTells: ["glancing around nervously", "kicking the dirt"]
        },
        schedule: [
            { timeStart: 0, timeEnd: 2400, location: locationId, activity: 'wander' }
        ],
        simulatedState: {
            currentAction: 'wander',
            goal: 'wander',
            lastLocation: locationId,
            isDead: false,
            isHired: false
        }
    };
};

export const generateGenericNPC = withDiagnostics(_generateGenericNPC, 'generateGenericNPC');

/**
 * Populates a location with a set number of generic NPCs if it's empty.
 */
const _populateLocation = (locationId: string, currentNPCs: { [key: string]: NPC }, dispatch: AppDispatch, count: number = 3) => {
    // Check how many generic NPCs are already here
    const localGenerics = Object.values(currentNPCs).filter(n => n.isGenerated && n.simulatedState.lastLocation === locationId);
    
    if (localGenerics.length < count) {
        const needed = count - localGenerics.length;
        for (let i = 0; i < needed; i++) {
            const newNPC = generateGenericNPC(locationId);
            dispatch(addNPC(newNPC));
        }
    }
};

export const populateLocation = withDiagnostics(_populateLocation, 'populateLocation');
