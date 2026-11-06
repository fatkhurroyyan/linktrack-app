---
name: LinkSense AI
description: A friendly, practical library for finding saved ideas.
colors:
  canvas: "#edf5f5"
  surface: "#fbfdfc"
  subtle: "#e3eeee"
  intro: "#dceef0"
  ink: "#254c59"
  muted: "#526b73"
  line: "#c4d8dc"
  outline: "#315966"
  accent: "#f7d070"
  accent-hover: "#fbe09a"
  on-accent: "#264550"
  sky: "#cee8ec"
  yellow: "#f8edc9"
  danger: "#a53238"
  danger-bg: "#fae9e7"
  success: "#23624d"
  success-bg: "#e6f1e8"
  shadow: "#c4d8dc"
  dark-canvas: "#152c33"
  dark-surface: "#1d3740"
  dark-subtle: "#24434b"
  dark-intro: "#203f49"
  dark-ink: "#e4f1f1"
  dark-muted: "#afc7cd"
  dark-line: "#3d5c66"
  dark-outline: "#7899a3"
  dark-sky: "#30545e"
  dark-yellow: "#4b4839"
  dark-danger: "#ffb5b4"
  dark-danger-bg: "#4d2d35"
  dark-success: "#9cdbb6"
  dark-success-bg: "#25473d"
  dark-shadow: "#10272e"
typography:
  display:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "43px"
    fontWeight: 500
    lineHeight: 1.13
    letterSpacing: "-0.8px"
  headline:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "25px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.3px"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.55
    letterSpacing: "-0.3px"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  chip: "7px"
  field: "11px"
  control: "12px"
  source: "13px"
  card: "18px"
  dialog: "22px"
  intro: "24px"
spacing:
  control-gap: "8px"
  source-gap: "12px"
  mobile-grid-gap: "16px"
  grid-gap: "20px"
  panel: "24px"
  desktop-gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.field}"
    padding: "0 12px"
  main-navigation:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    height: "80px"
  category-chip:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    padding: "7px 8px"
  source-filter-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.source}"
    padding: "13px 15px"
  resource-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "21px 21px 8px"
---

# Design System: LinkSense AI

## Overview

**Creative North Star: "A friendly, practical library"**

Use a calm cyan workspace, teal outlines, and yellow actions to make saving and
finding references feel approachable. Rounded display type and an original
knowledge companion give the interface its character; compact collection tools
keep the daily task in focus.

**Key Characteristics:**

- Cool surfaces, readable teal ink, and warm action accents.
- Outlined controls with short, solid shadows.
- Expressive headings paired with compact, practical UI text.
- A decorative companion that yields space to the task on mobile.

This records the implemented web interface. [The stylesheet](src/index.css)
is the authority for exact styles; [PRODUCT.md](PRODUCT.md) records product scope.
The sidecar in [.uizze/design.json](.uizze/design.json) contains preview snippets,
motion, depth, and responsive metadata.

## Colors

Primary actions use **accent** with **on-accent** text. The quiet cyan **canvas**,
near-white **surface**, and **subtle** fills support the collection; **intro**
distinguishes the URL entry panel. Use **ink** for content, **muted** for supporting
text, **line** for separators, and **outline** for emphasized boundaries.
**Sky** and pale **yellow** distinguish source icons; **danger** and **success**
each have a matching background for feedback.

**The Shared Theme Rule.** Switch semantic properties on the root
`data-theme` attribute so every surface, field, dialog, and feedback state follows
the theme together. The `dark-` tokens replace their light counterparts; accent,
accent-hover, and on-accent remain shared. Use the paired foreground and
background roles together.

## Typography

Load Fredoka and Plus Jakarta Sans from the local WOFF2 files in `public/fonts`.
Fredoka gives the workspace, collection, empty-state, and dialog headings their
rounded character. Plus Jakarta Sans carries navigation, card titles, forms,
metadata, and statistics headings.

The display and headline tokens describe the desktop workspace and collection
headings. Display size steps to 39px at 1199px, 35px at 767px, and 30px at 380px;
the collection heading steps to 23px at 767px. Card titles become 16px on mobile.
Supporting UI text uses context-specific sizes rather than a forced type ratio.

**The Editable Text Rule.** At widths up to 767px, keep editable inputs,
textareas, and selects at 16px, including card category controls.

## Layout

The centered page has a 1240px maximum width and 40px desktop side gutters.
Gutters become 28px at 1199px, 18px at 767px, and 14px at 380px. The sticky header
is 80px tall, or 70px on mobile. Keep the URL form, source filters, collection
tools, and results in that reading order.

The intro uses a flexible text column beside a 290px art column. At 1199px the
art column becomes 230px. At 767px the panel stacks and hides the decorative art;
the submit action moves below the URL input. The original cyan robot holds a
yellow chain while sitting on books; its empty alternative text keeps it outside
the task's reading order.

Source filters move from four columns to two on mobile. Results move from three
columns to two at 1199px and one at 767px. Search occupies its own row below
1199px; mobile filter options use two columns. Table view scrolls horizontally
inside its own container. Dialogs constrain height and scroll internally.

## Elevation & Depth

Use solid offset shadows to make selected filters, primary actions, and cards
feel tactile. A primary action rests on `0 3px 0 var(--outline)` and lifts to
`0 4px 0 var(--outline)` on hover. Cards use the shadow color with a 3px offset,
increasing to 5px on hover. Soft shadows are reserved for export menus, toasts,
and dialogs; their exact values live in the sidecar.

**The Feedback Motion Rule.** Keep motion attached to a state change: 180ms
control transitions, a small hover lift, and brief toast or menu arrival.
Skeleton breathing runs three times. Honor reduced motion across transitions,
animations, and scrolling.

Content sits below the sticky header (10), export popover (20), and toast (30).
The skip link uses 40; native dialogs and backdrops use the browser top layer.

## Shapes

Use rounded rectangles with visible boundaries. Controls use the control and
field radii; cards, dialogs, and the intro panel use progressively broader
corners. Most separators use a 1px line; primary actions and the intro panel use
a 1.5px outline. Editable secondary category controls use a dashed boundary.
Avoid turning every label into a pill: tags remain small text actions.

## Components

The canonical previews cover primary and outline buttons, search, navigation,
locked category chips, source filters, and resource cards.

The [original companion](public/images/library-companion.webp) has an
[asset provenance record](public/images/library-companion.provenance.json) that
includes its exact generation prompt.

- **Buttons:** Keep primary actions yellow with a solid lower edge. Outline
  actions use surface and line roles; quiet actions gain a subtle hover fill.
  Standard buttons have a 44px minimum height. Disabled buttons reduce opacity.
- **Fields:** Search uses an inset icon and a surrounding focus-within outline.
  The URL form groups its input and primary action inside one outlined surface.
  Keep visible labels, error text, and busy feedback connected to their fields.
- **Navigation:** Retain the sparkle mark and LinkSense AI name. Mobile hides
  supporting status text and reduces statistics to an accessible icon control.
- **Source filters:** Treat the four sources as pressed-state buttons. The
  selected source gains a surface fill, strong outline, solid shadow, and yellow
  count badge. Counts and collection content come from the API.
- **Cards and chips:** Present source identity, title, summary, categories, and
  footer actions in order. Clamp titles to two lines and summaries to three;
  preserve full content in detail view. Lock source categories for Drive and
  GitHub. Clearing the optional secondary category submits an empty string.
- **Dialogs:** Use native modal dialogs with an accessible title, focus trap,
  focus restoration, Escape handling, and a scrollable body. Keep the batch
  submit button disabled when its URL list is empty or processing is active.
- **Focus and touch:** Interactive elements use a visible 3px outline with a
  4px offset; grouped inputs use their surrounding focus treatment. Coarse
  pointers expand icon actions, tags, and category controls to 44px targets.

## Do's and Don'ts

Use these guardrails when extending the implemented system.

- **Do** use semantic color properties so light and dark themes stay coherent.
- **Do** pair rounded Fredoka headings with Plus Jakarta Sans UI text.
- **Do** preserve visible focus, mobile editable text sizes, and recoverable
  loading, empty, and error states.
- **Do** use the original companion as decoration and preserve the mobile task
  priority.
- **Don't** replace the outlined, solid-shadow controls with generic gradients.
- **Don't** copy the reference site's event branding or mascot.
- **Don't** present synthetic screenshot fixtures as product data or claims.
