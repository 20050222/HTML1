# Ancient Future Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a polished static animated web page that fuses prehistoric museum imagery with futuristic holographic laboratory UI.

**Architecture:** Use a dependency-free static site with one HTML file, one CSS file, one JavaScript file, and one generated project-local hero asset. Verification is a lightweight Node script that checks structure, asset references, animation hooks, and responsive safeguards.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Canvas 2D, Node.js for checks.

---

### Task 1: Structural Verification

**Files:**
- Create: `tests/verify-page.js`

- [x] **Step 1: Write the failing structural test**

Create a Node script that checks for the required files and key page features.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tests/verify-page.js`

Expected before implementation: FAIL because `index.html`, `styles.css`, and `script.js` do not exist.

### Task 2: Static Page

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `script.js`
- Use: `assets/hero-lab.png`

- [ ] **Step 1: Build semantic HTML**

Add the hero, exhibit cards, telemetry dashboard, and decorative layers.

- [ ] **Step 2: Build responsive animated CSS**

Add the generated hero background, scan lines, glow effects, floating cards, responsive layout, and reduced-motion rules.

- [ ] **Step 3: Build JavaScript motion**

Add canvas particles, mouse parallax, and live metric updates while respecting reduced motion.

- [ ] **Step 4: Run verification**

Run: `node tests/verify-page.js`

Expected after implementation: PASS with all required checks.

### Task 3: Visual QA

**Files:**
- Inspect: `index.html`

- [ ] **Step 1: Open or render the static page**

Use a local browser or file URL to inspect the page.

- [ ] **Step 2: Check desktop and narrow viewport**

Verify that text remains readable, cards do not overlap, the asset loads, and the animated layers are visible.

- [ ] **Step 3: Final report**

Report created files, verification result, and the local path to open.
