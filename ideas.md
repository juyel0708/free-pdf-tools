# CutBG — Design Brainstorm

## Three stylistic approaches

### Theme Name: Paper Cut Studio
**Very Brief Intro:** A warm editorial tool inspired by Bangladeshi print shops and paper cut-outs: cream paper, ink-blue accents, and visible layers make the editing action feel tangible and trustworthy.
**Probability:** 0.03

### Theme Name: Signal Green Utility
**Very Brief Intro:** A crisp utility interface with graphite surfaces, bright green status cues, and precise controls. It would feel fast, technical, and efficiency-first without becoming cold.
**Probability:** 0.07

### Theme Name: Mango Glass
**Very Brief Intro:** A light, airy consumer tool with mango-orange energy, translucent panels, and playful visual cutouts. It would feel friendly and approachable for first-time mobile users.
**Probability:** 0.05

## Chosen direction: Paper Cut Studio

### Design Movement
Contemporary editorial minimalism blended with tactile Swiss-inspired information design and the visual language of layered paper craft. The interface should feel like a helpful neighborhood photo studio translated into a calm digital tool.

### Core Principles
1. **One obvious next step:** The upload action is the visual anchor; the user should understand what to do without reading a manual.
2. **Tactile layers:** Cards, tabs, checkerboard transparency, and offset shadows show how the image moves from original to cutout to export.
3. **Bilingual clarity:** Bangla carries the emotional and explanatory load while English labels improve recognition of common tool terms.
4. **Quiet confidence:** No login walls, no fake urgency, no visual clutter; privacy and free access are visible at the moment of action.

### Color Philosophy
Use warm paper as the foundation, deep ink-blue for trust and legibility, and one ownable vermilion-orange for action. The palette intentionally avoids the generic SaaS blue gradient: it echoes print, passport photos, and the familiar warmth of a local service counter while keeping contrast accessible. Dark mode becomes an ink-room variant, not a separate identity.

### Layout Paradigm
A left-anchored editorial canvas with a large upload stage and a narrow supporting rail on desktop; on mobile the stage stays first and controls collapse into a compact bottom-oriented tool stack. Sections should enter with slight horizontal offsets rather than stacking everything in centered symmetrical blocks.

### Signature Elements
- A **paper-corner cut** motif: small clipped corners and offset shadows on cards, never excessive rounded rectangles.
- A **checkerboard transparency swatch** used as a visual language for transparent exports.
- A **cut-line vermilion marker** that appears on active tabs, the main upload button, and the before/after slider handle.

### Interaction Philosophy
Every action should confirm itself visually: drag-over adds a lifted paper edge, processing uses a clear segmented progress state, and download actions show a short “ready” confirmation. Controls use plain language and icon-plus-label pairing so users do not need to decode tooltips. Errors stay near the action and are bilingual.

### Animation
Use 160–240ms transitions with a snappy cubic-bezier. Upload cards lift by 4px on drag-over, active tabs slide an ink underline, and compare sliders move without easing while dragged. Use a single gentle paper-fan entrance on first load. Disable non-essential motion under `prefers-reduced-motion`.

### Typography System
Use **Fraunces** for display headlines and section numerals, paired with **Noto Sans Bengali** for all body and UI copy. English utility labels can use **DM Sans** at medium weight. Headings are compact and confident; Bangla copy stays at a generous line-height (1.6–1.75) for readability on phones.

### Brand Essence
**CutBG is the free, private background remover for Bangladesh’s everyday photo needs—simpler than an editor, more trustworthy than an upload service.**

Personality: **helpful, candid, resourceful**.

### Brand Voice
Headlines are direct and warm; CTAs sound like a clear instruction from a helpful person. Microcopy states what happens to the file instead of using hype.

Example lines:
- “ছবি দিন, ব্যাকগ্রাউন্ড নেই — একদম ফ্রি।”
- “আপনার ছবি ব্রাউজারেই থাকে। কাজ শেষে PNG নিন।”

### Wordmark & Logo
The mark is a bold, text-free paper-slice symbol: a square photo frame with one corner visibly peeled away, leaving a vermilion cut line and a small transparent checkerboard opening. The wordmark should be set in a custom-feeling Fraunces lockup with a short orange underline, but the standalone logo remains the peel-and-cut symbol for favicon and header use.

### Signature Brand Color
**Cut Vermilion — `#E4572E`**. It signals the moment where a background is separated from the subject and remains legible against both warm paper and ink-room dark mode.

## Implementation reminders

- Keep the hero visual supportive rather than decorative: an editorial collage of a portrait card, checkerboard cutout, and a vermilion slice.
- Use the generated logo in the header and favicon; do not replace it with a text-only mark.
- Every edited component/page file should begin with a short comment reminding the author of the Paper Cut Studio direction.
- Product scope remains frontend-only and client-side. No login/signup, backend, or centralized analytics should be implied by the UI copy.

## Style Decisions

- The upload area is the central studio table: it carries the strongest paper-layer treatment and stays visually connected to the hero CTA.
- Every major surface uses a restrained Paper Cut Studio grammar: a clipped or peeled corner, an offset paper shadow, and either a vermilion cut-line or checkerboard cue.
- Cut Vermilion `#E4572E` is reserved for action, active cut states, section numerals, and key trust confirmations rather than general decoration.
