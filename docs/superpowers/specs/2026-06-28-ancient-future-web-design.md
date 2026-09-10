# Ancient Future Web Design

## Goal

Build a static animated web page that combines ancient biological exhibition elements with futuristic technology, using the selected direction: prehistoric museum plus holographic laboratory.

## Visual Direction

The first screen should feel like a future research museum where ancient life is reconstructed as holographic data. The page uses a generated hero image of a dinosaur skeleton in a sci-fi lab, then layers real-time effects on top: particles, scan lines, radar rings, floating fossil labels, and a glowing console.

## Content

The page should be in Chinese and include:

- A strong title around "远古生命复原实验室".
- A short atmospheric subtitle.
- Ancient elements: dinosaur skeleton, amber, ammonite, trilobite, fossil archive.
- Future tech elements: holographic scan, neural interface, quantum reconstruction, bio-signal telemetry.
- A compact dashboard-like control area with metrics and status items.

## Architecture

Use plain static files so the result can be opened directly in a browser:

- `index.html` for semantic structure.
- `styles.css` for layout, generated hero asset, responsive design, and CSS animations.
- `script.js` for canvas particles, mouse parallax, and live telemetry values.
- `assets/hero-lab.png` for the generated visual asset.
- `tests/verify-page.js` for a lightweight structural verification.

## Animation Requirements

Animations should be visible but not chaotic:

- Background shimmer and scan-line movement.
- Floating specimen cards.
- Rotating or pulsing holographic rings.
- Canvas particle field.
- Mouse-driven parallax for the central exhibit.
- Respect `prefers-reduced-motion` by reducing or stopping intensive motion.

## Accessibility And Responsiveness

The page should work at desktop and mobile widths. Text must remain readable, no buttons or cards should overflow, and decorative effects should not block content. Canvas and decorative layers must be hidden from screen readers.

## Verification

Run the Node structural check and visually inspect the page in a browser or screenshot. The project is not a git repository, so the design cannot be committed here.
