import { store } from '../src/store';
import { hireEmployee, promoteEmployee, fireEmployee } from '../src/store/slices/gameSlice';
import { changeWealth } from '../src/store/slices/playerSlice';
import { processEconomicTick, employeeDailyIncome } from '../src/engine/economicEngine';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

const dispatch = (a: any) => store.dispatch(a);
const wealth = () => store.getState().player.wealth;
const runTicks = (n: number) => { for (let i = 0; i < n; i++) processEconomicTick(store.getState(), dispatch); };

function run() {
  console.log('=== EMPLOYMENT / PASSIVE INCOME SIMULATION ===\n');

  // Baseline: no employees, no property → wealth flat over a day.
  store.dispatch(changeWealth(1000 - wealth())); // normalize to 1000
  const before = wealth();
  runTicks(720);
  assert(wealth() === before, `no workforce → no passive income (stayed ${wealth()})`);

  // Hire a scavenger (60/day at tier 1).
  store.dispatch(hireEmployee({ npcId: 'kaelen', role: 'scavenger' }));
  assert(employeeDailyIncome('scavenger', 1) === 60, 'scavenger earns 60/day at tier 1');

  const w1 = wealth();
  runTicks(720); // ~one game-day
  const earnedDay1 = wealth() - w1;
  console.log(`one day, 1 scavenger T1: +${earnedDay1}`);
  assert(earnedDay1 >= 58 && earnedDay1 <= 62, 'a day of work pays ≈60 shards (accrual buffer works)');

  // Promote to tier 2 → income scales.
  store.dispatch(promoteEmployee('kaelen'));
  assert(store.getState().game.employees[0].tier === 2, 'promotion raises tier to 2');
  assert(employeeDailyIncome('scavenger', 2) === 120, 'tier 2 scavenger earns 120/day');

  const w2 = wealth();
  runTicks(720);
  const earnedDay2 = wealth() - w2;
  console.log(`one day, 1 scavenger T2: +${earnedDay2}`);
  assert(earnedDay2 >= 118 && earnedDay2 <= 122, 'promoted worker pays ≈120/day');

  // Fire → income stops.
  store.dispatch(fireEmployee('kaelen'));
  assert(store.getState().game.employees.length === 0, 'fired employee removed from payroll');
  const w3 = wealth();
  runTicks(720);
  assert(wealth() === w3, 'no income after firing');

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
