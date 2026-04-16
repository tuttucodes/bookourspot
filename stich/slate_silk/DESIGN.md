# Design System Strategy: The Curated Sanctuary

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Curated Sanctuary."** 

In the saturated market of wellness booking, we move away from the "utility-first" grid of competitors to create a digital space that feels as restorative as the services it facilitates. We achieve this through **Spatial Luxury**—the intentional use of generous white space and asymmetrical layouts that evoke the feeling of a high-end fashion editorial rather than a database. 

To break the "template" look, designers must embrace overlapping elements (e.g., a service category image bleeding behind a title card) and a high-contrast typographic scale. This system isn’t just about booking a spot; it’s about the anticipation of the experience.

---

## 2. Colors & Tonal Depth
Our palette is anchored in a sophisticated Charcoal (`on-surface: #1c1b1b`) and a warm, inviting off-white (`background: #fcf9f8`). The primary Teal (`primary: #006273`) provides an authoritative yet calming accent.

*   **The "No-Line" Rule:** To maintain a premium, seamless aesthetic, the use of 1px solid borders for sectioning is strictly prohibited. Boundaries must be defined by shifts in background tokens. For example, a search section using `surface-container-low` should sit directly against a `background` page without a stroke.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers of fine stationery. Use the `surface-container` tiers to create depth:
    *   **Base:** `background` (#fcf9f8).
    *   **Sectioning:** `surface-container-low` for large content blocks.
    *   **Interactive Cards:** `surface-container-lowest` (#ffffff) to provide a "lift" through brightness rather than shadows.
*   **The Glass & Gradient Rule:** For floating headers or navigation bars, utilize Glassmorphism. Apply `surface` at 80% opacity with a 20px backdrop blur. 
*   **Signature Textures:** For high-impact CTAs or Hero sections, use a subtle linear gradient transitioning from `primary` (#006273) to `primary_container` (#107c91) at a 135-degree angle. This adds "soul" and prevents the flatness common in budget apps.

---

## 3. Typography
We utilize **Inter** as a singular, powerful typeface, relying on extreme scale and weight contrast to establish hierarchy.

*   **Display (lg/md):** Used sparingly for brand moments or empty states. These should have a slight negative letter-spacing (-0.02em) to feel "tucked" and premium.
*   **Headline (lg/md):** Your primary storytelling tool. Use these for venue names and service categories.
*   **Body (lg/md):** Set in `on_surface_variant` (#3e484c) to reduce eye strain and provide a softer contrast than pure charcoal.
*   **Label (md/sm):** Reserved for metadata (e.g., "5.0 Stars" or "Kuala Lumpur"). These should always be uppercase with +0.05em letter-spacing for a sophisticated, architectural feel.

---

## 4. Elevation & Depth
In "The Curated Sanctuary," depth is felt, not seen. We avoid heavy dropshadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Stacking tokens is our primary method of elevation. A `surface-container-lowest` card placed on a `surface-container-high` background creates a crisp, natural focal point.
*   **Ambient Shadows:** If a floating element (like a "Book Now" sticky bar) requires a shadow, it must use the `on_surface` color at 4% opacity with a 32px blur and 8px Y-offset. It should feel like a soft glow of light, not a dark stain.
*   **The "Ghost Border" Fallback:** For localized payment icons (GrabPay, TNG) that require containment against white backgrounds, use a "Ghost Border": the `outline_variant` token at 15% opacity. Never use 100% opaque outlines.
*   **Softened Geometry:** Adhere strictly to the **8-12px (md/lg)** roundedness scale for cards and buttons. For "Pill" shapes (Selection Chips), use `full` (9999px) to contrast against the structured editorial layout.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `full` roundedness, and `on_primary` text. No border.
*   **Secondary:** `surface_container_highest` background with `primary` text. This provides a tactile feel without competing with the main CTA.
*   **Tertiary:** Purely typographic using `label-md` in `primary`, with no container, used for "View All" or "Cancel."

### Input Fields
*   **Styling:** Use `surface_container_low` for the field background. Forbid the "bottom-line-only" look; use a fully enclosed container with `md` (0.75rem) corner radius.
*   **States:** On focus, transition the background to `surface_container_lowest` and add a 1px `primary` ghost border (20% opacity).

### Cards & Lists
*   **Rule:** **Zero Divider Lines.** Separate list items using the Spacing Scale (typically 16px to 24px of vertical white space).
*   **Imagery:** Beauty services rely on visuals. Images should always use `lg` (1rem) corner radius and, where possible, break the container's symmetry to create an editorial feel.

### Localized Elements (Malaysia)
*   **Payment Pickers:** GrabPay and TNG icons must be housed in `surface_container_lowest` tiles with a `sm` (0.25rem) ghost border.
*   **Service Tags:** Use `secondary_fixed` (#f4d9ff) for premium labels (e.g., "Sultan Ismail Exclusive") with `on_secondary_fixed` text for a soft, regal purple accent.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. For example, a left-aligned headline with a right-aligned descriptive paragraph creates a "high-fashion" balance.
*   **Do** use `surface_bright` for highlight moments in the user journey (e.g., a successful booking confirmation).
*   **Do** prioritize high-quality imagery over icons. Let the photography of the spa or salon do the heavy lifting.

### Don't:
*   **Don't** use standard "Material Blue" or generic "Success Green." Stick to the teal (`primary`) and the warm coral/pink (`tertiary`) tones for all feedback.
*   **Don't** crowd the interface. If an element isn't essential to the booking, remove it. Luxury is defined by what is left out.
*   **Don't** use 100% black. Always use the charcoal `on_surface` (#1c1b1b) to maintain a soft, premium feel.