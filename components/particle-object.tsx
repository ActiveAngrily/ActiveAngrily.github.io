"use client";

// Canvas UI Particle Object. Copyright (c) 2026 David Haz.
// MIT + Commons Clause; see public/canvas-ui-license.txt.
// Local image-only adaptation; model loaders and camera controls omitted.

import { useEffect, useRef, useState } from "react";

const canvasDimensionLimits = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, number>();

/** Keep the existing DPR budget, then account for browser pinch zoom. */
function getCanvasPixelRatio(
  element: HTMLElement,
  context?: WebGLRenderingContext | WebGL2RenderingContext,
): number {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) * scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX_TEXTURE_SIZE),
        context.getParameter(context.MAX_RENDERBUFFER_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  // Rendering the full element preserves its CSS position and native input
  // geometry while panning. Bound allocations when zooming large canvases.
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16_777_216 / (width * height)),
  );
}

/** Pinch zoom changes visualViewport without resizing the element's CSS box. */
function createCanvasResizeObserver(onResize: () => void) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("resize", schedule, { passive: true });
  return {
    observe(element: Element, options?: ResizeObserverOptions) {
      observer.observe(element, options);
    },
    unobserve(element: Element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
    },
  };
}

import * as THREE from "three";
function createRectCache(element: Element) {
  let current = element.getBoundingClientRect();

  const refresh = () => {
    current = element.getBoundingClientRect();
  };

  const observer = new ResizeObserver(refresh);
  observer.observe(element);
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("scroll", refresh, {
    capture: true,
    passive: true,
  });

  return {
    get current() {
      return current;
    },
    destroy() {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    },
  };
}

export interface ParticleObjectOptions {
  /** URL of the image to rebuild as particles. */
  src?: string;
  /** Number of particles the asset is rebuilt from. */
  count?: number;
  /** Particle size in CSS pixels at the model's distance. */
  size?: number;
  /** Random per-particle size variation (0 to 1). */
  sizeVariance?: number;
  /** Override color as any CSS color. Empty string keeps the asset's own colors. */
  color?: string;
  /** Radius of the cursor's push field in CSS pixels. */
  radius?: number;
  /** How hard the cursor pushes particles away. */
  strength?: number;
  /** Tangential curl of the push (0 to 2). Particles spiral around the cursor instead of only fleeing it. */
  swirl?: number;
  /** How quickly displaced particles spring back home. */
  spring?: number;
  /** Velocity damping (0 to 1). Lower values keep particles wobbling longer. */
  damping?: number;
  /** Idle shimmer of the resting particles (0 disables). */
  drift?: number;
  /** Background color behind the particles. Empty string keeps the canvas transparent. */
  background?: string;
  /** Size of the longest side of the asset in scene units. The camera sits about 4 units away. */
  scale?: number;
  /** Horizontal offset of the asset in scene units. */
  xOffset?: number;
  /** Vertical offset of the asset in scene units. */
  yOffset?: number;
  /** Strength of the floating bob animation (0 disables). */
  floatIntensity?: number;
  /** Strength of the idle rocking rotation (0 disables). */
  rotationIntensity?: number;
  /** Speed of the float and rocking animation. */
  floatSpeed?: number;
  /** Camera field of view in degrees. */
  fov?: number;
  /** Camera distance from the center of the asset. */
  cameraDistance?: number;
  /** Called when image decoding or WebGL setup fails. */
  onError?: ((error: unknown) => void) | null;
}

export interface ParticleObjectElements {
  /** Canvas the scene renders to. */
  canvas: HTMLCanvasElement;
}

export interface ParticleObjectInstance {
  /** Update options live. Changing src loads the new asset. */
  setOptions: (options: ParticleObjectOptions) => void;
  /** Re-read canvas size. Call when the element is resized. */
  resize: () => void;
  /** Stop the loop and release all GPU resources. */
  destroy: () => void;
}

const DEFAULTS: Required<ParticleObjectOptions> = {
  src: "",
  count: 14000,
  size: 2.4,
  sizeVariance: 0.6,
  color: "",
  radius: 110,
  strength: 1,
  swirl: 0.6,
  spring: 1,
  damping: 0.35,
  drift: 0.6,
  background: "",
  scale: 3,
  xOffset: 0,
  yOffset: 0,
  floatIntensity: 2,
  rotationIntensity: 1,
  floatSpeed: 2,
  fov: 65,
  cameraDistance: 4.2,
  onError: null,
};

const CAMERA_DIR = new THREE.Vector3(0, -1, 4).normalize();
const MODEL_LIFT = 0.3;
const RASTER_SIZE = 420;

const VERT = `
in vec3 aColor;
in float aShade;
in float aSeed;
out vec3 vColor;
uniform float uTime;
uniform float uDrift;
uniform float uSize;
uniform float uVariance;
uniform float uDpr;
uniform float uRefDist;
uniform vec3 uTint;
uniform float uUseTint;

void main() {
  vec3 p = position;

  float t = uTime + aSeed * 39.0;
  p += uDrift * 0.005 * vec3(
    sin(t * 1.7 + aSeed * 61.0),
    cos(t * 1.3 + aSeed * 23.0),
    sin(t * 2.3 + aSeed * 47.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float jitter = 1.0 + uVariance * (fract(aSeed * 7.13) - 0.5) * 1.4;
  gl_PointSize = clamp(
    uSize * uDpr * jitter * (uRefDist / max(-mv.z, 0.1)), 0.0, 64.0);
  vColor = mix(aColor, uTint * aShade, uUseTint);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = `
precision highp float;
in vec3 vColor;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c);
  float alpha = 1.0 - smoothstep(0.16, 0.25, r2);
  if (alpha < 0.08) discard;
  outColor = vec4(vColor, alpha);
}`;

interface CloudSample {
  positions: Float32Array;
  colors: Float32Array;
  shades: Float32Array;
}

function sampleImage(data: ImageData, count: number): CloudSample {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const shades = new Float32Array(count);

  const pixels: number[] = [];
  const weights: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < data.width * data.height; i++) {
    const alpha = data.data[i * 4 + 3];
    if (alpha < 10) continue;
    totalWeight += alpha;
    pixels.push(i);
    weights.push(totalWeight);
  }
  if (pixels.length === 0) return { positions, colors, shades };

  const longest = Math.max(data.width, data.height);
  for (let i = 0; i < count; i++) {
    const pick = Math.random() * totalWeight;
    let lo = 0;
    let hi = weights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (weights[mid] < pick) lo = mid + 1;
      else hi = mid;
    }
    const p = pixels[lo];
    const px = p % data.width;
    const py = Math.floor(p / data.width);
    positions[i * 3] = (px + Math.random() - data.width / 2) / longest;
    positions[i * 3 + 1] = -(py + Math.random() - data.height / 2) / longest;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    colors[i * 3] = data.data[p * 4] / 255;
    colors[i * 3 + 1] = data.data[p * 4 + 1] / 255;
    colors[i * 3 + 2] = data.data[p * 4 + 2] / 255;
    shades[i] = 1;
  }

  return { positions, colors, shades };
}

function normalizeCloud(sample: CloudSample) {
  const p = sample.positions;
  if (p.length === 0) return;
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    minX = Math.min(minX, p[i]);
    maxX = Math.max(maxX, p[i]);
    minY = Math.min(minY, p[i + 1]);
    maxY = Math.max(maxY, p[i + 1]);
    minZ = Math.min(minZ, p[i + 2]);
    maxZ = Math.max(maxZ, p[i + 2]);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const inv = 1 / Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-4);
  for (let i = 0; i < p.length; i += 3) {
    p[i] = (p[i] - cx) * inv;
    p[i + 1] = (p[i + 1] - cy) * inv;
    p[i + 2] = (p[i + 2] - cz) * inv;
  }
}

function rasterizeImage(blob: Blob): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const width = image.naturalWidth || 1024;
      const height = image.naturalHeight || 1024;
      const ratio = Math.min(1, RASTER_SIZE / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("2d context unavailable"));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode the image"));
    };
    image.src = url;
  });
}

export function createParticleObject(
  elements: ParticleObjectElements,
  options: ParticleObjectOptions = {},
): ParticleObjectInstance | null {
  const { canvas } = elements;
  const config: Required<ParticleObjectOptions> = { ...DEFAULTS, ...options };

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    config.onError?.(error);
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(config.fov, 1, 0.1, 200);
  camera.position.copy(CAMERA_DIR).multiplyScalar(config.cameraDistance);

  const floatGroup = new THREE.Group();
  floatGroup.position.y = MODEL_LIFT;
  const fitGroup = new THREE.Group();
  floatGroup.add(fitGroup);
  scene.add(floatGroup);

  camera.lookAt(0, 0, 0);

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: Math.random() * 100 },
      uDrift: { value: config.drift },
      uSize: { value: config.size },
      uVariance: { value: config.sizeVariance },
      uDpr: { value: 1 },
      uRefDist: { value: config.cameraDistance },
      uTint: { value: new THREE.Color(1, 1, 1) },
      uUseTint: { value: 0 },
    },
  });

  let points: THREE.Points | null = null;
  let homes: Float32Array | null = null;
  let velocities: Float32Array | null = null;
  let particleCount = 0;
  let assetSource: ImageData | null = null;
  let builtCount = -1;
  let loadedSrc: string | null = null;
  let loadToken = 0;
  const loadController = new AbortController();
  let disposed = false;

  function clearPoints() {
    if (!points) return;
    fitGroup.remove(points);
    points.geometry.dispose();
    points = null;
    homes = null;
    velocities = null;
    particleCount = 0;
  }

  function clearAsset() {
    assetSource = null;
    builtCount = -1;
    clearPoints();
  }

  function buildCloud() {
    if (!assetSource) return;
    const count = Math.max(Math.round(config.count), 16);
    if (count === builtCount && points) return;
    builtCount = count;
    clearPoints();

    const sample = sampleImage(assetSource, count);
    normalizeCloud(sample);

    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = Math.random();

    const geometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(sample.positions.slice(), 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttr);
    geometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(sample.colors, 3),
    );
    geometry.setAttribute(
      "aShade",
      new THREE.BufferAttribute(sample.shades, 1),
    );
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    homes = sample.positions;
    velocities = new Float32Array(count * 3);
    particleCount = count;
    points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    fitGroup.add(points);
  }

  async function loadAsset() {
    const src = config.src;
    if (src === loadedSrc) return;
    loadedSrc = src;
    const token = ++loadToken;
    if (!src) {
      clearAsset();
      return;
    }
    try {
      const response = await fetch(src, { signal: loadController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await rasterizeImage(await response.blob());
      if (disposed || token !== loadToken) return;
      clearAsset();
      assetSource = data;
      buildCloud();
      startLoop();
    } catch (error) {
      if (disposed || token !== loadToken) return;
      config.onError?.(error);
    }
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;
  const onMotionChange = () => {
    reducedMotion = motionQuery.matches;
    if (reducedMotion) floatGroup.rotation.set(0, 0, 0);
    applyOptions();
    startLoop();
  };
  motionQuery.addEventListener("change", onMotionChange);

  const tint = new THREE.Color();

  function applyOptions() {
    renderer.setClearColor(
      new THREE.Color(config.background || "#000000"),
      config.background ? 1 : 0,
    );
    camera.fov = config.fov;
    camera.updateProjectionMatrix();
    floatGroup.position.x = config.xOffset;
    floatGroup.position.y = MODEL_LIFT + config.yOffset;
    fitGroup.scale.setScalar(config.scale);
    material.uniforms.uDrift.value = reducedMotion
      ? 0
      : Math.max(config.drift, 0);
    material.uniforms.uSize.value = Math.max(config.size, 0.1);
    material.uniforms.uVariance.value = Math.min(
      Math.max(config.sizeVariance, 0),
      1,
    );
    material.uniforms.uRefDist.value = config.cameraDistance;
    if (config.color) {
      tint.set(config.color);
      (material.uniforms.uTint.value as THREE.Color).copy(tint);
      material.uniforms.uUseTint.value = 1;
    } else {
      material.uniforms.uUseTint.value = 0;
    }
  }

  function resize() {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const pr = getCanvasPixelRatio(canvas, renderer.getContext());
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    material.uniforms.uDpr.value = pr;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  const observer = createCanvasResizeObserver(resize);
  observer.observe(canvas);
  resize();
  applyOptions();
  loadAsset();

  let pointerX = 0;
  let pointerY = 0;
  let pointerActive = false;
  let pointerSpeed = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = 0;
  let shoveX = 0;
  let shoveY = 0;

  const rectCache = createRectCache(canvas);

  function onPointerMove(event: PointerEvent) {
    const rect = rectCache.current;
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    const now = performance.now();
    if (pointerActive && lastPointerTime) {
      const dt = Math.max((now - lastPointerTime) / 1000, 1e-3);
      const dx = pointerX - lastPointerX;
      const dy = pointerY - lastPointerY;
      const speed = Math.hypot(dx, dy) / dt;
      pointerSpeed += (speed - pointerSpeed) * 0.35;
      if (speed > 1) {
        const inv = 1 / Math.max(Math.hypot(dx, dy), 1e-3);
        shoveX += (dx * inv - shoveX) * 0.4;
        shoveY += (dy * inv - shoveY) * 0.4;
      }
    }
    lastPointerX = pointerX;
    lastPointerY = pointerY;
    lastPointerTime = now;
    pointerActive = true;
  }

  function onPointerLeave() {
    pointerActive = false;
    pointerSpeed = 0;
    lastPointerTime = 0;
  }

  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
  canvas.addEventListener("pointercancel", onPointerLeave, { passive: true });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const inverseMatrix = new THREE.Matrix4();
  const localOrigin = new THREE.Vector3();
  const localDir = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const camBack = new THREE.Vector3();
  const localShove = new THREE.Vector3();

  function simulate(delta: number) {
    if (!points || !homes || !velocities || particleCount === 0) return;
    const positionAttr = points.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const p = positionAttr.array as Float32Array;
    const h = homes;
    const v = velocities;

    const stiffness = 60 * Math.max(config.spring, 0.05);
    const dampingRate = 3 + 12 * Math.min(Math.max(config.damping, 0), 1);
    const decay = Math.exp(-dampingRate * delta);

    let pushing = false;
    let ox = 0,
      oy = 0,
      oz = 0,
      dx = 0,
      dy = 0,
      dz = 1;
    let localRadius = 0;
    let pushAccel = 0;
    let shove = 0;

    if (pointerActive && !reducedMotion && config.strength > 0) {
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      ndc.set((pointerX / width) * 2 - 1, -(pointerY / height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);

      points.updateWorldMatrix(true, false);
      inverseMatrix.copy(points.matrixWorld).invert();
      localOrigin.copy(raycaster.ray.origin).applyMatrix4(inverseMatrix);
      localDir.copy(raycaster.ray.direction).transformDirection(inverseMatrix);

      const worldScale = Math.max(fitGroup.scale.x, 1e-4);
      const worldPerPx =
        (2 *
          camera.position.distanceTo(floatGroup.position) *
          Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) /
        height;
      localRadius = (Math.max(config.radius, 1) * worldPerPx) / worldScale;
      pushAccel = 26 * config.strength;
      shove = Math.min(pointerSpeed / 900, 2) * 14 * config.strength;
      camera.matrixWorld.extractBasis(camRight, camUp, camBack);
      localShove
        .set(0, 0, 0)
        .addScaledVector(camRight, shoveX)
        .addScaledVector(camUp, -shoveY)
        .transformDirection(inverseMatrix);

      ox = localOrigin.x;
      oy = localOrigin.y;
      oz = localOrigin.z;
      dx = localDir.x;
      dy = localDir.y;
      dz = localDir.z;
      pushing = true;
    }

    const swirl = Math.min(Math.max(config.swirl, 0), 2);
    const r2max = localRadius * localRadius;

    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;
      let vx = v[ix];
      let vy = v[iy];
      let vz = v[iz];

      if (pushing) {
        const wx = p[ix] - ox;
        const wy = p[iy] - oy;
        const wz = p[iz] - oz;
        const t = Math.max(wx * dx + wy * dy + wz * dz, 0);
        let rx = wx - dx * t;
        let ry = wy - dy * t;
        let rz = wz - dz * t;
        const dist2 = rx * rx + ry * ry + rz * rz;
        if (dist2 < r2max) {
          const dist = Math.sqrt(dist2);
          const inv = 1 / Math.max(dist, 1e-5);
          rx *= inv;
          ry *= inv;
          rz *= inv;
          const fall = 1 - dist / localRadius;
          const f = fall * fall * delta;
          const tx = dy * rz - dz * ry;
          const ty = dz * rx - dx * rz;
          const tz = dx * ry - dy * rx;
          vx += (rx + tx * swirl) * pushAccel * f + localShove.x * shove * f;
          vy += (ry + ty * swirl) * pushAccel * f + localShove.y * shove * f;
          vz += (rz + tz * swirl) * pushAccel * f + localShove.z * shove * f;
        }
      }

      vx += (h[ix] - p[ix]) * stiffness * delta;
      vy += (h[iy] - p[iy]) * stiffness * delta;
      vz += (h[iz] - p[iz]) * stiffness * delta;
      vx *= decay;
      vy *= decay;
      vz *= decay;
      p[ix] += vx * delta;
      p[iy] += vy * delta;
      p[iz] += vz * delta;
      v[ix] = vx;
      v[iy] = vy;
      v[iz] = vz;
    }

    positionAttr.needsUpdate = true;
  }

  let inView = true;
  let loopRunning = false;

  function tick(time: number) {
    if (!inView || document.hidden) {
      lastTime = 0;
      stopLoop();
      return;
    }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 0;
    lastTime = time;

    if (!reducedMotion) {
      elapsed += delta * config.floatSpeed;
      floatGroup.rotation.x =
        (Math.cos(elapsed / 4) / 8) * config.rotationIntensity;
      floatGroup.rotation.y =
        (Math.sin(elapsed / 4) / 8) * config.rotationIntensity;
      floatGroup.rotation.z =
        (Math.sin(elapsed / 4) / 20) * config.rotationIntensity;
      floatGroup.position.y =
        MODEL_LIFT +
        config.yOffset +
        (Math.sin(elapsed / 1.5) / 10) * config.floatIntensity;
      material.uniforms.uTime.value += delta;
    }

    pointerSpeed *= Math.exp(-3 * delta);

    if (delta > 0) simulate(delta);
    renderer.render(scene, camera);
    if (reducedMotion) stopLoop();
  }

  function startLoop() {
    if (loopRunning || !inView || disposed || document.hidden) return;
    lastTime = 0;
    loopRunning = true;
    renderer.setAnimationLoop(tick);
  }

  function stopLoop() {
    if (!loopRunning) return;
    loopRunning = false;
    renderer.setAnimationLoop(null);
  }

  const viewObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1]?.isIntersecting ?? true;
          if (inView) {
            startLoop();
          } else {
            stopLoop();
          }
        })
      : null;
  viewObserver?.observe(canvas);

  function onVisibilityChange() {
    if (document.hidden) stopLoop();
    else startLoop();
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  let lastTime = 0;
  let elapsed = Math.random() * 100;

  startLoop();

  return {
    setOptions(next: ParticleObjectOptions) {
      let changed = false;
      for (const [key, value] of Object.entries(next)) {
        if (typeof value === "function") continue;
        if (config[key as keyof ParticleObjectOptions] !== value) {
          changed = true;
          break;
        }
      }
      if (!changed) {
        Object.assign(config, next);
        return;
      }

      const previousDistance = config.cameraDistance;
      const previousCount = config.count;
      Object.assign(config, next);
      if (config.cameraDistance !== previousDistance) {
        camera.position.copy(CAMERA_DIR).multiplyScalar(config.cameraDistance);
      }
      applyOptions();
      if (config.count !== previousCount) buildCloud();
      loadAsset();
      startLoop();
    },
    resize,
    destroy() {
      disposed = true;
      loadController.abort();
      rectCache.destroy();
      loadToken += 1;
      stopLoop();
      observer.disconnect();
      viewObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointercancel", onPointerLeave);
      clearAsset();
      material.dispose();
      renderer.dispose();
    },
  };
}

export interface ParticleObjectProps extends ParticleObjectOptions {
  className?: string;
  style?: React.CSSProperties;
}

export function ParticleObject({
  className,
  style,
  ...options
}: ParticleObjectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<ParticleObjectInstance | null>(null);
  const [initialOptions] = useState(options);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createParticleObject({ canvas }, initialOptions);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "pan-y",
        }}
      />
    </div>
  );
}
