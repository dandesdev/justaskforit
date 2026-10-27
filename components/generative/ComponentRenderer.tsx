"use client";

import type { CSSProperties, ReactNode } from "react";
import type { OnAction } from "@/lib/actions";
import type { DisplayNode, NodeVisualState } from "@/lib/display-node";
import { animationClass, containerStyle } from "@/lib/style";
import { Article } from "./Article";
import { ButtonNode } from "./ButtonNode";
import { CanvasSketch } from "./CanvasSketch";
import { CardGrid } from "./CardGrid";
import { FormBlock } from "./FormBlock";
import { Gallery } from "./Gallery";
import { Hero } from "./Hero";
import { LinkList } from "./LinkList";
import { NavigationMenu } from "./NavigationMenu";
import { SkillList } from "./SkillList";
import { TextBlock } from "./TextBlock";
import { Timeline } from "./Timeline";
import type { ComponentNode } from "@/lib/tools";

function visualClass(state: NodeVisualState): string {
  switch (state) {
    case "removing":
      return "gen-node-removing";
    case "entering":
      return "gen-node-entering";
    case "transitioning":
      return "gen-node-transitioning";
    case "stale":
      return "gen-node-stale";
    default:
      return "";
  }
}

function NodeView({
  node,
  visualState,
  onAction,
  interactive,
}: {
  node: ComponentNode;
  visualState: NodeVisualState;
  onAction: OnAction;
  interactive: boolean;
}) {
  const noop = () => {};
  const action = interactive ? onAction : noop;

  switch (node.type) {
    case "hero":
      return <Hero node={node} visualState={visualState} />;
    case "cardGrid":
      return <CardGrid node={node} visualState={visualState} onAction={action} />;
    case "article":
      return <Article node={node} visualState={visualState} />;
    case "timeline":
      return <Timeline node={node} />;
    case "skillList":
      return <SkillList node={node} />;
    case "form":
      return <FormBlock node={node} onAction={action} />;
    case "navigationMenu":
      return <NavigationMenu node={node} onAction={action} />;
    case "gallery":
      return <Gallery node={node} />;
    case "button":
      return <ButtonNode node={node} onAction={action} />;
    case "textBlock":
      return <TextBlock node={node} visualState={visualState} />;
    case "linkList":
      return <LinkList node={node} />;
    case "canvas":
      return <CanvasSketch node={node} />;
    default: {
      const exhaustive: never = node;
      void exhaustive;
      return null;
    }
  }
}

export function ComponentRenderer({
  displayNodes,
  onAction,
  interactive = true,
  streaming = false,
  buildStub = null,
}: {
  displayNodes: DisplayNode[];
  onAction: OnAction;
  interactive?: boolean;
  streaming?: boolean;
  /** Rendered at the build head (after the newest live node) while streaming. */
  buildStub?: ReactNode;
}) {
  // Exiting nodes leave one by one: each gets a delay based on its position
  // in the removal queue (must stay in sync with the orchestrator's purge timing).
  let removalOrder = 0;
  const lastLiveIndex = displayNodes.reduce(
    (acc, n, i) => (n.visualState === "removing" || n.visualState === "stale" ? acc : i),
    -1,
  );

  const rendered: ReactNode[] = displayNodes.map((entry, i) => {
    const removalIndex = entry.visualState === "removing" ? removalOrder++ : -1;
    const style: CSSProperties = {
      animationDelay: removalIndex >= 0 ? `${removalIndex * 90}ms` : `${Math.min(i * 90, 540)}ms`,
      ...containerStyle(entry.node.style),
    };
    return (
      <section
        key={entry.id}
        style={style}
        className={`gen-node ${animationClass(entry.node.style)} ${visualClass(entry.visualState)} ${
          streaming && i === lastLiveIndex ? "gen-node-streaming" : ""
        }`}
      >
        <NodeView
          node={entry.node}
          visualState={entry.visualState}
          onAction={onAction}
          interactive={interactive}
        />
      </section>
    );
  });

  if (streaming && buildStub) {
    rendered.splice(lastLiveIndex + 1, 0, <div key="__build-stub">{buildStub}</div>);
  }

  return <>{rendered}</>;
}
