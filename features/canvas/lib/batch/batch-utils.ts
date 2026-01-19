import { Edge } from "@xyflow/react";

type DependencyGraph = Map<string, Set<string>>; // nodeId -> Set of dependencies
type InDegreeMap = Map<string, number>; // nodeId -> count of dependencies

interface TopoSortResult {
  order: string[];
  hasCycle: boolean;
}

export function buildDependencyGraph(
  nodeIds: string[],
  edges: Edge[]
): { deps: DependencyGraph; inDegree: InDegreeMap } {
  const selected = new Set(nodeIds);
  const deps: DependencyGraph = new Map();
  const inDegree: InDegreeMap = new Map();

  // Initialize empty dependencies for all selected nodes
  for (const id of nodeIds) {
    deps.set(id, new Set());
    inDegree.set(id, 0);
  }

  // Build dependencies only among selected nodes
  for (const e of edges) {
    const source = e.source;
    const target = e.target;
    if (!source || !target) continue;
    if (!selected.has(source) || !selected.has(target)) continue;
    deps.get(target)!.add(source);
  }

  // Compute in-degree (count of dependencies for each node)
  for (const [n, ds] of deps) {
    inDegree.set(n, ds.size);
  }

  return { deps, inDegree };
}

export function topologicalSort(
  deps: DependencyGraph,
  inDegree: InDegreeMap
): TopoSortResult {
  const queue: string[] = [];
  const order: string[] = [];

  // Find all nodes with no dependencies (in-degree = 0)
  for (const [n, d] of inDegree) {
    if (d === 0) queue.push(n);
  }

  // Kahn's algorithm
  while (queue.length) {
    const n = queue.shift()!;
    order.push(n);

    // For every node that depends on n, remove n from its dependencies
    for (const [m, ds] of deps) {
      if (ds.has(n)) {
        ds.delete(n);
        const d = inDegree.get(m)! - 1;
        inDegree.set(m, d);
        if (d === 0) queue.push(m);
      }
    }
  }

  // Cycle detection: if not all nodes were processed, there's a cycle
  const hasCycle = order.length !== inDegree.size;

  return { order, hasCycle };
}

// Group selected nodes into disconnected workflows (connected components)
export function getWorkflows(nodeIds: string[], edges: Edge[]): string[][] {
  const selected = new Set(nodeIds);
  const adj = new Map<string, Set<string>>();

  // Init adjacency for selected nodes
  for (const id of nodeIds) adj.set(id, new Set());

  // Build undirected adjacency among selected nodes
  for (const e of edges) {
    const s = e.source;
    const t = e.target;
    if (!s || !t) continue;
    if (selected.has(s) && selected.has(t)) {
      adj.get(s)!.add(t);
      adj.get(t)!.add(s);
    }
  }

  const seen = new Set<string>();
  const groups: string[][] = [];

  for (const id of nodeIds) {
    if (seen.has(id)) continue;
    const q: string[] = [id];
    const comp: string[] = [];
    seen.add(id);
    while (q.length) {
      const n = q.shift()!;
      comp.push(n);
      for (const m of adj.get(n) || []) {
        if (!seen.has(m)) {
          seen.add(m);
          q.push(m);
        }
      }
    }
    groups.push(comp);
  }

  return groups;
}
