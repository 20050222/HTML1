# Detailed Earth Shelf Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the ecology page globe from coarse shelf polygons to denser, layered continental-shelf surface modeling.

**Architecture:** Keep the current single-page app structure. Add high-density shelf contour datasets and rendering helpers in `script.js`, then tighten structural and visual checks so the globe must expose layered shelf curves, coastal buffers, and depth bands.

**Tech Stack:** HTML, CSS, Canvas 2D, PowerShell, Node-based structural tests, Playwright visual tests.

## Global Constraints

- Do not use Google Maps or Baidu Maps proprietary tiles/data directly.
- Keep the globe usable offline by embedding local vector-style data in `script.js`.
- Preserve existing drag, zoom, reset, and habitat scenario interactions.
- Use `apply_patch` for manual file edits.

---

### Task 1: Add Failing Coverage For High-Density Shelf Modeling

**Files:**
- Modify: `tests/verify-page.js`
- Test: `tests/verify-page.js`

**Interfaces:**
- Consumes: `script.js` text.
- Produces: structural checks for `highDensityShelfContours`, `drawShelfContourBand`, `drawBathymetryContour`, and `densifyGeoLine`.

- [x] **Step 1: Write the failing test**

Add structural checks requiring named high-density continental shelf contour helpers and at least several named detailed shelf regions.

- [x] **Step 2: Run test to verify it fails**

Run: `node tests\verify-page.js`

Expected: FAIL on high-density shelf modeling check.

### Task 2: Implement Layered Shelf Contours

**Files:**
- Modify: `script.js`
- Test: `tests/verify-page.js`

**Interfaces:**
- Consumes: `projectEarthPoint(lon, lat, radius, centerX, centerY)` and `drawProjectedLine(points, strokeStyle, lineWidth, alpha)`.
- Produces:
  - `highDensityShelfContours: Array<{ name, depth, points }>`
  - `densifyGeoLine(points, stepDegrees)`
  - `drawBathymetryContour(contour, palette)`
  - `drawShelfContourBand(contour, palette)`

- [x] **Step 1: Add high-density shelf contour data**

Create detailed line strings for East China Sea, Yellow Sea, South China Sea, Sunda Shelf, Sahul Shelf, Japan Trench front, Bering Shelf, Patagonian Shelf, North Sea Shelf, and Grand Banks.

- [x] **Step 2: Add rendering helpers**

Use `densifyGeoLine` to interpolate points and draw multi-pass depth curves: glowing shelf fill, 0-200m line, 200m break, and 1000m slope trace.

- [x] **Step 3: Wire helpers into `drawAncientEarth`**

Draw shelf bands before land, then contour lines above land/shelf with depth-specific opacity.

### Task 3: Verify In Browser

**Files:**
- Modify: `tests/visual-check.js` if needed.
- Test: `tests/visual-check.js`

**Interfaces:**
- Consumes: rendered ecology page.
- Produces: fresh screenshots in `artifacts/`.

- [x] **Step 1: Run structural tests**

Run: `node tests\verify-page.js`

Expected: all checks pass.

- [x] **Step 2: Run visual checks**

Run the existing Playwright command with `NODE_PATH` and `PLAYWRIGHT_CHROME_PATH`.

Expected: desktop and mobile visual checks pass.
