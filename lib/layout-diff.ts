import type { DisplayNode } from "@/lib/display-node";
import { newDisplayId, nodeMatchKey } from "@/lib/node-identity";
import type { ComponentNode, Layout } from "@/lib/tools";

export type LayoutDiffResult = {
  next: DisplayNode[];
};

function matchScore(oldNode: ComponentNode, newNode: ComponentNode, oldIndex: number, newIndex: number): number {
  if (oldNode.type !== newNode.type) return 0;
  let score = 40;
  if (oldIndex === newIndex) score += 15;
  if (nodeMatchKey(oldNode, oldIndex) === nodeMatchKey(newNode, newIndex)) score += 35;
  return score;
}

const MATCH_THRESHOLD = 55;

/**
 * Pair old display nodes with incoming layout nodes. Unmatched old → removing,
 * matched → transitioning, unmatched new → entering.
 *
 * With `stream: true`, matched nodes whose content changed stay "stable"
 * instead of "transitioning" — stream ticks arrive every ~120ms and replaying
 * the transition animation on each one causes visible flicker while a node
 * (e.g. an article body) is still being written.
 *
 * With `progressive: true` (used while the reply is still streaming), the new
 * page overwrites the old one top-down like a build head sweeping the canvas:
 * old nodes the stream has not reached yet are kept below as dimmed "stale"
 * content, and only the ones actually overtaken are removed. Each removal is
 * therefore triggered by real model output, never by a speculative wipe.
 */
export function applyLayoutDiff(
  current: DisplayNode[],
  target: Layout,
  options?: { stream?: boolean; progressive?: boolean },
): LayoutDiffResult {
  const active = current.filter((n) => n.visualState !== "removing");
  const targetNodes = target.nodes;

  const pairs: { oldIdx: number; newIdx: number; score: number }[] = [];
  for (let oi = 0; oi < active.length; oi++) {
    for (let ni = 0; ni < targetNodes.length; ni++) {
      const score = matchScore(active[oi].node, targetNodes[ni], oi, ni);
      if (score >= MATCH_THRESHOLD) pairs.push({ oldIdx: oi, newIdx: ni, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const usedOld = new Set<number>();
  const usedNew = new Set<number>();
  const oldToNew = new Map<number, number>();

  for (const p of pairs) {
    if (usedOld.has(p.oldIdx) || usedNew.has(p.newIdx)) continue;
    usedOld.add(p.oldIdx);
    usedNew.add(p.newIdx);
    oldToNew.set(p.oldIdx, p.newIdx);
  }

  const ordered: DisplayNode[] = [];

  for (let ni = 0; ni < targetNodes.length; ni++) {
    const targetNode = targetNodes[ni];
    const oldIdx = [...oldToNew.entries()].find(([, v]) => v === ni)?.[0];

    if (oldIdx !== undefined) {
      const old = active[oldIdx];
      const same = options?.stream || JSON.stringify(old.node) === JSON.stringify(targetNode);
      ordered.push({
        ...old,
        node: targetNode,
        matchKey: nodeMatchKey(targetNode, ni),
        visualState: same ? "stable" : "transitioning",
      });
    } else {
      const matchKey = nodeMatchKey(targetNode, ni);
      ordered.push({
        id: newDisplayId(matchKey),
        matchKey,
        node: targetNode,
        visualState: "entering",
      });
    }
  }

  for (let oi = 0; oi < active.length; oi++) {
    if (usedOld.has(oi)) continue;
    if (options?.progressive && oi >= targetNodes.length) {
      // The stream hasn't reached this depth yet — keep it, visibly on its way out.
      ordered.push({ ...active[oi], visualState: "stale" });
    } else {
      ordered.push({ ...active[oi], visualState: "removing" });
    }
  }

  return { next: ordered };
}

/** Mark the display node at index as removing (adaptive pre-payload teardown). */
export function markIndexRemoving(nodes: DisplayNode[], index: number): DisplayNode[] {
  if (index < 0 || index >= nodes.length) return nodes;
  if (nodes[index].visualState === "removing") return nodes;
  return nodes.map((n, i) => (i === index ? { ...n, visualState: "removing" as const } : n));
}

/** Drop nodes flagged for removal. */
export function purgeRemoved(nodes: DisplayNode[]): DisplayNode[] {
  return nodes.filter((n) => n.visualState !== "removing");
}

/** Settle transitioning/entering nodes to stable after paint. */
export function settleVisualStates(nodes: DisplayNode[]): DisplayNode[] {
  return nodes.map((n) =>
    n.visualState === "transitioning" || n.visualState === "entering"
      ? { ...n, visualState: "stable" as const }
      : n,
  );
}

export function displayNodesFromLayout(layout: Layout): DisplayNode[] {
  return layout.nodes.map((node, i) => {
    const matchKey = nodeMatchKey(node, i);
    return { id: newDisplayId(matchKey), matchKey, node, visualState: "stable" as const };
  });
}
