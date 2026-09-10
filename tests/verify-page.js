const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const checks = [];

function check(name, condition) {
  checks.push({ name, passed: Boolean(condition) });
}

check("index.html exists", exists("index.html"));
check("styles.css exists", exists("styles.css"));
check("script.js exists", exists("script.js"));
check("generated hero image exists", exists(path.join("assets", "hero-lab.png")));
check("generated T-rex model image exists", exists(path.join("assets", "beast-trex.png")));
check("generated mammoth model image exists", exists(path.join("assets", "beast-mammoth.png")));
check("generated mosasaurus model image exists", exists(path.join("assets", "beast-mosasaurus.png")));
check("generated pterosaur model image exists", exists(path.join("assets", "beast-pterosaur.png")));
check("generated triceratops model image exists", exists(path.join("assets", "beast-triceratops.png")));
check("generated stegosaurus model image exists", exists(path.join("assets", "beast-stegosaurus.png")));
check("generated spinosaurus model image exists", exists(path.join("assets", "beast-spinosaurus.png")));
check("generated megalodon model image exists", exists(path.join("assets", "beast-megalodon.png")));

let html = "";
let css = "";
let js = "";

if (exists("index.html")) html = read("index.html");
if (exists("styles.css")) css = read("styles.css");
if (exists("script.js")) js = read("script.js");

check("HTML links stylesheet", /href=["']styles\.css["']/.test(html));
check("HTML loads script", /src=["']script\.js["']/.test(html));
check("HTML includes particle canvas", /<canvas[^>]+id=["']particle-field["']/.test(html));
check("HTML includes full-bleed Three.js canvas and CDN runtime", /id=["']three-biosphere["']/.test(html) && /data-three-scene/.test(html) && /three@0\.148\.0/.test(html) && /src=["']script\.js["']/.test(html));
check("HTML contains ancient creature content", /恐龙|菊石|三叶虫|琥珀|化石/.test(html));
check("HTML contains future technology content", /全息|量子|神经|扫描|界面/.test(html));
check("HTML includes prehistoric beast carousel", /class=["'][^"']*beast-carousel/.test(html));
check("HTML includes carousel track", /data-carousel-track/.test(html));
check("HTML includes manual carousel buttons", /data-carousel-prev/.test(html) && /data-carousel-next/.test(html));
check("HTML includes carousel dots", (html.match(/data-carousel-dot/g) || []).length >= 8);
check("HTML includes at least eight beast slides", (html.match(/data-beast-slide/g) || []).length >= 8);
check("HTML includes expanded giant beast exhibit content", /霸王龙|猛犸象|沧龙|风神翼龙|三角龙|剑龙|棘龙|巨齿鲨/.test(html));
check("HTML uses expanded view navigation buttons", (html.match(/data-view-target/g) || []).length >= 12);
check("HTML includes expanded independent view panels", (html.match(/data-view-panel/g) || []).length >= 8);
check("HTML includes home portal jump grid", /class=["'][^"']*portal-grid/.test(html) && (html.match(/class=["'][^"']*portal-card/g) || []).length >= 4);
check("HTML includes four new jump pages", /data-view-panel=["']genome["']/.test(html) && /data-view-panel=["']habitat["']/.test(html) && /data-view-panel=["']timeline["']/.test(html) && /data-view-panel=["']command["']/.test(html));
check("HTML includes global transition gate", /class=["'][^"']*transition-gate/.test(html));
check("HTML includes lab page interaction controls", /data-gene-slider/.test(html) && /data-habitat-scenario/.test(html) && /data-timeline-era/.test(html) && /data-command-action/.test(html) && /data-archive-card/.test(html) && /data-signal-node/.test(html));
check(
  "HTML includes genome mixing mini-game",
  /data-gene-game/.test(html)
    && /data-dino-model/.test(html)
    && /data-dino-base-model/.test(html)
    && /data-gene-target/.test(html)
    && /data-dino-name/.test(html)
    && /data-dino-stability/.test(html)
    && (html.match(/data-gene-key/g) || []).length >= 10
);
check("HTML includes zoomable ancient earth globe", /data-earth-canvas/.test(html) && /data-earth-zoom-in/.test(html) && /data-earth-zoom-out/.test(html) && /data-earth-reset/.test(html) && /data-earth-zoom/.test(html) && /大陆架|浅海|古地球/.test(html));
check("HTML describes map-backed shelf modeling", /公开世界地图|0-200m|等深线/.test(html));
check("HTML nav no longer uses section anchor hrefs", !/<nav[\s\S]*href=["']#/i.test(html));
check("HTML includes interactive 3D model stage", /data-model-stage/.test(html) && /class=["'][^"']*interactive-3d-stage/.test(html));
check("HTML includes 3D controls", /data-rotate-left/.test(html) && /data-rotate-right/.test(html) && /data-reset-model/.test(html));
check("HTML includes scan intensity control", /data-scan-intensity/.test(html));
check("HTML uses high-detail beast model images", (html.match(/class=["'][^"']*beast-model-image/g) || []).length >= 8);
check("HTML includes topology scan layers", (html.match(/class=["'][^"']*topology-slice/g) || []).length >= 8);
check("HTML includes modeling mode controls", (html.match(/data-model-mode/g) || []).length >= 3);
check("HTML includes model vertex nodes", (html.match(/class=["'][^"']*mesh-node/g) || []).length >= 6);
check("HTML includes anatomy layer overlays", /class=["'][^"']*anatomy-layer/.test(html));
check("HTML includes rigging and surface detail overlays", (html.match(/class=["'][^"']*rig-line/g) || []).length >= 4 && (html.match(/class=["'][^"']*surface-facet/g) || []).length >= 3);
check("HTML has accessible main landmark", /<main\b/.test(html));
check("CSS references project hero asset", /assets\/hero-lab\.png/.test(css));
check("CSS styles full-bleed Three.js layer", /#three-biosphere/.test(css) && /pointer-events:\s*none/.test(css) && /three-unavailable/.test(css));
check("CSS defines multiple animations", (css.match(/@keyframes/g) || []).length >= 4);
check("CSS includes responsive media query", /@media\s*\(max-width:\s*760px\)/.test(css));
check("CSS respects reduced motion", /prefers-reduced-motion/.test(css));
check("CSS styles carousel", /\.beast-carousel/.test(css) && /\.beast-slide/.test(css));
check("CSS adds rich motion keyframes", /holoFlicker/.test(css) && /orbitDrift/.test(css) && /slideReveal/.test(css));
check("CSS styles independent view panels", /\.view-panel/.test(css) && /\.view-panel\.is-active/.test(css));
check("CSS styles expanded portal and page layouts", /\.portal-grid/.test(css) && /\.lab-page/.test(css) && /\.genome-console/.test(css) && /\.habitat-sim/.test(css) && /\.timeline-stream/.test(css) && /\.command-deck/.test(css));
check("CSS styles genome mixing game and gene effect overlay", /\.gene-game/.test(css) && /\.gene-model-stage/.test(css) && /\.gene-beast-base/.test(css) && /\.gene-tech-overlay/.test(css) && /\.gene-effect-node/.test(css) && /\.gene-scoreboard/.test(css) && /\.target-grid/.test(css));
check("Genome workshop no longer ships rough SVG creature body parts", !/dino-(body|head|tail|limb|wing|fin|teeth|armor|crest|muscle|detail)|data-dino-svg/.test(`${html}\n${css}\n${js}`));
check("CSS styles rich interactive lab states", /\.transition-gate/.test(css) && /\.rift-viewer/.test(css) && /\.archive-preview/.test(css) && /\.signal-console/.test(css) && /is-selected/.test(css));
check("CSS styles 3D ancient earth globe", /\.earth-stage/.test(css) && /\.earth-canvas/.test(css) && /\.earth-controls/.test(css) && /\.shelf-readout/.test(css));
check("CSS styles 3D interactive stage", /\.interactive-3d-stage/.test(css) && /preserve-3d/.test(css));
check("CSS adds 3D animation keyframes", /modelFloat/.test(css) && /coreSpin/.test(css));
check("CSS styles 3D model image treatment", /\.beast-model-image/.test(css) && /modelResolve/.test(css));
check("CSS styles topology scan treatment", /\.topology-slice/.test(css) && /meshSweep/.test(css));
check("CSS styles richer modeling layers", /\.mesh-node/.test(css) && /\.anatomy-layer/.test(css));
check("CSS styles rigging and surface detail overlays", /\.rig-line/.test(css) && /\.surface-facet/.test(css));
check("CSS supports modeling modes", /mode-skeleton/.test(css) && /mode-topology/.test(css) && /mode-muscle/.test(css));
check("JS uses requestAnimationFrame", /requestAnimationFrame/.test(js));
check("JS defines particle animation", /class\s+Particle|function\s+Particle/.test(js));
check("JS handles pointer parallax", /pointermove/.test(js));
check("JS respects reduced motion", /prefers-reduced-motion/.test(js));
check("JS implements Three.js biosphere scene", /window\.THREE/.test(js) && /class\s+BioThreeScene/.test(js) && /initThreeBiosphere/.test(js) && /createShockwave/.test(js) && /threeModeConfigs/.test(js));
check("JS links Three.js scene to navigation and gene controls", /bioThreeScene\?\.setMode\(targetName\)/.test(js) && /bioThreeScene\?\.setGeneIntensity/.test(js) && /bioThreeScene\?\.pulse/.test(js));
check("JS implements carousel state", /currentSlide/.test(js) && /showSlide/.test(js));
check("JS handles manual carousel clicks", /data-carousel-next/.test(js) && /data-carousel-prev/.test(js));
check("JS handles keyboard carousel navigation", /keydown/.test(js) && /ArrowRight/.test(js) && /ArrowLeft/.test(js));
check("JS implements carousel autoplay", /setInterval\(advanceSlide/.test(js));
check("JS implements view switching", /setActiveView/.test(js) && /data-view-target/.test(js));
check("JS implements draggable 3D model", /pointerdown/.test(js) && /pointerup/.test(js) && /updateModelTransform/.test(js));
check("JS implements 3D model controls", /data-rotate-left/.test(js) && /data-reset-model/.test(js));
check("JS implements scan intensity control", /data-scan-intensity/.test(js));
check("JS implements modeling mode switching", /setModelMode/.test(js) && /data-model-mode/.test(js));
check("JS implements rich lab page interactions", /bindLabInteractions/.test(js) && /updateGenomeForge/.test(js) && /setHabitatScenario/.test(js) && /setTimelineEra/.test(js) && /setArchiveSpecimen/.test(js) && /setSignalNode/.test(js) && /triggerViewTransition/.test(js));
check(
  "JS implements gene-driven dinosaur generation",
  /geneDefinitions/.test(js)
    && /geneTargets/.test(js)
    && /computeDinoGenome/.test(js)
    && /renderGeneratedDino/.test(js)
    && /geneModelAssets/.test(js)
    && /updateGeneBaseModel/.test(js)
    && /buildGeneEffectLayer/.test(js)
    && /scoreGeneTarget/.test(js)
    && /setGeneTarget/.test(js)
);
check("JS implements zoomable ancient earth rendering", /bindEarthGlobe/.test(js) && /drawAncientEarth/.test(js) && /projectEarthPoint/.test(js) && /updateEarthZoom/.test(js));
check("JS includes layered detailed world and shelf data", /outerShelfZones/.test(js) && /earthRidgeLines/.test(js) && /east-asia-shelf/.test(js) && /sunda-shelf/.test(js) && /sahul-shelf/.test(js));
check(
  "JS includes high-density bathymetry shelf contour modeling",
  /highDensityShelfContours/.test(js)
    && /densifyGeoLine/.test(js)
    && /drawBathymetryContour/.test(js)
    && /drawShelfContourBand/.test(js)
    && /east-china-sea-200m/.test(js)
    && /south-china-sea-1000m/.test(js)
    && /japan-trench-front/.test(js)
    && /grand-banks-200m/.test(js)
);
check(
  "JS includes modeled shelf surface relief and sediment detail",
  /shelfReliefCells/.test(js)
    && /reefTerraceCells/.test(js)
    && /drawShelfReliefMesh/.test(js)
    && /drawShelfSedimentTexture/.test(js)
    && /drawReefTerraceCells/.test(js)
    && /deterministicNoise/.test(js)
);

const failed = checks.filter((item) => !item.passed);

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
}

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll structural checks passed.");
