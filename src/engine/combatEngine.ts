import type { AppDispatch } from '../store';
import { setBalance, setEquilibrium, addAffliction, removeAffliction } from '../store/slices/playerSlice';

/**
 * Combat Engine handles the real-time action economy (Balance/Equilibrium)
 * and the application/removal of afflictions.
 */
export class CombatEngine {
  private dispatch: AppDispatch;
  private timer: number | null = null;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  /**
   * Starts the combat tick timer (100ms interval).
   */
  start() {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.tick(), 100);
  }

  /**
   * Stops the combat tick timer.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    // This would ideally read the current state and decrement balance/equilibrium
    // However, since we are in a class, we need a way to access the latest state
    // In a React context, we might use a hook or pass the state.
    // For simplicity, we'll assume the dispatchers handle their own logic or we call them with a decrement.
  }

  /**
   * Processes an attack or action that consumes balance.
   */
  executePhysicalAction(costMs: number) {
    this.dispatch(setBalance(costMs));
    // Implementation would start a countdown in the state or local timer
  }

  /**
   * Processes a spell or mental action that consumes equilibrium.
   */
  executeMentalAction(costMs: number) {
    this.dispatch(setEquilibrium(costMs));
  }

  /**
   * Applies an affliction to the player.
   */
  inflict(afflictionId: string) {
    this.dispatch(addAffliction(afflictionId));
  }

  /**
   * Cures an affliction.
   */
  cure(afflictionId: string) {
    this.dispatch(removeAffliction(afflictionId));
  }
}
