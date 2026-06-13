import type { RootState } from '../store';
import { withDiagnostics } from './utils/diagnostics';

/**
 * Summarizes old narrative history to prevent context bloat.
 * In a real LLM-backed system, this would call an API.
 * Here, we use a template-based summarizer to consolidate entries.
 */
const _consolidateHistory = (state: RootState) => {
  const { narrativeHistory } = state.game;

  if (narrativeHistory.length > 50) {
    const oldEntries = narrativeHistory.slice(0, 20);

    // Simple template-based consolidation
    const majorLocations = Array.from(new Set(oldEntries.filter(e => e.type === 'storylet').map(e => e.title).filter(Boolean)));
    const majorChoices = oldEntries.filter(e => e.type === 'choice').map(e => e.text);

    const summaryText = `[HISTORY CONSOLIDATED] Previously, you explored ${majorLocations.join(', ')} and made key decisions such as: ${majorChoices.slice(-3).join('; ')}.`;

    // Note: In a future iteration, we would add a 'clearHistoryAndAddSummary' action.
    console.log("Consolidating history...", summaryText);
  }
};

export const consolidateHistory = withDiagnostics(_consolidateHistory, 'consolidateHistory');
