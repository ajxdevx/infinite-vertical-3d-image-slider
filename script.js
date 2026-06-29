import * as THREE from "three";

const slides = [
  { name: "Contour", img: "/img1.jpg" },
  { name: "Velum Drift", img: "/img2.jpg" },
  { name: "Quiet Exchange", img: "/img3.jpg" },
  { name: "Earth Routine", img: "/img4.jpg" },
  { name: "Metal Echo", img: "/img5.jpg" },
  { name: "Tanned Edge", img: "/img6.jpg" },
  { name: "Humidity", img: "/img7.jpg" },
  { name: "Limestone Air", img: "/img8.jpg" },
  { name: "Warm Surface", img: "/img9.jpg" },
  { name: "Dust & Craft", img: "/img10.jpg" },
];

const config = {
  minHeight: 1,
  maxHeight: 1.5,
  aspectRatio: 1.5,
  gap: 0.05,
  smoothing: 0.05,
  distortionStrength: 2.5,
  distortionSmoothing: 0.1,
  momentumFriction: 0.95,
  momentumThreshold: 0.001,
  wheelSpeed: 0.01,
  wheelMax: 150,
  dragSpeed: 0.01,
  dragMomentum: 0.01,
  touchSpeed: 0.01,
  touchMomentum: 0.1,
};

const canvas = document.querySelector("canvas");
const titleElement = document.querySelector("p#slide-title");
const counterElement = document.querySelector("p#slide-count");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141414);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.z = 5;

const wrap = (value, range) => ((value % range) + range) % range;

const zeroPad = (n) => String(n).padStart(2, "0");

const totalSlides = slides.length;

const slideHeights = Array.from(
  { length: totalSlides },
  () =>
    config.minHeight + Math.random() * (config.maxHeight - config.minHeight),
);

const slideOffsets = [];
let stackPosition = 0;

for (let i = 0; i < totalSlides; i++) {
  if (i === 0) {
    slideOffsets.push(0);
    stackPosition = slideHeights[0] / 2;
  } else {
    stackPosition += config.gap + slideHeights[i] / 2;
    slideOffsets.push(stackPosition);
    stackPosition += slideHeights[i] / 2;
  }
}

const loopLength = stackPosition + config.gap + slideHeights[0] / 2;
const halfLoop = loopLength / 2;

const meshes = [];
const textureLoader = new THREE.TextureLoader();

for (let i = 0; i < totalSlides; i++) {
  const height = slideHeights[i];
  const width = height * config.aspectRatio;

  const geometry = new THREE.PlaneGeometry(width, height, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: 0x999999,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = {
    originalVertices: [...geometry.attributes.position.array],
    offset: slideOffsets[i],
    name: slides[i].name,
    index: i,
  };

  textureLoader.load(slides[i].img, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;

    const imageAspect = texture.image.width / texture.image.height;
    const planeAspect = width / height;
    const ratio = imageAspect / planeAspect;

    if (ratio > 1) mesh.scale.y = 1 / ratio;
    else mesh.scale.x = ratio;
  });

  scene.add(mesh);
  meshes.push(mesh);
}

function applyDistortion(mesh, positionY, strength) {
  const positions = mesh.geometry.attributes.position;
  const original = mesh.userData.originalVertices;

  for (let i = 0; i < positions.count; i++) {
    const x = original[i * 3];
    const y = original[i * 3 + 1];

    const distance = Math.sqrt(x * x + (positionY + y) ** 2);

    const falloff = Math.max(0, 1 - distance / 2);

    const bend = Math.pow(Math.sin((falloff * Math.PI) / 2), 1.5);
    positions.setZ(i, bend * strength);
  }

  positions.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

let scrollPosition = 0;
let scrollTarget = 0;
let scrollMomentum = 0;
let isScrolling = false;
let lastFrameTime = 0;

let distortionAmount = 0;
let distortionTarget = 0;
let velocityPeak = 0;
let scrollDirection = 0;
let directionTarget = 0;
const velocityHistory = [0, 0, 0, 0, 0];

let isDragging = false;
let dragStartY = 0;
let dragDelta = 0;
let touchStartY = 0;
let touchLastY = 0;

let activeSlideIndex = -1;

const addDistortionBurst = (amount) => {
  distortionTarget = Math.min(1, distortionTarget + amount);
};

window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    const clampedDelta =
      Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), config.wheelMax);

    addDistortionBurst(Math.abs(clampedDelta) * 0.001);
    scrollTarget += clampedDelta * config.wheelSpeed;
    isScrolling = true;

    clearTimeout(window._scrollTimeout);
    window._scrollTimeout = setTimeout(() => (isScrolling = false), 150);
  },
  { passive: false },
);

window.addEventListener(
  "touchstart",
  (e) => {
    touchStartY = touchLastY = e.touches[0].clientY;
    isScrolling = false;
    scrollMomentum = 0;
  },
  { passive: false },
);

window.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();

    const deltaY = e.touches[0].clientY - touchLastY;
    touchLastY = e.touches[0].clientY;

    addDistortionBurst(Math.abs(deltaY) * 0.02);
    scrollTarget -= deltaY * config.touchSpeed;
    isScrolling = true;
  },
  { passive: false },
);

window.addEventListener("touchend", () => {
  const swipeVelocity = (touchLastY - touchStartY) * 0.005;

  if (Math.abs(swipeVelocity) > 0.5) {
    scrollMomentum = -swipeVelocity * config.touchMomentum;
    addDistortionBurst(Math.abs(swipeVelocity) * 0.45);
    isScrolling = true;
    setTimeout(() => (isScrolling = false), 800);
  }
});

canvas.style.cursor = "grab";

window.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartY = e.clientY;
  dragDelta = 0;
  scrollMomentum = 0;
  canvas.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const deltaY = e.clientY - dragStartY;
  dragStartY = e.clientY;
  dragDelta = deltaY;

  addDistortionBurst(Math.abs(deltaY) * 0.02);
  scrollTarget -= deltaY * config.dragSpeed;
  isScrolling = true;
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;

  isDragging = false;
  canvas.style.cursor = "grab";

  if (Math.abs(dragDelta) > 2) {
    scrollMomentum = -dragDelta * config.dragMomentum;
    addDistortionBurst(Math.abs(dragDelta) * 0.005);
    isScrolling = true;
    setTimeout(() => (isScrolling = false), 800);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(time) {
  requestAnimationFrame(animate);

  const deltaTime = lastFrameTime ? (time - lastFrameTime) / 1000 : 0.016;
  lastFrameTime = time;

  const previousScroll = scrollPosition;

  if (isScrolling) {
    scrollTarget += scrollMomentum;
    scrollMomentum *= config.momentumFriction;
    if (Math.abs(scrollMomentum) < config.momentumThreshold) scrollMomentum = 0;
  }

  scrollPosition += (scrollTarget - scrollPosition) * config.smoothing;

  const frameDelta = scrollPosition - previousScroll;

  if (Math.abs(frameDelta) > 0.00001) {
    directionTarget = frameDelta > 0 ? 1 : -1;
  }
  scrollDirection += (directionTarget - scrollDirection) * 0.08;

  const velocity = Math.abs(frameDelta) / deltaTime;

  velocityHistory.push(velocity);
  velocityHistory.shift();
  const averageVelocity =
    velocityHistory.reduce((a, b) => a + b) / velocityHistory.length;

  if (averageVelocity > velocityPeak) velocityPeak = averageVelocity;

  const isDecelerating =
    averageVelocity / (velocityPeak + 0.001) < 0.7 && velocityPeak > 0.5;
  velocityPeak *= 0.99;

  if (velocity > 0.05)
    distortionTarget = Math.max(distortionTarget, Math.min(1, velocity * 0.1));
  if (isDecelerating || averageVelocity < 0.2)
    distortionTarget *= isDecelerating ? 0.95 : 0.855;

  distortionAmount +=
    (distortionTarget - distortionAmount) * config.distortionSmoothing;

  const signedDistortion = distortionAmount * scrollDirection;

  let closestDistance = Infinity;
  let closestIndex = 0;

  meshes.forEach((mesh) => {
    const { offset } = mesh.userData;

    let y = -(offset - wrap(scrollPosition, loopLength));
    y = wrap(y + halfLoop, loopLength) - halfLoop;

    mesh.position.y = y;

    if (Math.abs(y) < closestDistance) {
      closestDistance = Math.abs(y);
      closestIndex = mesh.userData.index;
    }

    if (Math.abs(y) < halfLoop + config.maxHeight) {
      applyDistortion(mesh, y, config.distortionStrength * signedDistortion);
    }
  });

  if (closestIndex !== activeSlideIndex) {
    activeSlideIndex = closestIndex;
    titleElement.textContent = slides[activeSlideIndex].name;
    counterElement.textContent = zeroPad(activeSlideIndex + 1);
  }

  renderer.render(scene, camera);
}

animate();
