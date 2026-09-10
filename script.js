const canvas = document.getElementById("particle-field");
const ctx = canvas.getContext("2d");
const threeCanvas = document.querySelector("[data-three-scene]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const parallaxTarget = document.querySelector("[data-parallax]");
const viewButtons = Array.from(document.querySelectorAll("[data-view-target]"));
const viewPanels = Array.from(document.querySelectorAll("[data-view-panel]"));
const metricNodes = {
  match: document.querySelector('[data-metric="match"]'),
  neural: document.querySelector('[data-metric="neural"]'),
  noise: document.querySelector('[data-metric="noise"]'),
  scan: document.querySelector('[data-metric="scan"]')
};
const carousel = document.querySelector("[data-carousel]");
const carouselTrack = document.querySelector("[data-carousel-track]");
const slides = Array.from(document.querySelectorAll("[data-beast-slide]"));
const dots = Array.from(document.querySelectorAll("[data-carousel-dot]"));
const nextButton = document.querySelector("[data-carousel-next]");
const prevButton = document.querySelector("[data-carousel-prev]");
const modelStage = document.querySelector("[data-model-stage]");
const modelRotor = document.querySelector("[data-model-rotor]");
const stageModel = document.querySelector("[data-stage-model]");
const stageTitle = document.querySelector("[data-stage-title]");
const rotateLeftButton = document.querySelector("[data-rotate-left]");
const rotateRightButton = document.querySelector("[data-rotate-right]");
const resetModelButton = document.querySelector("[data-reset-model]");
const autoSpinButton = document.querySelector("[data-auto-spin]");
const scanIntensity = document.querySelector("[data-scan-intensity]");
const modelModeButtons = Array.from(document.querySelectorAll("[data-model-mode]"));
const earthCanvas = document.querySelector("[data-earth-canvas]");
const earthContext = earthCanvas?.getContext("2d");
const earthZoomInput = document.querySelector("[data-earth-zoom]");
const earthZoomInButton = document.querySelector("[data-earth-zoom-in]");
const earthZoomOutButton = document.querySelector("[data-earth-zoom-out]");
const earthResetButton = document.querySelector("[data-earth-reset]");
const earthReadout = document.querySelector("[data-earth-readout]");
const shelfLabel = document.querySelector("[data-shelf-label]");

let width = 0;
let height = 0;
let particles = [];
let frame = 0;
let animationId = 0;
let currentSlide = 0;
let carouselTimer = 0;
let carouselPaused = false;
let transitionTimer = 0;
let bioThreeScene = null;
const modelState = {
  rotateX: -8,
  rotateY: 18,
  dragging: false,
  lastX: 0,
  lastY: 0,
  autoSpin: true
};
const earthState = {
  baseYaw: -108,
  basePitch: -10,
  width: 0,
  height: 0,
  ratio: 1,
  zoom: 1,
  yaw: -108,
  pitch: -10,
  dragging: false,
  lastX: 0,
  lastY: 0,
  scenario: "storm"
};

const threeModeConfigs = {
  home: { color: "#62f4e6", accent: "#f0b85f", cameraZ: 8.1, portalScale: 1.08, helix: 0.62, globe: 0.18, shardSpread: 1.15 },
  giants: { color: "#f0b85f", accent: "#62f4e6", cameraZ: 7.3, portalScale: 1.28, helix: 0.42, globe: 0.12, shardSpread: 1.55 },
  genome: { color: "#62f4e6", accent: "#f0b85f", cameraZ: 7.5, portalScale: 0.92, helix: 1, globe: 0.08, shardSpread: 1.05 },
  habitat: { color: "#66d3ff", accent: "#f0b85f", cameraZ: 7.6, portalScale: 0.84, helix: 0.36, globe: 0.92, shardSpread: 1.22 },
  timeline: { color: "#f0b85f", accent: "#62f4e6", cameraZ: 7.8, portalScale: 1.36, helix: 0.28, globe: 0.24, shardSpread: 1.75 },
  command: { color: "#62f4e6", accent: "#efe6d1", cameraZ: 7.1, portalScale: 1.12, helix: 0.5, globe: 0.18, shardSpread: 1.35 },
  archive: { color: "#f0b85f", accent: "#efe6d1", cameraZ: 8.5, portalScale: 0.98, helix: 0.22, globe: 0.14, shardSpread: 1.8 },
  signal: { color: "#62f4e6", accent: "#f0b85f", cameraZ: 7.2, portalScale: 1.18, helix: 0.78, globe: 0.24, shardSpread: 1.32 }
};

class BioThreeScene {
  constructor(THREE, sceneCanvas) {
    this.THREE = THREE;
    this.canvas = sceneCanvas;
    this.clock = new THREE.Clock();
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerTarget = new THREE.Vector2(0, 0);
    this.mode = "home";
    this.config = threeModeConfigs.home;
    this.frameCount = 0;
    this.geneIntensity = 0.72;
    this.pulsePower = 0;
    this.shockwaves = [];
    this.shards = [];
    this.helixNodes = [];
    this.materials = {};
  }

  start() {
    const { THREE } = this;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    this.camera.position.set(0, 0, this.config.cameraZ);

    this.createMaterials();
    this.createObjects();
    this.bindEvents();
    this.resize();
    this.animate();
    this.canvas.dataset.threeReady = "true";
  }

  createMaterials() {
    const { THREE } = this;
    this.materials.core = new THREE.MeshStandardMaterial({
      color: this.config.color,
      emissive: this.config.color,
      emissiveIntensity: 1.9,
      roughness: 0.22,
      metalness: 0.68,
      transparent: true,
      opacity: 0.74,
      wireframe: true
    });
    this.materials.ring = new THREE.MeshBasicMaterial({
      color: this.config.color,
      transparent: true,
      opacity: 0.62,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.materials.accent = new THREE.MeshBasicMaterial({
      color: this.config.accent,
      transparent: true,
      opacity: 0.54,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.materials.node = new THREE.MeshBasicMaterial({
      color: this.config.color,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending
    });
    this.materials.points = new THREE.PointsMaterial({
      color: this.config.color,
      size: 0.022,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.materials.line = new THREE.LineBasicMaterial({
      color: this.config.color,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.materials.globe = new THREE.MeshBasicMaterial({
      color: "#66d3ff",
      transparent: true,
      opacity: 0.22,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  createObjects() {
    const { THREE } = this;
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.scene.add(new THREE.AmbientLight(0x9ffff5, 0.8));
    const keyLight = new THREE.PointLight(0x62f4e6, 5.2, 28);
    keyLight.position.set(3.8, 2.4, 5.4);
    this.scene.add(keyLight);
    const amberLight = new THREE.PointLight(0xf0b85f, 3.4, 24);
    amberLight.position.set(-4.2, -2.3, 3.4);
    this.scene.add(amberLight);

    this.portalGroup = new THREE.Group();
    this.root.add(this.portalGroup);
    [0, 1, 2, 3].forEach((index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.88 + index * 0.34, 0.012 + index * 0.003, 14, 180),
        index % 2 ? this.materials.accent.clone() : this.materials.ring.clone()
      );
      ring.rotation.set(Math.PI / 2 + index * 0.18, index * 0.34, index * 0.72);
      ring.userData.spin = 0.15 + index * 0.05;
      this.portalGroup.add(ring);
    });

    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.88, 4), this.materials.core);
    this.portalGroup.add(this.core);

    this.knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.18, 0.016, 220, 10, 3, 7),
      this.materials.ring.clone()
    );
    this.portalGroup.add(this.knot);

    this.helixGroup = new THREE.Group();
    this.root.add(this.helixGroup);
    this.createHelix();
    this.createParticleNebula();
    this.createShards();
    this.createGlobe();
  }

  createHelix() {
    const { THREE } = this;
    this.helixSegments = 96;
    this.helixPositionsA = new Float32Array(this.helixSegments * 3);
    this.helixPositionsB = new Float32Array(this.helixSegments * 3);
    const geometryA = new THREE.BufferGeometry();
    const geometryB = new THREE.BufferGeometry();
    geometryA.setAttribute("position", new THREE.BufferAttribute(this.helixPositionsA, 3));
    geometryB.setAttribute("position", new THREE.BufferAttribute(this.helixPositionsB, 3));
    this.helixLineA = new THREE.Line(geometryA, this.materials.line.clone());
    this.helixLineB = new THREE.Line(geometryB, this.materials.accent.clone());
    this.helixGroup.add(this.helixLineA, this.helixLineB);

    const nodeGeometry = new THREE.SphereGeometry(0.036, 10, 10);
    for (let index = 0; index < this.helixSegments; index += 6) {
      const nodeA = new THREE.Mesh(nodeGeometry, this.materials.node.clone());
      const nodeB = new THREE.Mesh(nodeGeometry, this.materials.accent.clone());
      nodeA.userData = { index, strand: "a" };
      nodeB.userData = { index, strand: "b" };
      this.helixNodes.push(nodeA, nodeB);
      this.helixGroup.add(nodeA, nodeB);
    }
  }

  createParticleNebula() {
    const { THREE } = this;
    const count = 1600;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 2.6 + Math.random() * 7.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[index * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.72;
      positions[index * 3 + 2] = Math.cos(phi) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.nebula = new THREE.Points(geometry, this.materials.points);
    this.scene.add(this.nebula);
  }

  createShards() {
    const { THREE } = this;
    const geometries = [
      new THREE.TetrahedronGeometry(0.12, 1),
      new THREE.OctahedronGeometry(0.1, 1),
      new THREE.DodecahedronGeometry(0.09, 0)
    ];
    for (let index = 0; index < 34; index += 1) {
      const mesh = new THREE.Mesh(
        geometries[index % geometries.length],
        index % 3 === 0 ? this.materials.accent.clone() : this.materials.ring.clone()
      );
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.4 + Math.random() * 3.2;
      mesh.position.set(Math.cos(angle) * radius, -1.8 + Math.random() * 3.8, Math.sin(angle) * radius * 0.7);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = {
        angle,
        radius,
        speed: 0.08 + Math.random() * 0.18,
        lift: -1.8 + Math.random() * 3.8,
        phase: Math.random() * Math.PI * 2
      };
      this.shards.push(mesh);
      this.root.add(mesh);
    }
  }

  createGlobe() {
    const { THREE } = this;
    this.globeGroup = new THREE.Group();
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 28), this.materials.globe);
    this.globeGroup.add(globe);
    for (let index = 0; index < 5; index += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.25 + index * 0.04, 0.006, 8, 120),
        this.materials.ring.clone()
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = index * 0.32;
      ring.material.opacity = 0.18;
      this.globeGroup.add(ring);
    }
    this.globeGroup.position.set(2.4, -0.74, -0.9);
    this.root.add(this.globeGroup);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (event) => {
      this.pointerTarget.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      this.pointerTarget.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      this.canvas.dataset.threePointer = `${this.pointerTarget.x.toFixed(2)},${this.pointerTarget.y.toFixed(2)}`;
    });
    window.addEventListener("pointerdown", (event) => {
      this.createShockwave(event.clientX, event.clientY);
      this.pulse(0.95);
    });
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const widthPx = Math.max(1, window.innerWidth);
    const heightPx = Math.max(1, window.innerHeight);
    this.renderer.setSize(widthPx, heightPx, false);
    this.camera.aspect = widthPx / heightPx;
    this.camera.updateProjectionMatrix();
    this.canvas.dataset.threeSize = `${widthPx}x${heightPx}`;
  }

  setMode(modeName) {
    this.mode = threeModeConfigs[modeName] ? modeName : "home";
    this.config = threeModeConfigs[this.mode];
    this.canvas.dataset.threeMode = this.mode;
    this.applyPalette();
    this.pulse(0.42);
  }

  setGeneIntensity(value) {
    this.geneIntensity = Math.max(0.2, Math.min(1.25, value || 0.7));
    this.pulse(0.16);
  }

  pulse(amount = 0.5) {
    this.pulsePower = Math.min(2.2, this.pulsePower + amount);
  }

  applyPalette() {
    const { THREE } = this;
    const color = new THREE.Color(this.config.color);
    const accent = new THREE.Color(this.config.accent);
    Object.values(this.materials).forEach((material) => {
      if (!material?.color) return;
      material.color.lerp(material === this.materials.accent ? accent : color, 0.82);
      if (material.emissive) material.emissive.copy(color);
    });
    this.scene.traverse((object) => {
      const material = object.material;
      if (!material?.color) return;
      const target = object.parent === this.globeGroup ? new THREE.Color("#66d3ff") : (material === this.materials.accent ? accent : color);
      material.color.lerp(target, 0.34);
      if (material.emissive) material.emissive.lerp(color, 0.42);
    });
  }

  createShockwave(clientX, clientY) {
    if (!this.camera) return;
    const { THREE } = this;
    const normalized = new THREE.Vector3(
      (clientX / Math.max(1, window.innerWidth)) * 2 - 1,
      -((clientY / Math.max(1, window.innerHeight)) * 2 - 1),
      0.42
    );
    normalized.unproject(this.camera);
    const direction = normalized.sub(this.camera.position).normalize();
    const distance = Math.abs((this.camera.position.z - 0.6) / Math.max(0.001, Math.abs(direction.z)));
    const position = this.camera.position.clone().add(direction.multiplyScalar(distance));
    const material = this.materials.accent.clone();
    material.opacity = 0.78;
    const wave = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.009, 8, 96), material);
    wave.position.copy(position);
    wave.rotation.set(Math.PI / 2 + this.pointer.y * 0.24, this.pointer.x * 0.28, Math.random() * Math.PI);
    wave.userData.age = 0;
    this.scene.add(wave);
    this.shockwaves.push(wave);
  }

  updateHelix(time) {
    const spread = 2.14 + this.geneIntensity * 0.22;
    const radius = 0.42 + this.geneIntensity * 0.24;
    for (let index = 0; index < this.helixSegments; index += 1) {
      const progress = index / (this.helixSegments - 1);
      const x = (progress - 0.5) * spread * 2;
      const angle = progress * Math.PI * 8 + time * (1.15 + this.geneIntensity * 0.28);
      this.helixPositionsA[index * 3] = x;
      this.helixPositionsA[index * 3 + 1] = Math.sin(angle) * radius;
      this.helixPositionsA[index * 3 + 2] = Math.cos(angle) * radius;
      this.helixPositionsB[index * 3] = x;
      this.helixPositionsB[index * 3 + 1] = Math.sin(angle + Math.PI) * radius;
      this.helixPositionsB[index * 3 + 2] = Math.cos(angle + Math.PI) * radius;
    }
    this.helixLineA.geometry.attributes.position.needsUpdate = true;
    this.helixLineB.geometry.attributes.position.needsUpdate = true;

    this.helixNodes.forEach((node) => {
      const source = node.userData.strand === "a" ? this.helixPositionsA : this.helixPositionsB;
      const index = node.userData.index;
      node.position.set(source[index * 3], source[index * 3 + 1], source[index * 3 + 2]);
      node.scale.setScalar(0.82 + this.geneIntensity * 0.42 + Math.sin(time * 3 + index) * 0.08);
    });
  }

  updateShockwaves(delta) {
    this.shockwaves = this.shockwaves.filter((wave) => {
      wave.userData.age += delta;
      const progress = wave.userData.age / 1.4;
      wave.scale.setScalar(1 + progress * 12);
      wave.material.opacity = Math.max(0, 0.78 * (1 - progress));
      wave.rotation.z += delta * 0.8;
      if (progress >= 1) {
        this.scene.remove(wave);
        wave.geometry.dispose();
        wave.material.dispose();
        return false;
      }
      return true;
    });
  }

  animate() {
    const delta = Math.min(0.05, this.clock.getDelta());
    const time = this.clock.elapsedTime;
    this.frameCount += 1;
    this.pointer.lerp(this.pointerTarget, 0.045);
    this.pulsePower *= 0.92;

    const motionScale = reduceMotion.matches ? 0.18 : 1;
    const pulseScale = 1 + this.pulsePower * 0.045;
    this.camera.position.x += (this.pointer.x * 0.72 - this.camera.position.x) * 0.035;
    this.camera.position.y += (this.pointer.y * 0.42 - this.camera.position.y) * 0.035;
    this.camera.position.z += (this.config.cameraZ - this.camera.position.z) * 0.035;
    this.camera.lookAt(0, 0, 0);

    this.root.rotation.y = Math.sin(time * 0.08) * 0.1 + this.pointer.x * 0.18;
    this.root.rotation.x = Math.cos(time * 0.07) * 0.05 - this.pointer.y * 0.1;
    this.portalGroup.scale.lerp(new this.THREE.Vector3(this.config.portalScale * pulseScale, this.config.portalScale * pulseScale, this.config.portalScale * pulseScale), 0.07);
    this.portalGroup.rotation.z += delta * 0.18 * motionScale;
    this.portalGroup.children.forEach((child, index) => {
      child.rotation.z += delta * (child.userData.spin || 0.08) * (index % 2 ? -1 : 1) * motionScale;
      child.rotation.x += delta * 0.06 * motionScale;
    });

    this.core.rotation.x += delta * 0.36 * motionScale;
    this.core.rotation.y += delta * 0.52 * motionScale;
    this.core.material.opacity = 0.62 + Math.sin(time * 2.6) * 0.08 + this.pulsePower * 0.05;
    this.knot.rotation.y -= delta * 0.42 * motionScale;
    this.knot.rotation.x += delta * 0.18 * motionScale;

    this.updateHelix(time);
    this.helixGroup.position.set(-0.08 + this.pointer.x * 0.16, 0.04 + this.pointer.y * 0.1, -0.3);
    this.helixGroup.rotation.set(0.7 + this.pointer.y * 0.12, 0.2 + this.pointer.x * 0.22, -0.18);
    this.helixGroup.traverse((object) => {
      if (object.material) object.material.opacity = Math.min(1, this.config.helix * (0.62 + this.geneIntensity * 0.44));
    });

    this.nebula.rotation.y += delta * 0.025 * motionScale;
    this.nebula.rotation.x = this.pointer.y * 0.08;
    this.materials.points.opacity = 0.48 + this.pulsePower * 0.08;

    this.shards.forEach((shard, index) => {
      const spread = this.config.shardSpread;
      const angle = shard.userData.angle + time * shard.userData.speed * motionScale;
      shard.position.x = Math.cos(angle) * shard.userData.radius * spread;
      shard.position.z = Math.sin(angle) * shard.userData.radius * 0.62 * spread;
      shard.position.y = shard.userData.lift + Math.sin(time * 0.8 + shard.userData.phase) * 0.22;
      shard.rotation.x += delta * (0.2 + index * 0.003) * motionScale;
      shard.rotation.y += delta * (0.34 + index * 0.002) * motionScale;
    });

    this.globeGroup.rotation.y += delta * 0.16 * motionScale;
    this.globeGroup.rotation.x = -0.32 + this.pointer.y * 0.08;
    this.globeGroup.scale.lerp(new this.THREE.Vector3(1 + this.config.globe * 0.42, 1 + this.config.globe * 0.42, 1 + this.config.globe * 0.42), 0.06);
    this.globeGroup.traverse((object) => {
      if (object.material) object.material.opacity += (this.config.globe * 0.34 - object.material.opacity) * 0.06;
    });

    this.updateShockwaves(delta);
    this.renderer.render(this.scene, this.camera);
    this.canvas.dataset.threeFrame = String(this.frameCount);
    window.requestAnimationFrame(() => this.animate());
  }
}

function initThreeBiosphere() {
  if (!threeCanvas) return;
  try {
    const THREE = window.THREE;
    if (!THREE) {
      throw new Error("Three.js global is not available");
    }
    bioThreeScene = new BioThreeScene(THREE, threeCanvas);
    bioThreeScene.start();
    bioThreeScene.setMode(document.body.dataset.activeView || "home");
  } catch (error) {
    document.body.classList.add("three-unavailable");
    console.warn("Three.js biosphere unavailable", error);
  }
}

const earthShelfLabels = {
  storm: "\u4e1c\u4e9a\u5927\u9646\u67b6 / \u534e\u5357\u6d45\u6d77\u73ca\u745a\u5e26",
  ash: "\u706b\u5c71\u5f27\u9646\u7f18 / \u65e5\u672c-\u5415\u5b8b\u6d77\u6c9f\u524d\u7f18",
  tide: "\u5de9\u4ed6\u9646\u67b6 / \u5357\u6d77\u6d77\u4fb5\u6ee9",
  migration: "\u5deb\u5c14\u4ed6-\u8428\u80e1\u5c14\u9646\u6865 / \u6d45\u6d77\u8fc1\u5f99\u5eca\u9053"
};

const earthPalettes = {
  storm: {
    oceanInner: "#1c5b62",
    oceanOuter: "#06141d",
    land: "#405b43",
    highland: "#7a6b49",
    shelf: "rgba(98, 244, 230, 0.34)",
    shelfLine: "rgba(169, 255, 236, 0.86)",
    flare: "rgba(98, 244, 230, 0.68)"
  },
  ash: {
    oceanInner: "#43515a",
    oceanOuter: "#15130f",
    land: "#654333",
    highland: "#c28a5d",
    shelf: "rgba(240, 184, 95, 0.24)",
    shelfLine: "rgba(255, 207, 130, 0.78)",
    flare: "rgba(255, 170, 108, 0.66)"
  },
  tide: {
    oceanInner: "#1d6f8d",
    oceanOuter: "#041827",
    land: "#3b584d",
    highland: "#718267",
    shelf: "rgba(102, 211, 255, 0.38)",
    shelfLine: "rgba(139, 231, 255, 0.88)",
    flare: "rgba(102, 211, 255, 0.72)"
  },
  migration: {
    oceanInner: "#244d5c",
    oceanOuter: "#07151a",
    land: "#586744",
    highland: "#d0a057",
    shelf: "rgba(240, 184, 95, 0.28)",
    shelfLine: "rgba(255, 218, 126, 0.84)",
    flare: "rgba(240, 184, 95, 0.76)"
  }
};

const ancientEarthLandmasses = [
  {
    name: "north-america",
    points: [[-168, 71], [-150, 72], [-134, 69], [-124, 61], [-124, 50], [-117, 42], [-124, 36], [-117, 30], [-106, 23], [-94, 18], [-84, 21], [-80, 26], [-82, 30], [-75, 34], [-71, 41], [-62, 46], [-59, 53], [-68, 58], [-82, 63], [-96, 69], [-116, 72], [-138, 72]]
  },
  {
    name: "central-america",
    points: [[-106, 23], [-96, 19], [-90, 18], [-84, 14], [-79, 9], [-76, 8], [-79, 12], [-87, 16], [-98, 22]]
  },
  {
    name: "south-america",
    points: [[-81, 12], [-71, 9], [-61, 7], [-51, 2], [-44, -8], [-39, -18], [-42, -28], [-50, -38], [-58, -48], [-67, -55], [-74, -48], [-76, -36], [-72, -22], [-77, -10], [-81, 2]]
  },
  {
    name: "greenland",
    points: [[-54, 83], [-24, 80], [-18, 72], [-28, 63], [-44, 59], [-56, 64], [-62, 74]]
  },
  {
    name: "eurasia",
    points: [[-10, 36], [-6, 50], [6, 58], [24, 64], [46, 69], [74, 72], [104, 73], [136, 69], [160, 62], [178, 55], [170, 47], [146, 45], [132, 39], [123, 33], [118, 24], [108, 22], [100, 13], [91, 21], [78, 8], [68, 24], [52, 25], [44, 12], [34, 30], [20, 31], [8, 43]]
  },
  {
    name: "arabia-india",
    points: [[35, 30], [47, 29], [58, 24], [67, 21], [77, 8], [80, 18], [88, 22], [95, 17], [96, 5], [81, 7], [73, 13], [67, 24], [56, 25], [49, 14], [43, 12], [39, 20]]
  },
  {
    name: "africa",
    points: [[-17, 35], [4, 37], [22, 31], [33, 21], [42, 11], [50, 0], [42, -12], [33, -22], [27, -34], [18, -35], [9, -31], [1, -18], [-8, -5], [-15, 8], [-17, 23]]
  },
  {
    name: "southeast-asia",
    points: [[95, 22], [105, 20], [112, 17], [121, 14], [123, 8], [116, 5], [108, 2], [101, 7], [98, 14]]
  },
  {
    name: "sunda-islands",
    points: [[95, 5], [108, 1], [119, -3], [126, -6], [132, -5], [123, -9], [111, -8], [101, -4], [94, 1]]
  },
  {
    name: "japan-arc",
    points: [[130, 34], [136, 39], [142, 43], [146, 45], [144, 39], [138, 34]]
  },
  {
    name: "australia",
    points: [[112, -11], [130, -10], [146, -17], [154, -28], [145, -39], [128, -44], [114, -35], [112, -22]]
  },
  {
    name: "new-guinea",
    points: [[130, -2], [146, -3], [154, -7], [148, -11], [135, -9]]
  },
  {
    name: "madagascar",
    points: [[48, -12], [51, -20], [49, -26], [45, -25], [44, -18]]
  },
  {
    name: "antarctica",
    points: [[-180, -70], [-138, -66], [-94, -72], [-45, -67], [0, -71], [42, -68], [84, -72], [132, -66], [180, -70], [162, -82], [84, -85], [0, -84], [-82, -82], [-160, -80]]
  }
];

const ancientShelfZones = [
  {
    name: "east-asia-shelf",
    points: [[112, 42], [123, 41], [130, 35], [126, 28], [120, 21], [111, 19], [105, 23], [109, 31]]
  },
  {
    name: "sunda-shelf",
    points: [[98, 9], [110, 8], [119, 4], [117, -6], [106, -8], [95, -2]]
  },
  {
    name: "sahul-shelf",
    points: [[120, -8], [141, -8], [151, -14], [147, -24], [130, -22], [116, -16]]
  },
  {
    name: "bering-shelf",
    points: [[160, 66], [180, 66], [180, 54], [162, 55], [152, 61]]
  },
  {
    name: "north-sea-shelf",
    points: [[-6, 61], [10, 60], [12, 52], [2, 50], [-7, 54]]
  },
  {
    name: "grand-banks",
    points: [[-66, 52], [-48, 50], [-44, 42], [-58, 39], [-70, 44]]
  },
  {
    name: "patagonia-shelf",
    points: [[-68, -37], [-48, -39], [-43, -51], [-60, -55], [-72, -47]]
  },
  {
    name: "west-africa-shelf",
    points: [[-20, 28], [-8, 22], [0, 9], [0, -18], [-10, -28], [-20, -10]]
  }
];

const outerShelfZones = [
  {
    name: "west-pacific-slope",
    points: [[118, 45], [138, 42], [148, 34], [144, 22], [132, 10], [120, 16], [130, 27]]
  },
  {
    name: "indian-margin",
    points: [[60, 25], [84, 22], [94, 8], [88, -8], [72, -2], [61, 13]]
  },
  {
    name: "atlantic-margin",
    points: [[-82, 45], [-61, 42], [-50, 28], [-60, 18], [-76, 25]]
  },
  {
    name: "antarctic-shelf",
    points: [[-180, -62], [-120, -60], [-60, -62], [0, -60], [60, -62], [120, -60], [180, -62], [180, -70], [120, -66], [60, -69], [0, -67], [-60, -68], [-120, -66], [-180, -70]]
  }
];

const highDensityShelfContours = [
  {
    name: "yellow-sea-200m",
    depth: 200,
    points: [[119.0, 39.8], [120.7, 38.9], [122.1, 37.7], [123.0, 36.2], [123.2, 34.6], [122.3, 33.0], [121.0, 31.8], [119.6, 31.2], [118.2, 31.7], [117.6, 33.6], [117.9, 35.8], [118.5, 38.0], [119.0, 39.8]]
  },
  {
    name: "east-china-sea-200m",
    depth: 200,
    points: [[121.4, 31.0], [123.0, 30.2], [124.7, 29.0], [126.0, 27.4], [126.7, 25.6], [126.2, 23.7], [124.7, 22.3], [122.6, 21.6], [120.0, 22.5], [118.2, 24.2], [118.1, 26.5], [119.5, 28.8], [121.4, 31.0]]
  },
  {
    name: "east-china-sea-1000m",
    depth: 1000,
    points: [[126.0, 33.4], [128.8, 31.4], [130.5, 28.6], [130.1, 25.7], [128.0, 23.4], [125.2, 21.4], [122.4, 20.5]]
  },
  {
    name: "south-china-sea-200m",
    depth: 200,
    points: [[108.0, 22.0], [111.5, 20.2], [114.8, 18.2], [118.0, 16.0], [119.6, 13.2], [118.8, 10.1], [116.0, 8.2], [112.4, 7.6], [109.0, 9.0], [106.2, 12.0], [105.0, 16.0], [106.2, 19.6], [108.0, 22.0]]
  },
  {
    name: "south-china-sea-1000m",
    depth: 1000,
    points: [[119.8, 22.0], [122.0, 18.4], [121.4, 14.8], [119.0, 11.8], [115.8, 10.2], [112.4, 10.7], [109.4, 13.0], [107.8, 16.6], [108.8, 20.0]]
  },
  {
    name: "sunda-shelf-200m",
    depth: 200,
    points: [[96.0, 7.8], [100.5, 7.0], [105.2, 5.4], [109.4, 3.1], [113.0, 0.6], [116.5, -2.4], [118.0, -5.2], [115.6, -7.8], [110.6, -8.5], [105.2, -7.0], [100.0, -4.2], [96.5, 0.4], [96.0, 7.8]]
  },
  {
    name: "sunda-shelf-1000m",
    depth: 1000,
    points: [[93.5, 7.0], [99.0, 3.4], [104.2, -0.6], [109.2, -4.8], [114.6, -9.2], [121.0, -10.8]]
  },
  {
    name: "sahul-shelf-200m",
    depth: 200,
    points: [[121.0, -8.0], [128.0, -7.2], [136.5, -7.8], [145.2, -10.5], [151.6, -15.0], [151.0, -20.5], [145.0, -23.8], [136.0, -23.0], [127.2, -19.0], [121.0, -13.2], [121.0, -8.0]]
  },
  {
    name: "sahul-shelf-1000m",
    depth: 1000,
    points: [[128.0, -5.4], [139.0, -5.8], [151.4, -9.6], [157.4, -17.0], [153.0, -27.4], [143.4, -32.0], [132.2, -29.0]]
  },
  {
    name: "japan-trench-front",
    depth: 1000,
    points: [[146.0, 44.0], [144.2, 40.4], [142.2, 36.7], [140.0, 32.5], [136.8, 28.0], [132.2, 24.0], [127.8, 20.0]]
  },
  {
    name: "bering-shelf-200m",
    depth: 200,
    points: [[160.0, 65.4], [168.0, 64.6], [176.0, 63.0], [-176.5, 61.2], [-170.0, 59.0], [-166.0, 56.2], [-170.0, 53.6], [178.0, 53.4], [166.5, 56.4], [160.0, 61.2]]
  },
  {
    name: "north-sea-200m",
    depth: 200,
    points: [[-5.6, 59.8], [-1.5, 60.8], [3.5, 60.0], [7.8, 58.4], [9.2, 55.0], [7.6, 52.0], [3.0, 50.6], [-2.4, 51.8], [-5.8, 54.8], [-5.6, 59.8]]
  },
  {
    name: "grand-banks-200m",
    depth: 200,
    points: [[-59.0, 49.5], [-52.0, 50.2], [-46.2, 48.0], [-43.0, 44.0], [-47.0, 40.8], [-54.5, 40.2], [-61.8, 43.2], [-64.2, 47.2], [-59.0, 49.5]]
  },
  {
    name: "patagonia-200m",
    depth: 200,
    points: [[-65.0, -37.0], [-56.0, -38.0], [-49.0, -41.5], [-44.8, -47.0], [-47.0, -52.0], [-55.8, -55.0], [-64.4, -53.0], [-70.2, -47.0], [-69.0, -41.0], [-65.0, -37.0]]
  }
];

const shelfReliefCells = [
  {
    name: "east-china-shelf-relief",
    color: "rgba(120, 218, 205, 0.22)",
    cells: [[119.2, 30.1, 1.2, 0.55, -12], [121.1, 29.2, 1.5, 0.68, 8], [123.2, 27.8, 1.7, 0.75, 18], [124.5, 25.8, 1.35, 0.65, -18], [121.6, 24.2, 1.15, 0.62, 34], [119.3, 26.4, 1.45, 0.72, -28], [122.8, 22.8, 1.25, 0.55, 16]]
  },
  {
    name: "south-china-shelf-relief",
    color: "rgba(87, 196, 214, 0.24)",
    cells: [[108.6, 20.0, 1.7, 0.72, 28], [111.2, 18.2, 1.45, 0.62, -18], [114.2, 16.1, 1.8, 0.74, 14], [116.5, 13.4, 1.5, 0.65, -34], [113.0, 11.0, 1.65, 0.72, 22], [109.4, 13.5, 1.35, 0.58, -12], [106.8, 16.6, 1.2, 0.52, 18]]
  },
  {
    name: "sunda-shelf-relief",
    color: "rgba(108, 206, 180, 0.2)",
    cells: [[98.4, 5.8, 1.4, 0.62, -14], [101.2, 4.2, 1.65, 0.75, 18], [104.2, 2.1, 1.85, 0.8, 26], [108.0, -0.2, 1.7, 0.72, -18], [111.5, -3.2, 1.95, 0.82, 12], [115.0, -5.6, 1.5, 0.66, -28]]
  },
  {
    name: "sahul-shelf-relief",
    color: "rgba(91, 190, 192, 0.22)",
    cells: [[123.0, -10.4, 1.7, 0.76, 18], [127.0, -11.8, 2.0, 0.82, -12], [132.0, -12.4, 2.2, 0.9, 22], [138.0, -13.4, 2.0, 0.86, -24], [144.0, -16.2, 1.9, 0.78, 12], [140.0, -20.2, 1.6, 0.7, -16], [131.0, -18.8, 1.85, 0.8, 28]]
  },
  {
    name: "grand-banks-relief",
    color: "rgba(130, 224, 216, 0.18)",
    cells: [[-58.0, 48.0, 1.9, 0.7, 12], [-54.0, 47.0, 2.1, 0.75, -18], [-50.0, 45.0, 1.8, 0.68, 24], [-52.5, 42.7, 1.6, 0.62, -12]]
  }
];

const reefTerraceCells = [
  { name: "paracel-reef-terrace", lon: 112.6, lat: 16.5, radiusLon: 0.9, radiusLat: 0.38, rings: 4 },
  { name: "spratly-reef-terrace", lon: 114.3, lat: 10.2, radiusLon: 1.1, radiusLat: 0.44, rings: 5 },
  { name: "taiwan-bank-terrace", lon: 119.3, lat: 23.2, radiusLon: 0.85, radiusLat: 0.32, rings: 4 },
  { name: "sunda-reef-terrace", lon: 108.8, lat: -4.4, radiusLon: 1.2, radiusLat: 0.5, rings: 5 },
  { name: "sahul-reef-terrace", lon: 145.5, lat: -17.2, radiusLon: 1.25, radiusLat: 0.48, rings: 5 },
  { name: "ryukyu-terrace", lon: 128.0, lat: 25.5, radiusLon: 0.75, radiusLat: 0.3, rings: 3 }
];

const earthRidgeLines = [
  {
    name: "himalaya",
    points: [[70, 32], [78, 31], [86, 29], [95, 28]]
  },
  {
    name: "andes",
    points: [[-75, 5], [-77, -8], [-72, -22], [-70, -36], [-72, -49]]
  },
  {
    name: "rockies",
    points: [[-124, 56], [-118, 45], [-111, 37], [-105, 28]]
  },
  {
    name: "west-pacific-trench",
    points: [[146, 45], [142, 34], [130, 22], [124, 12], [128, 2]]
  },
  {
    name: "east-african-rift",
    points: [[34, 12], [37, 2], [36, -9], [31, -18]]
  },
  {
    name: "mid-atlantic-ridge",
    points: [[-36, 58], [-29, 36], [-25, 12], [-18, -12], [-12, -38]]
  }
];

const earthHotspots = [
  { lon: 121, lat: 30, label: "\u4e1c\u6d77\u5927\u9646\u67b6", type: "shelf" },
  { lon: 113, lat: 16, label: "\u5357\u6d77\u6d77\u4fb5\u6ee9", type: "reef" },
  { lon: 106, lat: -3, label: "\u5de9\u4ed6\u9646\u67b6", type: "migration" },
  { lon: 142, lat: 38, label: "\u5c9b\u5f27\u706b\u5c71\u94fe", type: "ash" },
  { lon: 145, lat: -17, label: "\u8428\u80e1\u5c14\u6d45\u6d77", type: "delta" },
  { lon: -52, lat: 46, label: "\u5927\u6d45\u6ee9", type: "shelf" },
  { lon: -57, lat: -48, label: "\u5df4\u5854\u54e5\u5c3c\u4e9a\u9646\u67b6", type: "migration" },
  { lon: 4, lat: 56, label: "\u5317\u6d77\u9646\u67b6", type: "shelf" }
];

const habitatScenarios = {
  storm: {
    title: "白垩纪湿地场景",
    copy: "暴雨季让河道扩张，植被覆盖率上升，巨兽足迹会在泥层里留下更清晰的能量残影。",
    humidity: "湿度 82%",
    pressure: "捕食压力 47%"
  },
  ash: {
    title: "火山灰遮蔽场景",
    copy: "火山灰云压低光照，舱内会追踪呼吸负荷、迁徙方向和群体避险路径。",
    humidity: "灰尘密度 69%",
    pressure: "生存压力 78%"
  },
  tide: {
    title: "海侵线推进场景",
    copy: "海平面推进会重绘河口边界，水生巨兽的声纳轨迹被投射到生态地图上。",
    humidity: "盐雾 74%",
    pressure: "水压变量 63%"
  },
  migration: {
    title: "迁徙潮场景",
    copy: "迁徙潮会触发群体路径预测，系统把足迹、植被破坏和休眠点连成动态路线。",
    humidity: "迁徙密度 91%",
    pressure: "能量消耗 66%"
  }
};

const timelineEras = {
  cambrian: {
    date: "5.41 亿年前",
    title: "寒武纪信号",
    copy: "三叶虫复眼数据正在投射成早期海洋光场。"
  },
  jurassic: {
    date: "2.01 亿年前",
    title: "侏罗纪骨架",
    copy: "大型植食恐龙步态进入重力井，背板、肌腱和尾部摆幅被同步解析。"
  },
  cretaceous: {
    date: "6800 万年前",
    title: "白垩纪追踪",
    copy: "顶级捕食者颅骨震动进入神经接口，咬合波形被拆成可旋转的数据层。"
  },
  ice: {
    date: "1 万年前",
    title: "冰原残响",
    copy: "猛犸象迁徙路线与温控光场同步，长牙曲率会影响路径推演。"
  }
};

const commandActions = {
  scan: {
    core: "09",
    status: "SCAN READY: 扫描阵列正在等待下一组化石样本。",
    routes: ["82%", "58%", "91%"]
  },
  cooling: {
    core: "12",
    status: "COOLING BOOST: 冷却塔升频，孵化阵列进入高负载保护。",
    routes: ["91%", "72%", "84%"]
  },
  sample: {
    core: "07",
    status: "SAMPLE SEALED: 样本锁已闭合，琥珀舱和深海壳体暂停转运。",
    routes: ["64%", "86%", "70%"]
  },
  shield: {
    core: "15",
    status: "SHIELD ACTIVE: 安全场展开，巨兽模型允许进入高能模拟。",
    routes: ["96%", "82%", "93%"]
  }
};

const archiveSpecimens = {
  skeleton: {
    code: "ARC-01",
    title: "恐龙骨架",
    copy: "颅骨、脊椎和尾椎被分层投射，步态残影正在生成。"
  },
  amber: {
    code: "ARC-02",
    title: "琥珀生态舱",
    copy: "树脂气泡、孢粉和昆虫翅脉被放大成微观生态地图。"
  },
  ammonite: {
    code: "ARC-03",
    title: "菊石螺旋",
    copy: "壳体生长线正在转换为远古海洋压力和声纳剖面。"
  },
  trilobite: {
    code: "ARC-04",
    title: "三叶虫矩阵",
    copy: "复眼阵列被映射成寒武纪光场，视觉数据正在重采样。"
  }
};

const signalNodes = {
  synapse: {
    title: "突触回放",
    copy: "骨骼、壳体和琥珀纹理被转译为突触脉冲，控制台持续追踪生命形态。",
    resonance: "62.8 Hz"
  },
  memory: {
    title: "记忆残响",
    copy: "系统正在把迁徙路线和巢穴位置压缩成可读取的残响片段。",
    resonance: "71.4 Hz"
  },
  motion: {
    title: "运动神经",
    copy: "肌腱附着点与步态数据联动，巨兽动作被拆成可预演的控制信号。",
    resonance: "58.6 Hz"
  },
  vision: {
    title: "复眼光场",
    copy: "复眼结构正在模拟远古光照，化石表面反射被转换成视觉噪声图。",
    resonance: "88.2 Hz"
  }
};

const geneDefinitions = [
  { key: "skeleton", label: "骨骼密度" },
  { key: "skin", label: "皮肤纹理" },
  { key: "nerve", label: "神经响应" },
  { key: "jaw", label: "颌骨力量" },
  { key: "crest", label: "角冠发育" },
  { key: "armor", label: "装甲鳞甲" },
  { key: "tail", label: "尾部平衡" },
  { key: "speed", label: "奔跑神经" },
  { key: "aquatic", label: "水生适应" },
  { key: "membrane", label: "翼膜指数" }
];

const geneTargets = {
  predator: {
    label: "高速捕食者",
    ideal: { skeleton: 72, skin: 58, nerve: 88, jaw: 84, crest: 28, armor: 24, tail: 72, speed: 92, aquatic: 18, membrane: 12 }
  },
  armored: {
    label: "重甲防御型",
    ideal: { skeleton: 92, skin: 66, nerve: 46, jaw: 48, crest: 82, armor: 94, tail: 64, speed: 28, aquatic: 12, membrane: 8 }
  },
  aquatic: {
    label: "水陆巨兽",
    ideal: { skeleton: 62, skin: 72, nerve: 58, jaw: 76, crest: 18, armor: 34, tail: 92, speed: 38, aquatic: 94, membrane: 8 }
  },
  aerial: {
    label: "翼膜猎手",
    ideal: { skeleton: 42, skin: 48, nerve: 86, jaw: 54, crest: 76, armor: 18, tail: 70, speed: 78, aquatic: 10, membrane: 94 }
  }
};

const geneModelAssets = {
  predator: "assets/beast-trex.png",
  armored: "assets/beast-triceratops.png",
  aquatic: "assets/beast-mosasaurus.png",
  aerial: "assets/beast-pterosaur.png",
  hybridSpine: "assets/beast-spinosaurus.png",
  hybridPlate: "assets/beast-stegosaurus.png",
  hybridApex: "assets/beast-megalodon.png"
};

let activeGeneTarget = "predator";

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(randomizeY = false) {
    this.x = Math.random() * width;
    this.y = randomizeY ? Math.random() * height : height + 20;
    this.size = 0.7 + Math.random() * 2.4;
    this.speed = 0.18 + Math.random() * 0.8;
    this.drift = -0.18 + Math.random() * 0.36;
    this.alpha = 0.18 + Math.random() * 0.58;
    this.hue = Math.random() > 0.72 ? "240, 184, 95" : "98, 244, 230";
  }

  update() {
    this.y -= this.speed;
    this.x += this.drift + Math.sin((frame + this.y) * 0.004) * 0.2;

    if (this.y < -20 || this.x < -30 || this.x > width + 30) {
      this.reset(false);
    }
  }

  draw(context) {
    context.beginPath();
    context.fillStyle = `rgba(${this.hue}, ${this.alpha})`;
    context.shadowColor = `rgba(${this.hue}, 0.8)`;
    context.shadowBlur = 14;
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
  }
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const particleCount = Math.min(92, Math.max(34, Math.floor(width / 18)));
  particles = Array.from({ length: particleCount }, () => new Particle());
  resizeEarthCanvas();
}

function drawParticleField() {
  frame += 1;
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  for (const particle of particles) {
    particle.update();
    particle.draw(ctx);
  }

  if (modelRotor && modelState.autoSpin && !modelState.dragging && !reduceMotion.matches) {
    modelState.rotateY += 0.08;
    updateModelTransform();
  }

  const habitatPanel = document.querySelector('[data-view-panel="habitat"]');
  if (habitatPanel?.classList.contains("is-active") && (frame % 4 === 0 || earthState.dragging)) {
    drawAncientEarth();
  }
  animationId = requestAnimationFrame(drawParticleField);
}

function setActiveView(viewName) {
  const targetName = viewPanels.some((panel) => panel.dataset.viewPanel === viewName)
    ? viewName
    : "home";
  const activePanel = viewPanels.find((panel) => panel.classList.contains("is-active"));

  if (activePanel?.dataset.viewPanel !== targetName) {
    triggerViewTransition(targetName);
  }

  viewPanels.forEach((panel) => {
    const isActive = panel.dataset.viewPanel === targetName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  viewButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === targetName;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (targetName === "habitat") {
    window.setTimeout(resizeEarthCanvas, reduceMotion.matches ? 0 : 120);
  }

  bioThreeScene?.setMode(targetName);
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function triggerViewTransition(viewName) {
  document.body.dataset.activeView = viewName;
  if (reduceMotion.matches) return;

  window.clearTimeout(transitionTimer);
  document.body.classList.add("is-transitioning");
  transitionTimer = window.setTimeout(() => {
    document.body.classList.remove("is-transitioning");
  }, 620);
}

function bindViewNavigation() {
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
  });
}

function showSlide(index) {
  if (!slides.length) return;

  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === currentSlide;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === currentSlide;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-selected", String(isActive));
  });

  syncStageModel();
  bioThreeScene?.pulse(0.32 + currentSlide * 0.03);
}

function advanceSlide(direction = 1, isAutoplay = false) {
  if (isAutoplay && carouselPaused) return;
  showSlide(currentSlide + direction);
}

function startCarouselAutoplay() {
  window.clearInterval(carouselTimer);

  if (!reduceMotion.matches && slides.length > 1) {
    carouselTimer = window.setInterval(advanceSlide, 4600, 1, true);
  }
}

function handleCarouselKeydown(event) {
  if (!carousel || !carousel.contains(document.activeElement)) return;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    advanceSlide(1);
    startCarouselAutoplay();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    advanceSlide(-1);
    startCarouselAutoplay();
  }
}

function bindCarousel() {
  if (!carousel || !slides.length) return;

  nextButton?.addEventListener("click", () => {
    advanceSlide(1);
    startCarouselAutoplay();
  });

  prevButton?.addEventListener("click", () => {
    advanceSlide(-1);
    startCarouselAutoplay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startCarouselAutoplay();
    });
  });

  carousel.addEventListener("mouseenter", () => {
    carouselPaused = true;
  });

  carousel.addEventListener("mouseleave", () => {
    carouselPaused = false;
  });

  window.addEventListener("keydown", handleCarouselKeydown);
  showSlide(0);
  startCarouselAutoplay();
}

function updateModelTransform() {
  if (!modelRotor) return;
  modelRotor.style.setProperty("--model-rotate-x", `${modelState.rotateX}deg`);
  modelRotor.style.setProperty("--model-rotate-y", `${modelState.rotateY}deg`);
}

function syncStageModel() {
  const activeSlide = slides[currentSlide];
  const activeImage = activeSlide?.querySelector(".beast-model-image");
  const activeTitle = activeSlide?.querySelector("h3");

  if (stageModel && activeImage) {
    stageModel.src = activeImage.getAttribute("src");
  }

  if (stageTitle && activeTitle) {
    stageTitle.textContent = activeTitle.textContent.trim();
  }
}

function resetModelView() {
  modelState.rotateX = -8;
  modelState.rotateY = 18;
  updateModelTransform();
}

function setModelMode(mode) {
  if (!modelStage) return;
  const safeMode = ["skeleton", "topology", "muscle"].includes(mode) ? mode : "topology";

  modelStage.classList.remove("mode-skeleton", "mode-topology", "mode-muscle");
  modelStage.classList.add(`mode-${safeMode}`);

  modelModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modelMode === safeMode);
  });
}

function bindInteractiveModel() {
  if (!modelStage || !modelRotor) return;

  modelStage.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".model-controls")) return;

    modelState.dragging = true;
    modelState.autoSpin = false;
    modelState.lastX = event.clientX;
    modelState.lastY = event.clientY;
    autoSpinButton?.classList.remove("is-active");
    autoSpinButton?.setAttribute("aria-pressed", "false");
    modelStage.setPointerCapture(event.pointerId);
  });

  modelStage.addEventListener("pointermove", (event) => {
    if (!modelState.dragging) return;

    const deltaX = event.clientX - modelState.lastX;
    const deltaY = event.clientY - modelState.lastY;
    modelState.lastX = event.clientX;
    modelState.lastY = event.clientY;
    modelState.rotateY += deltaX * 0.34;
    modelState.rotateX = Math.max(-34, Math.min(26, modelState.rotateX - deltaY * 0.22));
    updateModelTransform();
  });

  function stopDragging(event) {
    if (!modelState.dragging) return;
    modelState.dragging = false;
    if (event.pointerId !== undefined && modelStage.hasPointerCapture(event.pointerId)) {
      modelStage.releasePointerCapture(event.pointerId);
    }
  }

  modelStage.addEventListener("pointerup", stopDragging);
  modelStage.addEventListener("pointercancel", stopDragging);

  rotateLeftButton?.addEventListener("click", () => {
    modelState.autoSpin = false;
    modelState.rotateY -= 28;
    autoSpinButton?.classList.remove("is-active");
    autoSpinButton?.setAttribute("aria-pressed", "false");
    updateModelTransform();
  });

  rotateRightButton?.addEventListener("click", () => {
    modelState.autoSpin = false;
    modelState.rotateY += 28;
    autoSpinButton?.classList.remove("is-active");
    autoSpinButton?.setAttribute("aria-pressed", "false");
    updateModelTransform();
  });

  resetModelButton?.addEventListener("click", () => {
    modelState.autoSpin = false;
    autoSpinButton?.classList.remove("is-active");
    autoSpinButton?.setAttribute("aria-pressed", "false");
    resetModelView();
  });

  autoSpinButton?.addEventListener("click", () => {
    modelState.autoSpin = !modelState.autoSpin;
    autoSpinButton.classList.toggle("is-active", modelState.autoSpin);
    autoSpinButton.setAttribute("aria-pressed", String(modelState.autoSpin));
  });

  modelModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setModelMode(button.dataset.modelMode);
    });
  });

  scanIntensity?.addEventListener("input", () => {
    const alpha = Number(scanIntensity.value) / 100;
    modelStage.style.setProperty("--scan-alpha", alpha.toFixed(2));
  });

  updateModelTransform();
  setModelMode("topology");
  syncStageModel();
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resizeEarthCanvas() {
  if (!earthCanvas || !earthContext) return;

  const rect = earthCanvas.getBoundingClientRect();
  const fallbackWidth = Number(earthCanvas.getAttribute("width")) || 900;
  const fallbackHeight = Number(earthCanvas.getAttribute("height")) || 620;
  const nextWidth = Math.max(320, Math.floor(rect.width || earthCanvas.clientWidth || fallbackWidth));
  const nextHeight = Math.max(280, Math.floor(rect.height || earthCanvas.clientHeight || fallbackHeight));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  earthState.width = nextWidth;
  earthState.height = nextHeight;
  earthState.ratio = ratio;
  earthCanvas.width = Math.floor(nextWidth * ratio);
  earthCanvas.height = Math.floor(nextHeight * ratio);
  earthContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawAncientEarth();
}

function projectEarthPoint(lon, lat, radius, centerX, centerY) {
  const globeRadius = radius || Math.min(earthState.width, earthState.height) * 0.34 * earthState.zoom;
  const globeCenterX = centerX || earthState.width * 0.5;
  const globeCenterY = centerY || earthState.height * 0.52;
  const longitude = toRadians(lon + earthState.yaw);
  const latitude = toRadians(lat);
  const pitch = toRadians(earthState.pitch);
  const baseX = Math.cos(latitude) * Math.sin(longitude);
  const baseY = Math.sin(latitude);
  const baseZ = Math.cos(latitude) * Math.cos(longitude);
  const tiltedY = baseY * Math.cos(pitch) - baseZ * Math.sin(pitch);
  const tiltedZ = baseY * Math.sin(pitch) + baseZ * Math.cos(pitch);

  return {
    x: globeCenterX + baseX * globeRadius,
    y: globeCenterY - tiltedY * globeRadius,
    z: tiltedZ,
    visible: tiltedZ > -0.08
  };
}

function drawProjectedLine(points, strokeStyle, lineWidth = 1, alpha = 1) {
  if (!earthContext) return;

  earthContext.save();
  earthContext.globalAlpha = alpha;
  earthContext.strokeStyle = strokeStyle;
  earthContext.lineWidth = lineWidth;
  earthContext.beginPath();

  let drawing = false;
  points.forEach(([lon, lat]) => {
    const point = projectEarthPoint(lon, lat);
    if (!point.visible) {
      drawing = false;
      return;
    }

    if (!drawing) {
      earthContext.moveTo(point.x, point.y);
      drawing = true;
    } else {
      earthContext.lineTo(point.x, point.y);
    }
  });

  earthContext.stroke();
  earthContext.restore();
}

function normalizeLongitude(value) {
  if (value > 180) return value - 360;
  if (value < -180) return value + 360;
  return value;
}

function densifyGeoLine(points, stepDegrees = 1.2) {
  const densePoints = [];
  if (!points.length) return densePoints;

  points.forEach(([lon, lat], index) => {
    const next = points[index + 1];
    densePoints.push([lon, lat]);
    if (!next) return;

    let deltaLon = next[0] - lon;
    if (deltaLon > 180) deltaLon -= 360;
    if (deltaLon < -180) deltaLon += 360;

    const deltaLat = next[1] - lat;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(deltaLon), Math.abs(deltaLat)) / stepDegrees));

    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      const ease = t * t * (3 - 2 * t);
      const bend = Math.sin(t * Math.PI) * 0.18;
      densePoints.push([
        normalizeLongitude(lon + deltaLon * t),
        lat + deltaLat * t + bend * Math.sign(deltaLat || 1) * Math.min(1.8, Math.abs(deltaLon) * 0.08)
      ]);
    }
  });

  return densePoints;
}

function drawShelfContourBand(contour, palette) {
  if (!earthContext) return;

  const densePoints = densifyGeoLine(contour.points, contour.depth <= 200 ? 0.75 : 1);
  const isShallow = contour.depth <= 200;
  const baseColor = isShallow ? palette.shelfLine : "rgba(70, 155, 190, 0.48)";
  const glowColor = isShallow ? palette.shelf : "rgba(41, 121, 145, 0.22)";
  const widthBase = isShallow ? 8.5 : 5.5;

  earthContext.save();
  earthContext.shadowColor = baseColor;
  earthContext.shadowBlur = isShallow ? 10 : 6;
  drawProjectedLine(densePoints, glowColor, widthBase, isShallow ? 0.38 : 0.28);
  drawProjectedLine(densePoints, baseColor, isShallow ? 2.2 : 1.7, isShallow ? 0.82 : 0.58);
  earthContext.restore();
}

function drawBathymetryContour(contour, palette) {
  if (!earthContext) return;

  const densePoints = densifyGeoLine(contour.points, contour.depth <= 200 ? 0.55 : 0.85);
  const isShallow = contour.depth <= 200;

  earthContext.save();
  if (!isShallow) {
    earthContext.setLineDash([4, 7]);
  }

  drawProjectedLine(
    densePoints,
    isShallow ? "rgba(198, 255, 241, 0.92)" : "rgba(102, 211, 255, 0.68)",
    isShallow ? 1.15 : 1,
    isShallow ? 0.9 : 0.72
  );

  if (earthState.zoom > 1.08 && isShallow) {
    const labelPoint = densePoints[Math.floor(densePoints.length * 0.48)];
    const projected = labelPoint ? projectEarthPoint(labelPoint[0], labelPoint[1]) : null;
    if (projected?.visible) {
      earthContext.setLineDash([]);
      earthContext.font = "700 10px Inter, Arial, sans-serif";
      earthContext.fillStyle = palette.shelfLine;
      earthContext.fillText(`${contour.depth}m`, projected.x + 5, projected.y + 4);
    }
  }

  earthContext.restore();
}

function deterministicNoise(seed) {
  const wave = Math.sin(seed * 12.9898) * 43758.5453;
  return wave - Math.floor(wave);
}

function createReliefCellPoints(lon, lat, radiusLon, radiusLat, angle, seed) {
  const points = [];
  const radians = toRadians(angle);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  for (let index = 0; index < 8; index += 1) {
    const theta = (index / 8) * Math.PI * 2;
    const roughness = 0.82 + deterministicNoise(seed + index * 7.3) * 0.32;
    const localX = Math.cos(theta) * radiusLon * roughness;
    const localY = Math.sin(theta) * radiusLat * roughness;
    points.push([
      normalizeLongitude(lon + localX * cos - localY * sin),
      lat + localX * sin + localY * cos
    ]);
  }

  return points;
}

function drawShelfReliefMesh(region, palette) {
  if (!earthContext) return;

  region.cells.forEach(([lon, lat, radiusLon, radiusLat, angle], index) => {
    const cellPoints = createReliefCellPoints(lon, lat, radiusLon, radiusLat, angle, index + lon * 0.17);
    const projected = cellPoints
      .map(([pointLon, pointLat]) => projectEarthPoint(pointLon, pointLat))
      .filter((point) => point.visible);

    if (projected.length < 4) return;

    earthContext.save();
    earthContext.beginPath();
    projected.forEach((point, pointIndex) => {
      if (pointIndex === 0) {
        earthContext.moveTo(point.x, point.y);
      } else {
        earthContext.lineTo(point.x, point.y);
      }
    });
    earthContext.closePath();
    earthContext.fillStyle = region.color;
    earthContext.strokeStyle = index % 2
      ? "rgba(194, 255, 240, 0.34)"
      : "rgba(66, 210, 228, 0.32)";
    earthContext.lineWidth = 0.9;
    earthContext.shadowColor = palette.shelfLine;
    earthContext.shadowBlur = 6;
    earthContext.fill();
    earthContext.stroke();

    const center = projectEarthPoint(lon, lat);
    const ridgeA = projectEarthPoint(lon - radiusLon * 0.5, lat - radiusLat * 0.2);
    const ridgeB = projectEarthPoint(lon + radiusLon * 0.6, lat + radiusLat * 0.15);
    if (center.visible && ridgeA.visible && ridgeB.visible) {
      earthContext.beginPath();
      earthContext.moveTo(ridgeA.x, ridgeA.y);
      earthContext.quadraticCurveTo(center.x, center.y - 3, ridgeB.x, ridgeB.y);
      earthContext.strokeStyle = "rgba(239, 230, 209, 0.22)";
      earthContext.lineWidth = 0.8;
      earthContext.stroke();
    }
    earthContext.restore();
  });
}

function drawShelfSedimentTexture(region, palette) {
  if (!earthContext) return;

  region.cells.forEach(([lon, lat, radiusLon, radiusLat], cellIndex) => {
    for (let index = 0; index < 7; index += 1) {
      const noiseA = deterministicNoise(cellIndex * 31 + index * 3.1);
      const noiseB = deterministicNoise(cellIndex * 17 + index * 5.7);
      const pointLon = lon + (noiseA - 0.5) * radiusLon * 1.8;
      const pointLat = lat + (noiseB - 0.5) * radiusLat * 1.8;
      const projected = projectEarthPoint(pointLon, pointLat);
      if (!projected.visible) continue;

      earthContext.save();
      earthContext.globalAlpha = 0.22 + noiseA * 0.28;
      earthContext.fillStyle = noiseA > 0.64 ? palette.shelfLine : "rgba(239, 230, 209, 0.64)";
      earthContext.beginPath();
      earthContext.arc(projected.x, projected.y, 0.7 + noiseB * 1.3, 0, Math.PI * 2);
      earthContext.fill();
      earthContext.restore();
    }
  });
}

function drawReefTerraceCells(palette) {
  if (!earthContext) return;

  reefTerraceCells.forEach((terrace, terraceIndex) => {
    for (let ring = terrace.rings; ring >= 1; ring -= 1) {
      const scale = ring / terrace.rings;
      const points = [];
      for (let index = 0; index < 24; index += 1) {
        const theta = (index / 24) * Math.PI * 2;
        const ripple = 0.9 + deterministicNoise(terraceIndex * 41 + ring * 13 + index) * 0.16;
        points.push([
          normalizeLongitude(terrace.lon + Math.cos(theta) * terrace.radiusLon * scale * ripple),
          terrace.lat + Math.sin(theta) * terrace.radiusLat * scale * ripple
        ]);
      }
      drawProjectedLine(
        points.concat([points[0]]),
        ring === terrace.rings ? palette.shelfLine : "rgba(198, 255, 241, 0.44)",
        ring === terrace.rings ? 1.2 : 0.75,
        0.72 - ring * 0.045
      );
    }
  });
}

function drawEarthPolygon(points, fillStyle, strokeStyle, lineWidth = 1.2) {
  if (!earthContext) return;

  const visiblePoints = points
    .map(([lon, lat]) => projectEarthPoint(lon, lat))
    .filter((point) => point.visible);

  if (visiblePoints.length < 3) return;

  earthContext.save();
  earthContext.beginPath();
  visiblePoints.forEach((point, index) => {
    if (index === 0) {
      earthContext.moveTo(point.x, point.y);
    } else {
      earthContext.lineTo(point.x, point.y);
    }
  });
  earthContext.closePath();
  earthContext.fillStyle = fillStyle;
  earthContext.strokeStyle = strokeStyle;
  earthContext.lineWidth = lineWidth;
  earthContext.fill();
  earthContext.stroke();
  earthContext.restore();
}

function drawEarthLabel(item, palette) {
  if (!earthContext) return;

  const point = projectEarthPoint(item.lon, item.lat);
  if (!point.visible) return;

  const isActive = item.type === "reef" && earthState.scenario === "storm"
    || item.type === "ash" && earthState.scenario === "ash"
    || item.type === "shelf" && earthState.scenario === "tide"
    || item.type === "migration" && earthState.scenario === "migration"
    || item.type === "delta" && earthState.scenario === "migration";
  const pulse = isActive ? 1 + Math.sin(frame * 0.08) * 0.2 : 1;

  earthContext.save();
  earthContext.globalAlpha = isActive ? 1 : 0.68;
  earthContext.fillStyle = isActive ? palette.flare : "rgba(239, 230, 209, 0.82)";
  earthContext.strokeStyle = palette.flare;
  earthContext.lineWidth = 1;
  earthContext.beginPath();
  earthContext.arc(point.x, point.y, isActive ? 6 * pulse : 4, 0, Math.PI * 2);
  earthContext.fill();
  earthContext.stroke();

  if (earthState.zoom > 0.92 || isActive) {
    earthContext.font = "700 12px Inter, Arial, sans-serif";
    earthContext.fillStyle = "rgba(239, 230, 209, 0.92)";
    earthContext.fillText(item.label, point.x + 10, point.y - 8);
  }
  earthContext.restore();
}

function drawScenarioOverlay(centerX, centerY, radius, palette) {
  if (!earthContext) return;

  earthContext.save();
  earthContext.beginPath();
  earthContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
  earthContext.clip();

  if (earthState.scenario === "storm") {
    earthContext.strokeStyle = "rgba(168, 255, 239, 0.3)";
    earthContext.lineWidth = 1;
    for (let i = 0; i < 20; i += 1) {
      const x = centerX - radius + ((i * 47 + frame * 2) % (radius * 2.2));
      earthContext.beginPath();
      earthContext.moveTo(x, centerY - radius * 0.72);
      earthContext.lineTo(x - radius * 0.16, centerY + radius * 0.64);
      earthContext.stroke();
    }
  }

  if (earthState.scenario === "ash") {
    drawProjectedLine([[142, 46], [139, 38], [132, 28], [124, 18], [122, 10]], "rgba(255, 190, 122, 0.82)", 3.4, 0.78);
    earthContext.fillStyle = "rgba(255, 190, 122, 0.2)";
    for (let i = 0; i < 56; i += 1) {
      const drift = (frame * 0.9 + i * 31) % (radius * 2);
      const x = centerX - radius + drift;
      const y = centerY - radius * 0.78 + ((i * 53) % Math.floor(radius * 1.5));
      earthContext.fillRect(x, y, 2.4, 2.4);
    }
  }

  if (earthState.scenario === "tide") {
    const floodedShelves = [
      Array.from({ length: 23 }, (_, index) => [105 + index * 1.2, 17 + Math.sin(index * 0.42) * 5]),
      Array.from({ length: 20 }, (_, index) => [98 + index * 1.1, 3 + Math.sin(index * 0.35) * 4]),
      Array.from({ length: 20 }, (_, index) => [119 + index * 1.4, -10 + Math.sin(index * 0.28) * 3])
    ];
    floodedShelves.forEach((line, index) => {
      drawProjectedLine(line, index === 0 ? "rgba(158, 241, 255, 0.9)" : palette.shelfLine, 4.6 - index * 0.5, 0.76);
    });
  }

  if (earthState.scenario === "migration") {
    const route = [[96, 7], [104, 3], [112, -3], [123, -7], [134, -10], [145, -17]];
    drawProjectedLine(route, "rgba(255, 218, 126, 0.92)", 3, 0.92);
    route.forEach(([lon, lat], index) => {
      const point = projectEarthPoint(lon, lat);
      if (!point.visible) return;
      earthContext.beginPath();
      earthContext.fillStyle = index % 2 ? palette.flare : "rgba(98, 244, 230, 0.78)";
      earthContext.arc(point.x, point.y, 3.5 + Math.sin(frame * 0.09 + index) * 1.4, 0, Math.PI * 2);
      earthContext.fill();
    });
  }

  earthContext.restore();
}

function drawAncientEarth() {
  if (!earthCanvas || !earthContext || !earthState.width || !earthState.height) return;

  const widthNow = earthState.width;
  const heightNow = earthState.height;
  const centerX = widthNow * 0.5;
  const centerY = heightNow * 0.52;
  const radius = Math.min(widthNow, heightNow) * 0.34 * earthState.zoom;
  const palette = earthPalettes[earthState.scenario] || earthPalettes.storm;

  earthContext.setTransform(earthState.ratio, 0, 0, earthState.ratio, 0, 0);
  earthContext.clearRect(0, 0, widthNow, heightNow);

  const halo = earthContext.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.55);
  halo.addColorStop(0, "rgba(98, 244, 230, 0.18)");
  halo.addColorStop(0.48, "rgba(98, 244, 230, 0.08)");
  halo.addColorStop(1, "rgba(98, 244, 230, 0)");
  earthContext.fillStyle = halo;
  earthContext.beginPath();
  earthContext.arc(centerX, centerY, radius * 1.55, 0, Math.PI * 2);
  earthContext.fill();

  const ocean = earthContext.createRadialGradient(centerX - radius * 0.28, centerY - radius * 0.34, radius * 0.08, centerX, centerY, radius);
  ocean.addColorStop(0, palette.oceanInner);
  ocean.addColorStop(0.58, "#0b2b33");
  ocean.addColorStop(1, palette.oceanOuter);
  earthContext.fillStyle = ocean;
  earthContext.beginPath();
  earthContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
  earthContext.fill();

  earthContext.save();
  earthContext.beginPath();
  earthContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
  earthContext.clip();

  for (let lat = -60; lat <= 60; lat += 20) {
    drawProjectedLine(Array.from({ length: 73 }, (_, index) => [-180 + index * 5, lat]), "rgba(168, 255, 239, 0.16)", 0.8, 1);
  }

  for (let lon = -150; lon <= 180; lon += 30) {
    drawProjectedLine(Array.from({ length: 49 }, (_, index) => [lon, -80 + index * 3.4]), "rgba(168, 255, 239, 0.12)", 0.8, 1);
  }

  outerShelfZones.forEach((zone) => {
    drawEarthPolygon(zone.points, "rgba(41, 121, 145, 0.22)", "rgba(102, 211, 255, 0.36)", 1.15);
  });

  highDensityShelfContours
    .filter((contour) => contour.depth >= 1000)
    .forEach((contour) => drawShelfContourBand(contour, palette));

  ancientShelfZones.forEach((zone) => {
    drawEarthPolygon(zone.points, palette.shelf, palette.shelfLine, 2.4);
  });

  highDensityShelfContours
    .filter((contour) => contour.depth <= 200)
    .forEach((contour) => drawShelfContourBand(contour, palette));

  shelfReliefCells.forEach((region) => {
    drawShelfReliefMesh(region, palette);
    if (earthState.zoom > 0.82) {
      drawShelfSedimentTexture(region, palette);
    }
  });

  drawReefTerraceCells(palette);

  ancientEarthLandmasses.forEach((mass, index) => {
    const fill = index % 2 ? palette.highland : palette.land;
    drawEarthPolygon(mass.points, fill, "rgba(239, 230, 209, 0.48)", 1.15);
  });

  earthRidgeLines.forEach((ridge, index) => {
    const isTrench = ridge.name.includes("trench") || ridge.name.includes("ridge");
    const stroke = isTrench
      ? "rgba(102, 211, 255, 0.46)"
      : index % 2 ? "rgba(240, 184, 95, 0.48)" : "rgba(239, 230, 209, 0.34)";
    drawProjectedLine(ridge.points, stroke, isTrench ? 1.8 : 1.35, 0.86);
  });

  highDensityShelfContours.forEach((contour) => {
    drawBathymetryContour(contour, palette);
  });

  drawScenarioOverlay(centerX, centerY, radius, palette);
  earthHotspots.forEach((item) => drawEarthLabel(item, palette));
  earthContext.restore();

  const shade = earthContext.createRadialGradient(centerX - radius * 0.42, centerY - radius * 0.44, radius * 0.16, centerX + radius * 0.24, centerY + radius * 0.1, radius * 1.05);
  shade.addColorStop(0, "rgba(255, 255, 255, 0.24)");
  shade.addColorStop(0.44, "rgba(255, 255, 255, 0.02)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.48)");
  earthContext.fillStyle = shade;
  earthContext.beginPath();
  earthContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
  earthContext.fill();

  earthContext.strokeStyle = "rgba(98, 244, 230, 0.72)";
  earthContext.lineWidth = 2;
  earthContext.beginPath();
  earthContext.arc(centerX, centerY, radius + 1, 0, Math.PI * 2);
  earthContext.stroke();

  earthContext.strokeStyle = "rgba(240, 184, 95, 0.38)";
  earthContext.lineWidth = 1;
  earthContext.setLineDash([9, 14]);
  earthContext.beginPath();
  earthContext.ellipse(centerX, centerY, radius * 1.08, radius * 0.24, toRadians(earthState.yaw * 0.22), 0, Math.PI * 2);
  earthContext.stroke();
  earthContext.setLineDash([]);

  if (earthReadout) {
    earthReadout.textContent = `ZOOM ${earthState.zoom.toFixed(2)}x`;
  }
  earthCanvas.dataset.rotation = String(Math.round(earthState.yaw - earthState.baseYaw));
}

function updateEarthZoom(value) {
  const rawValue = Number(value);
  const normalized = rawValue > 10 ? rawValue / 100 : rawValue;
  earthState.zoom = clamp(Number.isFinite(normalized) ? normalized : 1, 0.7, 1.8);

  if (earthZoomInput) {
    earthZoomInput.value = String(Math.round(earthState.zoom * 100));
  }

  if (earthReadout) {
    earthReadout.textContent = `ZOOM ${earthState.zoom.toFixed(2)}x`;
  }

  drawAncientEarth();
}

function bindEarthGlobe() {
  if (!earthCanvas || !earthContext) return;

  earthZoomInput?.addEventListener("input", () => updateEarthZoom(Number(earthZoomInput.value)));

  earthZoomInButton?.addEventListener("click", () => {
    updateEarthZoom(earthState.zoom + 0.1);
  });

  earthZoomOutButton?.addEventListener("click", () => {
    updateEarthZoom(earthState.zoom - 0.1);
  });

  earthResetButton?.addEventListener("click", () => {
    earthState.yaw = earthState.baseYaw;
    earthState.pitch = earthState.basePitch;
    updateEarthZoom(1);
  });

  earthCanvas.addEventListener("pointerdown", (event) => {
    earthState.dragging = true;
    earthState.lastX = event.clientX;
    earthState.lastY = event.clientY;
    earthCanvas.setPointerCapture(event.pointerId);
  });

  earthCanvas.addEventListener("pointermove", (event) => {
    if (!earthState.dragging) return;

    const deltaX = event.clientX - earthState.lastX;
    const deltaY = event.clientY - earthState.lastY;
    earthState.lastX = event.clientX;
    earthState.lastY = event.clientY;
    earthState.yaw += deltaX * 0.34;
    earthState.pitch = clamp(earthState.pitch - deltaY * 0.22, -56, 46);
    drawAncientEarth();
  });

  function stopEarthDrag(event) {
    if (!earthState.dragging) return;
    earthState.dragging = false;
    if (event.pointerId !== undefined && earthCanvas.hasPointerCapture(event.pointerId)) {
      earthCanvas.releasePointerCapture(event.pointerId);
    }
  }

  earthCanvas.addEventListener("pointerup", stopEarthDrag);
  earthCanvas.addEventListener("pointercancel", stopEarthDrag);
  earthCanvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    updateEarthZoom(earthState.zoom + (event.deltaY > 0 ? -0.06 : 0.06));
  }, { passive: false });

  updateEarthZoom(Number(earthZoomInput?.value || 100));
  resizeEarthCanvas();
}

function setMetric(node, value, digits = 1) {
  if (!node) return;
  node.textContent = value.toFixed(digits).padStart(4, "0");
}

function updateTelemetry() {
  const time = Date.now() / 1000;
  setMetric(metricNodes.match, 97.2 + Math.sin(time * 0.8) * 0.5);
  setMetric(metricNodes.neural, 62.8 + Math.cos(time * 1.2) * 2.8);
  setMetric(metricNodes.noise, 3.1 + Math.sin(time * 1.8) * 0.6);

  if (metricNodes.scan) {
    metricNodes.scan.textContent = String(128 + Math.round(Math.sin(time * 0.7) * 6));
  }
}

function getGeneValues() {
  const values = {};
  geneDefinitions.forEach((definition) => {
    const slider = document.querySelector(`[data-gene-key="${definition.key}"]`);
    values[definition.key] = Number(slider?.value || 50);
  });
  return values;
}

function scoreGeneTarget(values, targetName = activeGeneTarget) {
  const target = geneTargets[targetName] || geneTargets.predator;
  const totalDistance = geneDefinitions.reduce((sum, definition) => {
    return sum + Math.abs((values[definition.key] || 0) - target.ideal[definition.key]);
  }, 0);

  return Math.max(0, Math.round(100 - totalDistance / geneDefinitions.length));
}

function computeDinoGenome(values) {
  const scores = {
    predator: values.jaw * 0.3 + values.speed * 0.24 + values.nerve * 0.2 + values.tail * 0.16 + (100 - values.armor) * 0.1,
    armored: values.armor * 0.34 + values.skeleton * 0.22 + values.crest * 0.2 + values.skin * 0.12 + (100 - values.speed) * 0.12,
    aquatic: values.aquatic * 0.42 + values.tail * 0.22 + values.jaw * 0.16 + values.skin * 0.1 + (100 - values.membrane) * 0.1,
    aerial: values.membrane * 0.42 + values.nerve * 0.22 + values.speed * 0.18 + values.crest * 0.12 + (100 - values.skeleton) * 0.06
  };
  const lineage = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = lineage[0][0];
  const secondary = lineage[1][0];
  const instability = geneDefinitions.reduce((sum, definition) => {
    const value = values[definition.key] || 0;
    return sum + Math.max(0, Math.abs(value - 50) - 34);
  }, 0);
  const conflict = Math.abs(values.aquatic - values.membrane) > 72 ? 10 : 0;
  const stability = Math.max(28, Math.min(99, Math.round(96 - instability * 0.9 - conflict + values.nerve * 0.08)));
  const dangerScore = values.jaw * 0.28 + values.speed * 0.18 + values.armor * 0.16 + values.skeleton * 0.15 + values.aquatic * 0.12 + values.membrane * 0.11;
  const risk = dangerScore > 84 ? "S" : dangerScore > 68 ? "A" : dangerScore > 52 ? "B" : "C";
  const nameRoots = {
    predator: ["刃齿", "暴猎"],
    armored: ["甲盾", "棘冠"],
    aquatic: ["渊尾", "沧鳍"],
    aerial: ["翼冠", "风脊"]
  };
  const ecologyMap = {
    predator: "林缘伏击",
    armored: "岩原防御",
    aquatic: "浅海巡游",
    aerial: "高崖滑翔"
  };
  const archetypeMap = {
    predator: "THEROPOD RAPTOR",
    armored: "CERATOPS ARMOR",
    aquatic: "AQUATIC SAURIAN",
    aerial: "PTERO HYBRID"
  };

  return {
    values,
    primary,
    secondary,
    lineage,
    stability,
    risk,
    targetScore: scoreGeneTarget(values),
    name: `${nameRoots[primary][0]}${nameRoots[secondary][1]}龙`,
    ecology: ecologyMap[primary],
    archetype: archetypeMap[primary]
  };
}

function buildGeneEffectLayer(result) {
  const values = result.values;
  const centerX = 360;
  const centerY = 194;
  const anchorSets = {
    predator: [
      ["jaw", 515, 136, "JAW"], ["nerve", 478, 108, "CORTEX"], ["skeleton", 354, 158, "SPINE"],
      ["skin", 310, 206, "DERMIS"], ["tail", 190, 206, "BALANCE"], ["speed", 414, 258, "TENDON"],
      ["crest", 470, 84, "CREST"], ["armor", 330, 122, "DENSITY"], ["aquatic", 252, 248, "OSMO"],
      ["membrane", 420, 88, "AIRFOIL"]
    ],
    armored: [
      ["jaw", 500, 152, "BEAK"], ["nerve", 468, 112, "CORTEX"], ["skeleton", 348, 154, "FRAME"],
      ["skin", 328, 220, "DERMIS"], ["tail", 206, 212, "BALANCE"], ["speed", 418, 270, "TENDON"],
      ["crest", 535, 100, "CREST"], ["armor", 372, 100, "PLATE"], ["aquatic", 252, 246, "OSMO"],
      ["membrane", 430, 78, "AIRFOIL"]
    ],
    aquatic: [
      ["jaw", 536, 152, "BITE"], ["nerve", 470, 126, "CORTEX"], ["skeleton", 352, 166, "KEEL"],
      ["skin", 326, 214, "SCALE"], ["tail", 188, 196, "PROPULSION"], ["speed", 414, 248, "FLOW"],
      ["crest", 472, 92, "SAIL"], ["armor", 350, 118, "DENSITY"], ["aquatic", 280, 248, "OSMO"],
      ["membrane", 420, 88, "GLIDE"]
    ],
    aerial: [
      ["jaw", 510, 150, "BEAK"], ["nerve", 472, 112, "CORTEX"], ["skeleton", 346, 160, "HOLLOW"],
      ["skin", 318, 222, "DERMIS"], ["tail", 210, 214, "BALANCE"], ["speed", 424, 250, "DIVE"],
      ["crest", 506, 90, "CREST"], ["armor", 346, 118, "DENSITY"], ["aquatic", 256, 248, "OSMO"],
      ["membrane", 365, 76, "MEMBRANE"]
    ]
  };
  const anchors = anchorSets[result.primary] || anchorSets.predator;
  const topKeys = Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => key);
  const intensity = Math.max(0.42, result.targetScore / 100);
  const rings = `
    <ellipse class="gene-effect-ring" cx="${centerX}" cy="${centerY}" rx="${220 + values.skeleton * 0.22}" ry="${104 + values.skin * 0.16}" />
    <ellipse class="gene-effect-ring" cx="${centerX}" cy="${centerY}" rx="${142 + values.jaw * 0.18}" ry="${62 + values.armor * 0.12}" opacity="${intensity.toFixed(2)}" />
    <path class="gene-effect-scan" d="M92 ${118 + values.nerve * 0.18} C210 ${92 - values.speed * 0.14}, 470 ${88 + values.membrane * 0.08}, 628 ${134 - values.jaw * 0.08}" />
    <path class="gene-effect-scan" d="M104 ${238 - values.tail * 0.08} C246 ${292 - values.aquatic * 0.18}, 456 ${288 - values.speed * 0.12}, 626 ${224 + values.crest * 0.06}" />
  `;
  const beams = anchors.map(([key, x, y], index) => {
    const value = values[key] || 0;
    const driftX = (deterministicNoise(index * 8.7 + value) - 0.5) * 16;
    const driftY = (deterministicNoise(index * 13.3 + value) - 0.5) * 14;
    return `<path class="gene-effect-beam" d="M${centerX} ${centerY} Q${(centerX + x) / 2 + driftX} ${(centerY + y) / 2 + driftY} ${x} ${y}" />`;
  }).join("");
  const nodes = anchors.map(([key, x, y, label], index) => {
    const value = values[key] || 0;
    const radius = 4.5 + value * 0.052;
    const hotClass = topKeys.includes(key) ? " is-hot" : "";
    const labelOffset = index % 2 === 0 ? -12 : 22;
    return `
      <circle class="gene-effect-node${hotClass}" cx="${x}" cy="${y}" r="${radius.toFixed(1)}" />
      <text class="gene-effect-label" x="${x + 12}" y="${y + labelOffset}">${label} ${Math.round(value)}</text>
    `;
  }).join("");
  const strands = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    const rx = 236 + deterministicNoise(index + values.skin) * 36;
    const ry = 112 + deterministicNoise(index + values.nerve) * 28;
    const x1 = centerX + Math.cos(angle) * rx;
    const y1 = centerY + Math.sin(angle) * ry;
    const x2 = centerX + Math.cos(angle + 0.38) * (rx - 48);
    const y2 = centerY + Math.sin(angle + 0.38) * (ry - 26);
    return `<path class="gene-effect-strand" d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" opacity="${(0.28 + deterministicNoise(index * 2.9) * 0.38).toFixed(2)}" />`;
  }).join("");
  const bars = geneDefinitions.map((definition, index) => {
    const value = values[definition.key] || 0;
    const x = 104 + index * 50;
    const y = 326;
    const height = 8 + value * 0.22;
    return `<rect class="gene-effect-bar" x="${x}" y="${y - height}" width="28" height="${height.toFixed(1)}" rx="5" />`;
  }).join("");
  return `${rings}${strands}${beams}${nodes}${bars}`;
}

function updateGeneBaseModel(result) {
  const image = document.querySelector("[data-dino-base-model]");
  const stage = document.querySelector("[data-dino-model]");
  if (!image) return;

  let assetKey = result.primary;
  if (result.primary === "predator" && result.values.crest > 62 && result.values.aquatic > 28) {
    assetKey = "hybridSpine";
  }
  if (result.primary === "armored" && result.values.armor > 74 && result.values.crest < 45) {
    assetKey = "hybridPlate";
  }
  if (result.primary === "aquatic" && result.values.jaw > 84) {
    assetKey = "hybridApex";
  }

  const nextSrc = geneModelAssets[assetKey] || geneModelAssets[result.primary] || geneModelAssets.predator;
  if (!image.getAttribute("src")?.endsWith(nextSrc.replace("assets/", ""))) {
    image.src = nextSrc;
  }
  image.alt = "";

  if (stage) {
    stage.dataset.lineage = result.primary;
    stage.style.setProperty("--gene-model-yaw", `${-10 + result.values.speed * 0.08 - result.values.armor * 0.04}deg`);
    stage.style.setProperty("--gene-model-pitch", `${-2 + result.values.aquatic * 0.04}deg`);
    stage.style.setProperty("--gene-model-scale", `${(0.94 + result.values.skeleton * 0.0018 + result.values.jaw * 0.0012).toFixed(3)}`);
  }
}

function renderGeneratedDino(result) {
  const layer = document.querySelector("[data-gene-effect-layer]");
  const name = document.querySelector("[data-dino-name]");
  const archetype = document.querySelector("[data-dino-archetype]");
  const stability = document.querySelector("[data-dino-stability]");
  const risk = document.querySelector("[data-dino-risk]");
  const ecology = document.querySelector("[data-dino-ecology]");
  const score = document.querySelector("[data-dino-score]");
  const lineage = document.querySelector("[data-dino-lineage]");
  if (!layer) return;

  updateGeneBaseModel(result);

  layer.innerHTML = buildGeneEffectLayer(result);

  if (name) name.textContent = result.name;
  if (archetype) archetype.textContent = result.archetype;
  if (stability) stability.textContent = `${result.stability}%`;
  if (risk) risk.textContent = result.risk;
  if (ecology) ecology.textContent = result.ecology;
  if (score) score.textContent = `${result.targetScore}%`;
  if (lineage) {
    lineage.innerHTML = result.lineage.slice(0, 3).map(([key, value]) => {
      const label = geneTargets[key]?.label || key;
      return `<span>${label} ${Math.round(value)}%</span>`;
    }).join("");
  }
}

function setGeneTarget(targetName) {
  activeGeneTarget = geneTargets[targetName] ? targetName : "predator";
  document.querySelectorAll("[data-gene-target]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.geneTarget === activeGeneTarget);
  });
  updateGenomeForge();
}

function updateGenomeForge() {
  const sliders = Array.from(document.querySelectorAll("[data-gene-slider]"));
  const values = Array.from(document.querySelectorAll("[data-gene-value]"));
  const output = document.querySelector("[data-gene-output]");
  const copy = document.querySelector("[data-gene-copy]");
  const helix = document.querySelector("[data-gene-helix]");
  if (!sliders.length || !output) return;

  const numbers = sliders.map((slider, index) => {
    const value = Number(slider.value);
    if (values[index]) values[index].textContent = String(value);
    return value;
  });
  const average = Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
  output.textContent = `REBUILD ${average}%`;

  if (copy) {
    copy.textContent = average > 82
      ? "复原阵列进入高精度模式，骨骼、皮肤和神经响应正在同步收束。"
      : "调整滑杆可以改变骨架密度、皮肤纹理和神经响应，观察螺旋光场实时变化。";
  }

  if (helix) {
    helix.style.setProperty("--gene-intensity", (average / 100).toFixed(2));
  }

  bioThreeScene?.setGeneIntensity(average / 100);
  renderGeneratedDino(computeDinoGenome(getGeneValues()));
}

function setHabitatScenario(name) {
  const scenario = habitatScenarios[name] || habitatScenarios.storm;
  const map = document.querySelector("[data-habitat-map]");
  const title = document.querySelector("[data-habitat-title]");
  const copy = document.querySelector("[data-habitat-copy]");
  const humidity = document.querySelector('[data-habitat-metric="humidity"]');
  const pressure = document.querySelector('[data-habitat-metric="pressure"]');

  if (map) map.dataset.scenario = name;
  earthState.scenario = habitatScenarios[name] ? name : "storm";
  if (shelfLabel) {
    shelfLabel.textContent = earthShelfLabels[earthState.scenario] || earthShelfLabels.storm;
  }
  if (title) title.textContent = scenario.title;
  if (copy) copy.textContent = scenario.copy;
  if (humidity) humidity.textContent = scenario.humidity;
  if (pressure) pressure.textContent = scenario.pressure;

  document.querySelectorAll("[data-habitat-scenario]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.habitatScenario === name);
  });

  drawAncientEarth();
}

function setTimelineEra(name) {
  const era = timelineEras[name] || timelineEras.cambrian;
  const viewer = document.querySelector("[data-rift-viewer]");
  const date = document.querySelector("[data-rift-date]");
  const title = document.querySelector("[data-rift-title]");
  const copy = document.querySelector("[data-rift-copy]");

  if (viewer) viewer.dataset.activeEra = name;
  if (date) date.textContent = era.date;
  if (title) title.textContent = era.title;
  if (copy) copy.textContent = era.copy;

  document.querySelectorAll("[data-timeline-era]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.timelineEra === name);
  });
}

function setCommandAction(name) {
  const action = commandActions[name] || commandActions.scan;
  const core = document.querySelector("[data-command-core]");
  const status = document.querySelector("[data-command-status]");
  const routes = Array.from(document.querySelectorAll("[data-route-board] span"));

  if (core) core.textContent = action.core;
  if (status) status.textContent = action.status;
  routes.forEach((route, index) => {
    route.style.setProperty("--route", action.routes[index] || "50%");
  });

  document.querySelectorAll("[data-command-action]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.commandAction === name);
  });
}

function setArchiveSpecimen(name) {
  const specimen = archiveSpecimens[name] || archiveSpecimens.skeleton;
  const preview = document.querySelector("[data-archive-preview]");
  const code = document.querySelector("[data-archive-code]");
  const title = document.querySelector("[data-archive-title]");
  const copy = document.querySelector("[data-archive-copy]");

  if (preview) preview.dataset.activeSpecimen = name;
  if (code) code.textContent = specimen.code;
  if (title) title.textContent = specimen.title;
  if (copy) copy.textContent = specimen.copy;

  document.querySelectorAll("[data-archive-card]").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.archiveCard === name);
  });
}

function setSignalNode(name) {
  const node = signalNodes[name] || signalNodes.synapse;
  const map = document.querySelector("[data-signal-map]");
  const title = document.querySelector("[data-signal-title]");
  const copy = document.querySelector("[data-signal-copy]");
  const resonance = document.querySelector("[data-signal-resonance]");

  if (map) map.dataset.channel = name;
  if (title) title.textContent = node.title;
  if (copy) copy.textContent = node.copy;
  if (resonance) resonance.textContent = node.resonance;

  document.querySelectorAll("[data-signal-node]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.signalNode === name);
  });
}

function bindLabInteractions() {
  document.querySelectorAll("[data-gene-slider]").forEach((slider) => {
    slider.addEventListener("input", updateGenomeForge);
  });

  document.querySelectorAll("[data-gene-target]").forEach((button) => {
    button.addEventListener("click", () => setGeneTarget(button.dataset.geneTarget));
  });

  document.querySelectorAll("[data-habitat-scenario]").forEach((button) => {
    button.addEventListener("click", () => setHabitatScenario(button.dataset.habitatScenario));
  });

  document.querySelectorAll("[data-timeline-era]").forEach((button) => {
    button.addEventListener("click", () => setTimelineEra(button.dataset.timelineEra));
  });

  document.querySelectorAll("[data-command-action]").forEach((button) => {
    button.addEventListener("click", () => setCommandAction(button.dataset.commandAction));
  });

  document.querySelectorAll("[data-archive-card]").forEach((card) => {
    card.addEventListener("click", () => setArchiveSpecimen(card.dataset.archiveCard));
  });

  document.querySelectorAll("[data-signal-node]").forEach((button) => {
    button.addEventListener("click", () => setSignalNode(button.dataset.signalNode));
  });

  updateGenomeForge();
  setGeneTarget("predator");
  setHabitatScenario("storm");
  setTimelineEra("cambrian");
  setCommandAction("scan");
  setArchiveSpecimen("skeleton");
  setSignalNode("synapse");
}

function handlePointerParallax(event) {
  if (!parallaxTarget || reduceMotion.matches) return;

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const offsetX = (event.clientX - centerX) / centerX;
  const offsetY = (event.clientY - centerY) / centerY;

  parallaxTarget.style.setProperty("--tilt-x", `${offsetX * 8}px`);
  parallaxTarget.style.setProperty("--tilt-y", `${offsetY * 6}px`);
}

function startMotion() {
  resizeCanvas();
  cancelAnimationFrame(animationId);
  startCarouselAutoplay();
  drawAncientEarth();

  if (!reduceMotion.matches) {
    drawParticleField();
  } else {
    ctx.clearRect(0, 0, width, height);
    drawAncientEarth();
  }
}

window.addEventListener("resize", startMotion);
window.addEventListener("pointermove", handlePointerParallax);
reduceMotion.addEventListener("change", startMotion);

bindViewNavigation();
startMotion();
bindCarousel();
bindInteractiveModel();
bindEarthGlobe();
bindLabInteractions();
initThreeBiosphere();
updateTelemetry();
setInterval(updateTelemetry, 900);
