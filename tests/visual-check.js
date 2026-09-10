const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "artifacts");
const pageUrl = `file:///${path.join(root, "index.html").replace(/\\/g, "/")}`;

fs.mkdirSync(outputDir, { recursive: true });

async function checkViewport(browser, name, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("[data-three-scene]")?.dataset.threeReady === "true", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  const readThreeStatus = async () => page.evaluate(() => {
    const canvas = document.querySelector("[data-three-scene]");
    const rect = canvas ? canvas.getBoundingClientRect() : null;
    const gl = canvas ? (canvas.getContext("webgl2") || canvas.getContext("webgl")) : null;
    const status = {
      mounted: Boolean(canvas && rect && rect.width >= window.innerWidth - 2 && rect.height >= window.innerHeight - 2),
      ready: canvas?.dataset.threeReady === "true",
      mode: canvas?.dataset.threeMode || "",
      frame: Number(canvas?.dataset.threeFrame || "0"),
      pointer: canvas?.dataset.threePointer || "",
      energy: 0
    };
    if (!canvas || !gl) return status;
    const samplePoints = [
      [0.5, 0.5], [0.34, 0.42], [0.66, 0.4], [0.28, 0.64],
      [0.72, 0.62], [0.5, 0.28], [0.42, 0.72], [0.58, 0.72]
    ];
    const pixel = new Uint8Array(4);
    for (const [x, y] of samplePoints) {
      gl.readPixels(
        Math.min(canvas.width - 1, Math.max(0, Math.floor(canvas.width * x))),
        Math.min(canvas.height - 1, Math.max(0, Math.floor(canvas.height * y))),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel
      );
      status.energy += pixel[0] + pixel[1] + pixel[2] + pixel[3];
    }
    return status;
  });

  const result = await page.evaluate(() => {
    const title = document.querySelector("h1");
    const hero = document.querySelector(".hero-visual");
    const consolePanel = document.querySelector(".console-panel");
    const canvas = document.getElementById("particle-field");
    const heroStyle = hero ? getComputedStyle(hero).backgroundImage : "";
    const heroRect = hero ? hero.getBoundingClientRect() : null;
    const panelRect = consolePanel ? consolePanel.getBoundingClientRect() : null;
    const titleRect = title ? title.getBoundingClientRect() : null;

    return {
      title: title ? title.textContent.replace(/\s+/g, "") : "",
      backgroundHasAsset: heroStyle.includes("hero-lab.png"),
      heroVisible: Boolean(heroRect && heroRect.width > 260 && heroRect.height > 300),
      panelVisible: Boolean(panelRect && panelRect.width > 240 && panelRect.height > 150),
      titleVisible: Boolean(titleRect && titleRect.width > 120 && titleRect.height > 80),
      canvasMounted: Boolean(canvas && canvas.width > 0 && canvas.height > 0),
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth
    };
  });

  const threeBefore = await readThreeStatus();
  await page.mouse.move(Math.floor(viewport.width * 0.78), Math.floor(viewport.height * 0.32));
  await page.waitForTimeout(220);
  await page.mouse.click(Math.floor(viewport.width * 0.72), Math.floor(viewport.height * 0.42));
  await page.waitForTimeout(280);
  const threeAfter = await readThreeStatus();

  const screenshotPath = path.join(outputDir, `visual-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  await page.locator('[data-view-target="giants"]').click();
  await page.waitForFunction(() => {
    const giants = document.querySelector('[data-view-panel="giants"]');
    const home = document.querySelector('[data-view-panel="home"]');
    return giants && giants.classList.contains("is-active") && !giants.hidden && home && home.hidden;
  });
  await page.waitForFunction(() => !document.body.classList.contains("is-transitioning"));
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const img = document.querySelector("[data-beast-slide].is-active .beast-model-image");
    const rect = img && img.getBoundingClientRect();
    const style = img ? getComputedStyle(img) : null;
    return img && img.complete && img.naturalWidth > 0 && rect && rect.width > 260 && rect.height > 160 && style.visibility === "visible" && Number(style.opacity) > 0.2;
  });
  const modelTransformBefore = await page.evaluate(() => (
    getComputedStyle(document.querySelector("[data-model-rotor]")).transform
  ));
  await page.locator("[data-rotate-right]").click();
  await page.waitForTimeout(250);
  const modelTransformAfter = await page.evaluate(() => (
    getComputedStyle(document.querySelector("[data-model-rotor]")).transform
  ));
  await page.locator('[data-model-mode="muscle"]').click();
  await page.locator("[data-scan-intensity]").fill("88");
  const beforeCarouselTitle = await page.evaluate(() => (
    document.querySelector("[data-beast-slide].is-active h3")?.textContent || ""
  ));
  await page.locator("[data-carousel-next]").click();
  await page.waitForFunction(() => {
    const img = document.querySelector("[data-beast-slide].is-active .beast-model-image");
    const rect = img && img.getBoundingClientRect();
    const style = img ? getComputedStyle(img) : null;
    return img && img.complete && img.naturalWidth > 0 && rect && rect.width > 260 && rect.height > 160 && style.visibility === "visible" && Number(style.opacity) > 0.2;
  });
  await page.waitForTimeout(900);
  const afterCarouselTitle = await page.evaluate(() => (
    document.querySelector("[data-beast-slide].is-active h3")?.textContent || ""
  ));
  const carouselPath = path.join(outputDir, `visual-carousel-${name}.png`);
  await page.screenshot({ path: carouselPath, fullPage: false });

  const carouselResult = await page.evaluate(() => {
    const carousel = document.querySelector(".beast-carousel");
    const modelStage = document.querySelector("[data-model-stage]");
    const modelRotor = document.querySelector("[data-model-rotor]");
    const scanValue = document.querySelector("[data-scan-intensity]")?.value;
    const activeSlide = document.querySelector("[data-beast-slide].is-active");
    const activeImage = activeSlide ? activeSlide.querySelector(".beast-model-image") : null;
    const activeTitle = activeSlide ? activeSlide.querySelector("h3") : null;
    const dots = document.querySelectorAll("[data-carousel-dot]");
    const rect = carousel ? carousel.getBoundingClientRect() : null;
    const stageRect = modelStage ? modelStage.getBoundingClientRect() : null;
    const rotorRect = modelRotor ? modelRotor.getBoundingClientRect() : null;
    const imageRect = activeImage ? activeImage.getBoundingClientRect() : null;
    const titleRect = activeTitle ? activeTitle.getBoundingClientRect() : null;
    const imageStyle = activeImage ? getComputedStyle(activeImage) : null;

    return {
      carouselVisible: Boolean(rect && rect.width > 300 && rect.height > 360),
      modelStageVisible: Boolean(stageRect && stageRect.width > 300 && stageRect.height > 300),
      modelRotorVisible: Boolean(rotorRect && rotorRect.width > 220 && rotorRect.height > 180),
      modelModeMuscle: Boolean(modelStage && modelStage.classList.contains("mode-muscle")),
      scanValue,
      activeSlideVisible: Boolean(activeSlide),
      activeImageVisible: Boolean(imageRect && imageRect.width > 260 && imageRect.height > 160 && imageStyle.visibility === "visible" && Number(imageStyle.opacity) > 0.2),
      activeTitleVisible: Boolean(titleRect && titleRect.width > 30 && titleRect.height > 24),
      dotCount: dots.length,
      selectedDotCount: Array.from(dots).filter((dot) => dot.classList.contains("is-active")).length
    };
  });

  const jumpPages = [
    { target: "genome", selector: ".genome-console", label: "genome forge" },
    { target: "habitat", selector: ".habitat-sim", label: "habitat simulator" },
    { target: "timeline", selector: ".timeline-lab", label: "timeline corridor" },
    { target: "command", selector: ".command-deck", label: "command deck" },
    { target: "archive", selector: ".archive-lab", label: "specimen archive" },
    { target: "signal", selector: ".signal-console", label: "neural interface" }
  ];
  const pageResults = [];

  for (const item of jumpPages) {
    await page.locator(`[data-view-target="${item.target}"]`).first().click();
    await page.waitForFunction((target) => {
      const panel = document.querySelector(`[data-view-panel="${target}"]`);
      const style = panel ? getComputedStyle(panel) : null;
      return panel && panel.classList.contains("is-active") && !panel.hidden && style && Number(style.opacity) > 0.72;
    }, item.target);
    await page.waitForFunction(() => !document.body.classList.contains("is-transitioning"));
    const pagePath = path.join(outputDir, `visual-${item.target}-${name}.png`);
    await page.screenshot({ path: pagePath, fullPage: false });
    const data = await page.evaluate((item) => {
      const panel = document.querySelector(`[data-view-panel="${item.target}"]`);
      const feature = document.querySelector(`[data-view-panel="${item.target}"] ${item.selector}`);
      const threeCanvas = document.querySelector("[data-three-scene]");
      const panelRect = panel ? panel.getBoundingClientRect() : null;
      const featureRect = feature ? feature.getBoundingClientRect() : null;
      return {
        label: item.label,
        target: item.target,
        screenshotPath: item.pagePath,
        threeMode: threeCanvas?.dataset.threeMode || "",
        active: Boolean(panel && panel.classList.contains("is-active") && !panel.hidden),
        panelVisible: Boolean(panelRect && panelRect.width > 300 && panelRect.height > 300),
        featureVisible: Boolean(featureRect && featureRect.width > 280 && featureRect.height > 180),
        featureInViewport: Boolean(featureRect && featureRect.bottom > 80 && featureRect.top < window.innerHeight - 80),
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth
      };
    }, { ...item, pagePath });

    const interaction = await (async () => {
      if (item.target === "genome") {
        const before = await page.locator("[data-gene-output]").textContent();
        const beforeName = await page.locator("[data-dino-name]").textContent();
        await page.locator("[data-gene-slider]").first().fill("98");
        await page.locator('[data-gene-target="aerial"]').click();
        await page.locator('[data-gene-key="membrane"]').fill("96");
        await page.locator('[data-gene-key="speed"]').fill("84");
        await page.waitForTimeout(120);
        const after = await page.locator("[data-gene-output]").textContent();
        const afterName = await page.locator("[data-dino-name]").textContent();
        const genomeGameOk = await page.evaluate(() => {
          const model = document.querySelector("[data-gene-effect-layer]");
          const removedRoughModel = !document.querySelector(".dino-body, .dino-head, .dino-tail, .dino-limb, .dino-wing, .dino-fin, .dino-teeth, .dino-armor, .dino-crest");
          const score = document.querySelector("[data-dino-score]")?.textContent || "";
          const activeTarget = document.querySelector('[data-gene-target="aerial"]')?.classList.contains("is-selected");
          return Boolean(model && model.children.length > 12 && removedRoughModel && /%/.test(score) && activeTarget);
        });
        return { ok: before !== after && beforeName !== afterName && /REBUILD/.test(after || "") && genomeGameOk, name: "genome mixer" };
      }

      if (item.target === "habitat") {
        const beforeZoom = await page.locator("[data-earth-zoom]").inputValue();
        await page.locator("[data-earth-zoom-in]").click();
        await page.waitForTimeout(180);
        const afterZoom = await page.locator("[data-earth-zoom]").inputValue();
        const canvasOk = await page.evaluate(() => {
          const canvas = document.querySelector("[data-earth-canvas]");
          if (!canvas) return false;
          const rect = canvas.getBoundingClientRect();
          const context = canvas.getContext("2d");
          if (!context || rect.width < 260 || rect.height < 220) return false;
          const sample = context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
          return sample[3] > 0 && (sample[0] + sample[1] + sample[2]) > 12;
        });
        const canvasBox = await page.locator("[data-earth-canvas]").boundingBox();
        if (canvasBox) {
          await page.mouse.move(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.5);
          await page.mouse.down();
          await page.mouse.move(canvasBox.x + canvasBox.width * 0.64, canvasBox.y + canvasBox.height * 0.42, { steps: 6 });
          await page.mouse.up();
          await page.waitForTimeout(120);
        }
        const rotated = await page.evaluate(() => Number(document.querySelector("[data-earth-canvas]")?.dataset.rotation || "0"));
        await page.locator('[data-habitat-scenario="ash"]').click();
        const active = await page.evaluate(() => (
          document.querySelector("[data-habitat-map]")?.dataset.scenario === "ash"
          && document.querySelector('[data-habitat-scenario="ash"]')?.classList.contains("is-selected")
          && /火山|岛弧|陆缘/.test(document.querySelector("[data-shelf-label]")?.textContent || "")
        ));
        return { ok: active && canvasOk && Number(afterZoom) > Number(beforeZoom) && rotated !== 0, name: "habitat globe" };
      }

      if (item.target === "timeline") {
        await page.locator('[data-timeline-era="cretaceous"]').click();
        const active = await page.evaluate(() => (
          document.querySelector("[data-rift-viewer]")?.dataset.activeEra === "cretaceous"
          && document.querySelector('[data-timeline-era="cretaceous"]')?.classList.contains("is-selected")
        ));
        return { ok: active, name: "timeline rift" };
      }

      if (item.target === "command") {
        await page.locator('[data-command-action="cooling"]').click();
        const active = await page.evaluate(() => (
          document.querySelector("[data-command-status]")?.textContent?.includes("COOLING")
          && document.querySelector('[data-command-action="cooling"]')?.classList.contains("is-selected")
        ));
        return { ok: active, name: "command action" };
      }

      if (item.target === "archive") {
        await page.locator('[data-archive-card="amber"]').click();
        const active = await page.evaluate(() => (
          document.querySelector("[data-archive-preview]")?.dataset.activeSpecimen === "amber"
          && document.querySelector('[data-archive-card="amber"]')?.classList.contains("is-selected")
        ));
        return { ok: active, name: "archive preview" };
      }

      if (item.target === "signal") {
        await page.locator('[data-signal-node="memory"]').click();
        const active = await page.evaluate(() => (
          document.querySelector("[data-signal-map]")?.dataset.channel === "memory"
          && document.querySelector('[data-signal-node="memory"]')?.classList.contains("is-selected")
        ));
        return { ok: active, name: "signal node" };
      }

      return { ok: true, name: "no interaction" };
    })();
    data.interaction = interaction;
    pageResults.push(data);
  }
  await page.close();

  const failures = [];
  if (result.title.length < 6) failures.push("title text is missing");
  if (!result.backgroundHasAsset) failures.push("hero background image is not applied");
  if (!result.heroVisible) failures.push("hero visual is too small or hidden");
  if (!result.panelVisible) failures.push("console panel is too small or hidden");
  if (!result.titleVisible) failures.push("title is too small or hidden");
  if (!result.canvasMounted) failures.push("particle canvas is not mounted");
  if (!threeBefore.mounted || !threeBefore.ready) failures.push("Three.js full-bleed canvas is not ready");
  if (threeBefore.energy < 40) failures.push("Three.js canvas pixel sample is blank");
  if (threeAfter.frame <= threeBefore.frame) failures.push("Three.js animation frame did not advance");
  if (threeAfter.energy < 40) failures.push("Three.js canvas became blank after interaction");
  if (!threeAfter.pointer) failures.push("Three.js scene did not receive pointer input");
  if (result.bodyWidth > result.viewportWidth + 2) failures.push("page has horizontal overflow");
  if (!carouselResult.carouselVisible) failures.push("carousel is too small or hidden");
  if (!carouselResult.modelStageVisible) failures.push("interactive 3D stage is too small or hidden");
  if (!carouselResult.modelRotorVisible) failures.push("interactive 3D rotor is too small or hidden");
  if (modelTransformBefore === modelTransformAfter) failures.push("rotate-right control did not change model transform");
  if (carouselResult.scanValue !== "88") failures.push("scan intensity control did not update");
  if (!carouselResult.activeSlideVisible) failures.push("carousel has no active slide");
  if (!carouselResult.activeImageVisible) failures.push("active carousel model image is not visible");
  if (!carouselResult.activeTitleVisible) failures.push("active carousel title is not visible");
  if (carouselResult.dotCount < 8) failures.push("expanded carousel dots are missing");
  if (carouselResult.selectedDotCount !== 1) failures.push("carousel should have exactly one selected dot");
  if (!carouselResult.modelModeMuscle) failures.push("modeling mode control did not switch to muscle mode");
  if (beforeCarouselTitle === afterCarouselTitle) failures.push("carousel next button did not change the active beast");
  for (const pageResult of pageResults) {
    if (!pageResult.active) failures.push(`${pageResult.label} did not become the active page`);
    if (!pageResult.panelVisible) failures.push(`${pageResult.label} panel is too small or hidden`);
    if (pageResult.threeMode !== pageResult.target) failures.push(`${pageResult.label} did not sync Three.js scene mode`);
    if (!pageResult.featureVisible) failures.push(`${pageResult.label} feature layout is too small or hidden`);
    if (!pageResult.featureInViewport) failures.push(`${pageResult.label} feature layout is not visible in the viewport`);
    if (!pageResult.interaction?.ok) failures.push(`${pageResult.label} ${pageResult.interaction?.name || "interaction"} did not update state`);
    if (pageResult.bodyWidth > pageResult.viewportWidth + 2) failures.push(`${pageResult.label} page has horizontal overflow`);
  }

  return { name, screenshotPath, carouselPath, pageResults, failures, result, threeBefore, threeAfter };
}

(async () => {
  const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || undefined;
  const browser = await chromium.launch({
    executablePath,
    args: ["--disable-gpu", "--no-first-run"]
  });
  const reports = [
    await checkViewport(browser, "desktop", { width: 1440, height: 1000 }),
    await checkViewport(browser, "mobile", { width: 390, height: 844 })
  ];
  await browser.close();

  for (const report of reports) {
    console.log(`${report.name}: ${report.screenshotPath}`);
    console.log(`${report.name} carousel: ${report.carouselPath}`);
    for (const pageResult of report.pageResults) {
      console.log(`${report.name} ${pageResult.target}: ${pageResult.screenshotPath}`);
    }
    for (const failure of report.failures) {
      console.log(`FAIL ${failure}`);
    }
  }

  const failed = reports.flatMap((report) => report.failures);
  if (failed.length) {
    console.error(`\n${failed.length} visual check(s) failed.`);
    process.exit(1);
  }

  console.log("\nVisual checks passed.");
})();
