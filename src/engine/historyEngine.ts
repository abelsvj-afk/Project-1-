import type { AppDispatch, RootState } from '../store';
import { withDiagnostics } from './utils/diagnostics';
import { consolidateHistory } from '../store/slices/gameSlice';

/**
 * Summarizes old narrative history to prevent context bloat.
 */
const _processHistoryConsolidation = (state: RootState, dispatch: AppDispatch) => {
  const { narrativeHistory } = state.game;

  if (narrativeHistory.length > 30) {
    const oldEntries = narrativeHistory.slice(0, 15);

    // Template-based consolidation
    const majorLocations = Array.from(new Set(oldEntries.filter(e => e.type === 'storylet').map(e => e.title).filter(Boolean)));
    const majorChoices = oldEntries.filter(e => e.type === 'choice').map(e => e.text);

    const summaryText = `Previously, you explored ${majorLocations.join(', ')} and made key decisions such as: ${majorChoices.slice(-3).join('; ')}.`;

    dispatch(consolidateHistory(summaryText));
  }
};

export const processHistoryConsolidation = withDiagnostics(_processHistoryConsolidation, 'processHistoryConsolidation');
