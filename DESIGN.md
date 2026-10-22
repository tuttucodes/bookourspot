# BookOutSpot design direction

## Brief

BookOutSpot is a Chennai-first going-out and event-ticket product. Visitors need to discover a plan quickly, understand the details, book confidently, and find a real pass in their account afterwards. Primary audience is local event-goers on phones. Provided artwork and screenshots are the source for the current Halloween spotlight and District-inspired interaction patterns. Other event listings must stay visibly unavailable until their organisers confirm inventory.

## Concept card

**Idea:** Every night starts as a poster and opens into a plan: image first, then the date, place, people, and ticket.

**Metaphor:** A city-night noticeboard that unfolds into a clear event brief.

**Signature:** Tap the Halloween poster to open a full event page; the fixed booking action stays in reach while the details scroll beneath it.

**Emotion:** A little anticipation, then clarity and trust.

**Motion verb:** Unfold and settle. Cards lift slightly; details sheets arrive from the bottom; controls confirm taps with a small press response.

**Shareable frame:** The Halloween poster, title, Friday date and ₹1,500 / ₹2,800 choice on one mobile screen.

### Concept alternatives considered

| Territory | Idea | Anchor | Originality | Fit | Feasibility | Portability |
|---|---|---|---:|---:|---:|---:|
| Place | A Chennai night map where each plan is a stop that opens into its own event brief. | Chennai-first discovery and venue details | 4 | 5 | 3 | 2 |
| Material | Each event begins as a poster and unfolds into a booking brief. | User supplied District-style event posters and ticket flow | 4 | 5 | 5 | 2 |
| Formal | One clear event at a time: poster, details, tickets, pass. | Existing event booking sequence | 3 | 4 | 5 | 3 |

**Selected:** Material. It makes the supplied artwork do the work and naturally explains the event-detail route and sticky booking control without inventing a visual gimmick.

## System

- **Ground:** near-black `#0B0911`, matching the supplied night-mode screens.
- **Ink:** soft white `#F7F4FF` for titles and primary actions.
- **Muted:** lavender grey `#AAA2B8` for secondary details.
- **Line:** white at roughly 10–16% opacity for dividers and outlines.
- **Accent:** soft violet `#B99AFF` for selected states, active links and the BookOutSpot checkout.
- **Curtain:** translucent black with blur for sheets and focused overlays.
- **Type:** existing system sans for legibility; the event artwork supplies its own expressive display voice. Currency uses tabular numerals.
- **Grid:** one-column mobile flow with horizontal image rails where useful; 12-column desktop grid, max-width 1440px.
- **Shape:** event cards 14–24px radius; action pills fully rounded; modal sheets have larger top corners on phones.
- **Motion:** short, restrained transforms and opacity; honor reduced-motion preferences. No scroll-jacking or hover-only actions.

## Mobile rules

- Compose at 320–430px first; primary actions are at least 44px high.
- Keep event identity and price above the fold; safe-area inset keeps sticky actions clear of browser UI.
- Drawers are bottom sheets on phones and centered dialogs on larger screens.
- Every hover action has a tap and keyboard equivalent; active navigation and selection use labels as well as color.

## Honest content rules

- “A little Halloween affair” is the current spotlight: entry is ₹1,500 for one or ₹2,800 for a duo of two.
- The Halloween location is intentionally secret and must be shared with invited guests by its organiser.
- Other cards remain visible but their checkout action says booking is unavailable.
- Do not show fabricated reviews, inventory, payment confirmations, or attendee counts.
