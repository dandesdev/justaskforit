"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { layoutFromDisplayNodes } from "@/lib/display-node";
import { applyLayoutDiff, displayNodesFromLayout, settleVisualStates } from "@/lib/layout-diff";
import { extractCompletedLayout, findStreamingLayout } from "@/lib/layout-stream";
import { INITIAL_LAYOUT } from "@/lib/initial-layout";
import { timingCancel, timingMarkAsk, timingMarkComplete, timingMarkFirstPayload } from "@/lib/timing";
import type { Layout, ThemeProps } from "@/lib/tools";

const DIFF_THROTTLE_MS = 120;
const REMOVAL_ANIM_MS = 340;
const REMOVAL_STAGGER_MS = 90;
const ENTER_SETTLE_MS = 460;

/** waiting = ask sent, nothing from the model yet · streaming = page arriving live */
export type CanvasBuildPhase = "idle" | "waiting" | "streaming";

export function useCanvasOrchestrator(messages: UIMessage[], isBusy: boolean) {
  const [displayNodes, setDisplayNodes] = useState(() => displayNodesFromLayout(INITIAL_LAYOUT));
  const [theme, setTheme] = useState<ThemeProps | undefined>(INITIAL_LAYOUT.theme);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [phase, setPhase] = useState<CanvasBuildPhase>("idle");

  const snapshotRef = useRef<Layout | null>(null);
  const purgeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const streamKeyRef = useRef<string | null>(null);
  const streamNodeCountRef = useRef(0);
  const lastDiffRef = useRef(0);
  const turnOpenRef = useRef(false);
  const gotApiPayloadRef = useRef(false);
  const wasBusyRef = useRef(false);
  const displayNodesRef = useRef(displayNodes);
  displayNodesRef.current = displayNodes;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  /** Purge one node after its (possibly staggered) exit animation finishes. */
  const schedulePurge = useCallback((id: string, delayMs: number) => {
    if (purgeTimersRef.current.has(id)) return;
    const t = setTimeout(() => {
      purgeTimersRef.current.delete(id);
      setDisplayNodes((prev) => prev.filter((n) => n.id !== id || n.visualState !== "removing"));
    }, delayMs);
    purgeTimersRef.current.set(id, t);
  }, []);

  const commitLayout = useCallback(
    (target: Layout, options?: { stream?: boolean; progressive?: boolean }) => {
      if (target.theme) setTheme(target.theme);
      setDisplayNodes((prev) => {
        if (target.nodes.length === 0 && !target.theme) return prev;
        const { next } = applyLayoutDiff(prev, target, options);
        let removalOrder = 0;
        for (const n of next) {
          if (n.visualState === "removing") {
            schedulePurge(n.id, REMOVAL_ANIM_MS + removalOrder * REMOVAL_STAGGER_MS + 60);
            removalOrder++;
          }
        }
        return next;
      });
      window.setTimeout(() => {
        setDisplayNodes((prev) => settleVisualStates(prev));
      }, ENTER_SETTLE_MS);
    },
    [schedulePurge],
  );

  const applyLayout = useCallback(
    (target: Layout, options?: { markApi?: boolean; stream?: boolean; progressive?: boolean }) => {
      if (options?.markApi && !gotApiPayloadRef.current) {
        gotApiPayloadRef.current = true;
        timingMarkFirstPayload("layout");
        setPhase("streaming");
      }
      commitLayout(target, options);
    },
    [commitLayout],
  );

  const finishTurn = useCallback(() => {
    timingMarkComplete();
    turnOpenRef.current = false;
    setActiveQuery(null);
    setPhase("idle");
    snapshotRef.current = null;
    streamKeyRef.current = null;
    streamNodeCountRef.current = 0;
    gotApiPayloadRef.current = false;
    lastDiffRef.current = 0;
    // Exit animations finish on their own timers — no instant purge here.
  }, []);

  const beginAsk = useCallback((query: string) => {
    timingMarkAsk();
    turnOpenRef.current = true;
    gotApiPayloadRef.current = false;
    streamKeyRef.current = null;
    streamNodeCountRef.current = 0;
    lastDiffRef.current = 0;

    // The old page stays on screen (dimmed by the UI) until real model output
    // starts replacing it — nothing is wiped speculatively.
    snapshotRef.current = layoutFromDisplayNodes(displayNodesRef.current, themeRef.current);
    setActiveQuery(query);
    setPhase("waiting");
  }, []);

  const restoreSnapshot = useCallback(() => {
    const snap = snapshotRef.current;
    if (snap) {
      setDisplayNodes(displayNodesFromLayout(snap));
      setTheme(snap.theme);
    }
    snapshotRef.current = null;
  }, []);

  const onError = useCallback(() => {
    timingCancel();
    purgeTimersRef.current.forEach(clearTimeout);
    purgeTimersRef.current.clear();
    restoreSnapshot();
    wasBusyRef.current = false;
    finishTurn();
  }, [finishTurn, restoreSnapshot]);

  useEffect(() => {
    if (isBusy) {
      wasBusyRef.current = true;
      if (!turnOpenRef.current) return;

      const stream = findStreamingLayout(messages);
      if (!stream) return;

      // Monotonic guard: the half-written trailing object flips between
      // parseable and unparseable as tokens arrive — never let that yank an
      // already-visible node off the canvas mid-stream.
      if (stream.layout.nodes.length < streamNodeCountRef.current) return;

      const now = Date.now();
      const keyChanged = stream.key !== streamKeyRef.current;
      // A new completed node applies instantly; growth inside the trailing
      // half-written node (e.g. an article typing itself out) is throttled.
      if (!keyChanged && now - lastDiffRef.current < DIFF_THROTTLE_MS) return;

      streamKeyRef.current = stream.key;
      streamNodeCountRef.current = stream.layout.nodes.length;
      lastDiffRef.current = now;
      applyLayout(stream.layout, { markApi: true, stream: true, progressive: true });
      return;
    }

    // Finalize only after a busy→idle transition during an open turn.
    if (!turnOpenRef.current || !wasBusyRef.current) return;
    wasBusyRef.current = false;

    const completed = extractCompletedLayout(messages);
    if (completed) {
      // Full diff: any old node the stream never overtook exits now, staggered.
      applyLayout(completed.layout, { markApi: true });
      streamKeyRef.current = completed.key;
    } else {
      // Nothing usable came back — put the page back exactly as it was.
      restoreSnapshot();
    }

    finishTurn();
  }, [messages, isBusy, applyLayout, finishTurn, restoreSnapshot]);

  return {
    displayNodes,
    theme,
    activeQuery,
    phase,
    beginAsk,
    onError,
    isLocked: isBusy,
  };
}
