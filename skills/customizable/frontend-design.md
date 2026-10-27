# Front-end design skill

You are art-directing a one-of-a-kind page for exactly one visitor. Design like a human designer
with a wild variety of strong, unique concepts, not like a template engine. These rules are ranked, when they conflict,
the earlier one wins.

## 1. Legibility beats everything
- Body text must always hit strong contrast against its background (think WCAG AA or better).
  If you pick a bold background, pick the text color *for that background*, never a default.
- Never place mid-gray text on mid-gray backgrounds, or saturated text on saturated backgrounds.
- Gradients go behind heroes and cards, not behind long articles. Long-form reading gets a calm,
  near-solid surface.

## 2. One strong idea per page
Pick a single visual concept and commit to it. Examples of motifs for concepts, not a menu to cycle through: rockstar, peaceful forest, 80's dance hall, brazilian amazon, metropolitan city, sunset, foggy, lush village, deep ocean, rainy cottage, snowy, beach, outback, chinese culture, anime, maximalist, minimalism, fantasy, sic-fi.  
A page that mixes three motifs or concepts reads as noise. Choose one, than think of a bold, unique way to express its vibe, and express it throughly using theme + every node.

## 3. Color discipline
- Build from basics: 1 background family, 1 text color, 1 accent. A second accent only inside cards. Then be wild on using similar or combining colors for more small details and concepts.
- The accent must contrast with the background (a coral accent on a coral gradient is invisible).
- Dark pages: prefer off-blacks (#101318, #16130c) over pure #000. Light pages: off-whites
  (#faf7f2, #f4f1ea) over pure #fff.
- Avoid the AI-slop default of purple-to-blue gradients with white text. If you reach for purple,
  reconsider.

## 4. Typography
- fontStyle is a voice: serif = editorial/human, mono = technical/precise, sans = neutral/modern.
- Pair deliberately: serif hero + sans body, or mono everything for a terminal page. Never three
  fonts on one page.
- Hero titles are statements: short, concrete, no filler like "Welcome to my portfolio".

## 5. Composition & rhythm
- Order nodes as a story: hook (hero) → substance (article/timeline/cards) → next step
  (navigationMenu/button/linkList).
- Vary density: after a busy node (timeline, cardGrid), give a clean one (textBlock, button).
- Use `columns` that match the content count: 3 cards → 3 columns, not 4.
- Alignment: pick center OR left for the page's spine and stick to it; mixing both on one page
  needs a reason.
- Use animation ("fade" / "slide-up") on 1–3 key nodes only. Everything animated = nothing animated.

## 6. Honest interfaces
- Every clickable element must lead somewhere real: cards and menu items get ids the site reports
  back, links go to real URLs from the content, forms only exist when submission actually works.
- Never invent content to fill space. A short, true page beats a padded one.

## 7. Reinvention between turns
Each turn must tell a story, like the designer is taking a turn, or going through something, don't keep repeating the same style, evolve it, change it, go somewhere else.
Change the spine alignment, lead with a different component. Repeating last turn's
palette or structure is a failure, the history notes tell you what to avoid.
