import type { CSSProperties } from "react";
import type { StyleProps, ThemeProps } from "./tools";

export const FONT_FAMILY: Record<"sans" | "serif" | "mono", string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
};

const RADIUS: Record<NonNullable<StyleProps["borderRadius"]>, string> = {
  none: "0px",
  sm: "8px",
  md: "16px",
  lg: "28px",
  full: "999px",
};

const PADDING: Record<NonNullable<StyleProps["padding"]>, string> = {
  sm: "0.875rem",
  md: "1.75rem",
  lg: "3rem",
};

const SHADOW: Record<NonNullable<StyleProps["shadow"]>, string> = {
  none: "none",
  sm: "0 1px 3px rgba(0,0,0,0.25)",
  md: "0 10px 30px rgba(0,0,0,0.28)",
  lg: "0 24px 60px rgba(0,0,0,0.4)",
};

/**
 * Converts a validated StyleProps into inline CSS for a component's section
 * wrapper. The accent color is exposed as the --accent custom property so
 * child elements (buttons, links, timeline dots) pick it up automatically.
 */
export function containerStyle(style?: StyleProps): CSSProperties {
  if (!style) return {};
  const css: Record<string, string> = {};

  if (style.background) css.background = style.background;
  if (style.textColor) css.color = style.textColor;
  if (style.accentColor) css["--accent"] = style.accentColor;
  if (style.borderRadius) {
    css.borderRadius = RADIUS[style.borderRadius];
    css["--radius"] = style.borderRadius === "full" ? "24px" : RADIUS[style.borderRadius];
  }
  if (style.padding) css.padding = PADDING[style.padding];
  else if (style.background) css.padding = PADDING.md;
  if (style.shadow) css.boxShadow = SHADOW[style.shadow];
  if (style.align) css.textAlign = style.align;
  if (style.fontStyle) css.fontFamily = FONT_FAMILY[style.fontStyle];
  if (style.emphasis === "subtle") css.opacity = "0.85";
  if (style.emphasis === "bold") css.fontWeight = "600";

  return css as CSSProperties;
}

export function animationClass(style?: StyleProps): string {
  switch (style?.animation) {
    case "fade":
      return "anim-fade";
    case "slide-up":
      return "anim-slide-up";
    default:
      return "";
  }
}

export function themeStyle(theme?: ThemeProps): CSSProperties {
  const css: CSSProperties = {};
  if (theme?.background) css.background = theme.background;
  if (theme?.textColor) css.color = theme.textColor;
  if (theme?.fontStyle) css.fontFamily = FONT_FAMILY[theme.fontStyle];
  return css;
}

/** Grid template that honors a requested column count but collapses on small screens. */
export function gridColumns(columns?: number): string {
  if (!columns || columns <= 1) return "repeat(auto-fit, minmax(min(100%, 250px), 1fr))";
  const pct = Math.floor(100 / columns);
  return `repeat(auto-fit, minmax(min(100%, calc(${pct}% - 1rem)), 1fr))`;
}

/** Deterministic placeholder image, seeded by a hash of the model's imageQuery. */
export function picsumUrl(imageQuery: string, width = 900, height = 620): string {
  let hash = 7;
  for (let i = 0; i < imageQuery.length; i++) {
    hash = (Math.imul(hash, 31) + imageQuery.charCodeAt(i)) >>> 0;
  }
  return `https://picsum.photos/seed/${hash}/${width}/${height}`;
}
