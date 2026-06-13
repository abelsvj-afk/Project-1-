import lootTables from '../data/loot_tables.json';
import type { AppDispatch } from '../store';
import { changeWealth, addItem } from '../store/slices/playerSlice';
import { setGlobalFlag } from '../store/slices/gameSlice';
import { withDiagnostics } from './utils/diagnostics';

export interface LootResult {
    id: string;
    type: 'currency' | 'item' | 'junk';
    amount?: number;
    name: string;
}

/**
 * Procedural Loot Engine
 * Picks a random item from a table and dispatches the effects.
 */
const _triggerLootDrop = (tableName: string, dispatch: AppDispatch): LootResult | null => {
    const table = (lootTables.tables as any)[tableName];
    if (!table) return null;

    // Weight-based selection
    const totalWeight = table.reduce((acc: number, item: any) => acc + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedItem = table[0];
    for (const item of table) {
        if (random < item.weight) {
            selectedItem = item;
            break;
        }
        random -= item.weight;
    }

    const result: LootResult = {
        id: selectedItem.id,
        type: selectedItem.type,
        name: selectedItem.id.replace(/_/g, ' ').toUpperCase()
    };

    if (selectedItem.type === 'currency') {
        const amount = Math.floor(Math.random() * (selectedItem.amount[1] - selectedItem.amount[0] + 1)) + selectedItem.amount[0];
        result.amount = amount;
        dispatch(changeWealth(amount));
    } else if (selectedItem.type === 'item' || selectedItem.type === 'junk') {
        dispatch(addItem(selectedItem.id));
    }

    // Set a global flag for the UI/Storylet to acknowledge the loot
    dispatch(setGlobalFlag({ flag: 'last_loot_name', value: result.name }));
    dispatch(setGlobalFlag({ flag: 'last_loot_amount', value: result.amount || 0 }));
    
    return result;
};

export const triggerLootDrop = withDiagnostics(_triggerLootDrop, 'triggerLootDrop');
