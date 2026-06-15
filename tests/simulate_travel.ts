import { store } from '../src/store';
import { setLocation } from '../src/store/slices/playerSlice';
import { visitNode } from '../src/store/slices/gameSlice';
import worldMap from '../src/data/world_map.json';
import storylets from '../src/data/storylets.json';
import type { Storylet } from '../src/types/game';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

const nodes = (worldMap as any).nodes as { id: string; connections: string[] }[];
const nodeIds = new Set(nodes.map(n => n.id));
const adj: { [id: string]: string[] } = Object.fromEntries(nodes.map(n => [n.id, n.connections]));

function reachableFrom(start: string): Set<string> {
  const seen = new Set<string>([start]);
  const q = [start];
  while (q.length) {
    const cur = q.shift()!;
    for (const next of adj[cur] ?? []) {
      if (!seen.has(next)) { seen.add(next); q.push(next); }
    }
  }
  return seen;
}

function run() {
  console.log('=== TRAVEL / MAP REACHABILITY SIMULATION ===\n');

  const START = 'static_crater';
  const reachable = reachableFrom(START);
  console.log(`Reachable from ${START}: ${[...reachable].join(', ')}\n`);

  // 1. Every map node is reachable from the start (no orphaned islands).
  for (const n of nodes) {
    assert(reachable.has(n.id), `node "${n.id}" is reachable from the crater`);
  }

  // 2. Connections are symmetric enough to backtrack (every connection target exists).
  for (const n of nodes) {
    for (const c of n.connections) {
      assert(nodeIds.has(c), `"${n.id}" connects to a real node "${c}"`);
    }
  }

  // 3. Every storylet location prereq points at a REAL, reachable node
  //    (guards against region-id-vs-node-id mistakes like the_low_wastes).
  const locGated = (storylets as Storylet[]).filter(s => s.prerequisites.location);
  for (const s of locGated) {
    const loc = s.prerequisites.location!;
    assert(nodeIds.has(loc), `storylet "${s.id}" location "${loc}" is a real map node`);
    assert(reachable.has(loc), `storylet "${s.id}" location "${loc}" is reachable from start`);
  }

  // 4. Live travel through the store updates location + fog-of-war.
  const path = ['dust_flats', 'borderlands_outpost', 'borderlands_warrens'];
  let prev = START;
  for (const hop of path) {
    assert((adj[prev] ?? []).includes(hop), `can travel ${prev} -> ${hop} (connected)`);
    store.dispatch(setLocation(hop));
    store.dispatch(visitNode(hop));
    prev = hop;
  }
  const visited = store.getState().game.visitedNodes;
  assert(path.every(p => visited.includes(p)), 'all hopped nodes recorded as visited');
  assert(store.getState().player.location === 'borderlands_warrens', 'player ends at the Warrens');

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
