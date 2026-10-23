---
name: Serpentine Heritage
colors:
  surface: '#f9f9f8'
  surface-dim: '#d9dad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#edeeed'
  surface-container-high: '#e7e8e7'
  surface-container-highest: '#e1e3e2'
  on-surface: '#191c1c'
  on-surface-variant: '#434843'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#f0f1f0'
  outline: '#737973'
  outline-variant: '#c3c8c1'
  surface-tint: '#4d6453'
  primary: '#061b0e'
  on-primary: '#ffffff'
  primary-container: '#1b3022'
  on-primary-container: '#819986'
  inverse-primary: '#b4cdb8'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#26110a'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e251d'
  on-tertiary-container: '#af8a7f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e9d4'
  primary-fixed-dim: '#b4cdb8'
  on-primary-fixed: '#0b2013'
  on-primary-fixed-variant: '#364c3c'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#e7bdb1'
  on-tertiary-fixed: '#2c160e'
  on-tertiary-fixed-variant: '#5d4037'
  background: '#f9f9f8'
  on-background: '#191c1c'
  surface-variant: '#e1e3e2'
typography:
  display:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-point:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is built for a premium marketplace and gallery dedicated to the preservation and trade of rare reptiles. The brand personality is authoritative, sophisticated, and deeply rooted in herpetology. It balances the precision of a scientific database with the high-end feel of a luxury gallery.

The design style is **Corporate / Modern** with a focus on **Tonal Layers**. It avoids the "wild" or "chaotic" tropes often associated with exotic pets, instead opting for a structured, professional environment that builds trust between high-stake collectors and professional breeders. The aesthetic is clean and organized, using generous whitespace and a rigorous grid to manage complex biological data.

## Colors

The palette is derived from natural scales and forest floor habitats.

*   **Primary (Deep Forest):** Used for navigation, headings, and high-impact containers. It provides a grounded, authoritative foundation.
*   **Secondary (Vibrant Amber):** Reserved for call-to-actions, status highlights (e.g., "Available"), and interactive accents. It mimics the striking eye or scale accents of rare morphs.
*   **Tertiary (Earthy Brown):** Used for secondary information, metadata, and borders that require a softer touch than pure grey.
*   **Neutral (Alpine Mist):** A cool-toned off-white that prevents the interface from feeling "muddy," ensuring the vibrant colors of the snakes remain the focal point.

## Typography

This design system utilizes a tiered typography strategy to manage both storytelling and technical data.

*   **Manrope** is used for headlines to provide a modern, balanced, and premium feel.
*   **Work Sans** serves as the primary body face, chosen for its exceptional readability in long-form descriptions and listing details.
*   **JetBrains Mono** is introduced for technical labels, genetic markers, and lineage data. This monospaced choice emphasizes the "scientific" nature of breeding and provides a clear visual distinction for data-heavy sections like family tree nodes.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop to maintain a gallery-like feel, while transitioning to a fluid model on mobile devices.

*   **Grid:** A 12-column system is used for the marketplace and snake profiles. 
*   **Lineage View:** A specialized horizontal-scrolling "infinite" canvas is used for family trees, ensuring complex relationships aren't cramped.
*   **Rhythm:** Spacing follows an 8px base unit. Component padding should favor vertical breathing room (e.g., 16px top/bottom) to maintain the premium, unhurried aesthetic.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

*   **Surface Hierarchy:** Backgrounds use the Neutral color. Content cards use pure white (#FFFFFF) with a thin 1px border in a lightened Tertiary tone (#E0D7D5).
*   **Shadows:** Use extremely soft, ambient shadows (0px 4px 20px rgba(27, 48, 34, 0.04)) to lift primary cards without creating a "floating" effect.
*   **Depth for Data:** Marketplace filters and family tree nodes use a subtle inset shadow or a slightly darker neutral background to indicate they are interactive or contain nested information.

## Shapes

The design system uses **Soft** geometry. 

Corners are slightly rounded to feel approachable and organic, but remain sharp enough to convey professional discipline. Snake profile images and gallery thumbnails should strictly adhere to the `rounded-lg` (0.5rem) setting to create a consistent "frame" effect throughout the marketplace.

## Components

### Snake Profile Cards
Cards are the primary unit of the marketplace. They must feature a full-bleed image at the top with a 3:2 aspect ratio. Below the image, use a "Data Bar" containing high-level specs (Age, Gender, Morph) using the `label-sm` typography and `data-point` styles.

### Family Tree Diagrams
Lineage nodes are compact rectangles with a `primary_color` left-border (4px). Connections are rendered as 2px solid lines in `tertiary_color`. Active nodes (the snake being viewed) are highlighted with a `secondary_color` (Amber) glow.

### Buttons
*   **Primary:** Solid `primary_color` with white text. High contrast, authoritative.
*   **Secondary:** Outlined with `primary_color`, used for "View Pedigree" or "Message Breeder."
*   **Marketplace Action:** A specialized "Buy/Inquire" button uses the `secondary_color` (Amber) to stand out against the deep greens.

### Marketplace Listings
Filters are arranged in a sidebar with collapsible sections. Checkboxes and radio buttons use the `primary_color` for their active states. Result counts are displayed in `label-sm` mono-text to emphasize the inventory-like nature of the search.

### Status Chips
Use small, pill-shaped indicators for availability:
*   **Available:** Background tint of Primary, text in Primary.
*   **Reserved:** Background tint of Tertiary, text in Tertiary.
*   **Sold:** Light grey background, dark grey text.