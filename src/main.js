// MAC0623 — A1 Desktop Docking Testbed — STARTER
//
// Provided: scene setup, target-pose generation, the tolerance check, the
// trial state machine, and the CSV logger/downloader.
//
// You implement: the control mapping(s) that move/rotate the cube in
// response to input. Everything you need to touch is inside blocks marked
//   // ===== STUDENT TODO ===== ... // ===== END STUDENT TODO =====
// Do not need to touch  anything outside those blocks to get a working
// baseline mapping — but you may, if your design requires it (e.g. extra
// HUD state for a second input mode). If you do, note it in your README.

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Module-scope state — provided
//
// Populated once, by main() (via buildScene() for scene/cube/target), before
// any trial starts or any frame renders. Everything below this point —
// generateTargetPose(), checkTolerance(), updateControlMapping(), animate()
// — reads and writes these directly, the same way it would if they were
// still declared inline where they're first used.
// ---------------------------------------------------------------------------

let scene, camera, renderer, cube, target;

/**
 * buildScene()
 *
 * Builds the static contents of the 3D scene: background color, lighting,
 * the reference grid/axes, the student-controlled cube, and the translucent
 * target mesh (the goal pose). Does not create the camera or renderer —
 * that's main()'s job — and does not start the render loop.
 *
 * Pure with respect to the rest of the app: it only touches the THREE.Scene
 * it creates and returns, so it's safe to read top-to-bottom on its own.
 *
 * @returns {{ scene: THREE.Scene, cube: THREE.Mesh, target: THREE.Mesh }}
 *   The new scene, plus direct references to the two meshes the rest of the
 *   app needs: `cube` (control mappings write to `cube.position` /
 *   `cube.quaternion`) and `target` (`generateTargetPose()` writes to it
 *   every trial).
 */
function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(2, 4, 3);
  scene.add(dirLight);

  scene.add(new THREE.GridHelper(6, 24, 0x444444, 0x2a2a2a));
  scene.add(new THREE.AxesHelper(0.6));

  // Cube (student-controlled) and target (goal pose) share one geometry —
  // the target clones it so the two meshes can have independent materials
  // (opaque vs. translucent) without sharing a single Mesh instance.
  const cubeGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const cubeMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xdd0000 }),
    new THREE.MeshStandardMaterial({ color: 0x00dd00 }),
    new THREE.MeshStandardMaterial({ color: 0x0000cc }),
    new THREE.MeshStandardMaterial({ color: 0xcccc00 }),
    new THREE.MeshStandardMaterial({ color: 0xccaacc }),
    new THREE.MeshStandardMaterial({ color: 0x00aaaa })
  ]

  const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
  cube.position.set(0, 0.5, 0);
  cube.layers.set(1);
  scene.add(cube);

  const targetMaterials = cubeMaterials.map(mat =>
    new THREE.MeshStandardMaterial({
      color: mat.color,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    })
  )
  const target = new THREE.Mesh(cubeGeometry.clone(), targetMaterials);
  scene.add(target);

  return { scene, cube, target };
}

/**
 * main()
 *
 * Entry point for the whole app. Order matters here:
 *   1. Build the scene (`buildScene()`) — cube and target must exist before
 *      anything below tries to read their position/quaternion.
 *   2. Create the camera and renderer, and wire the window resize handler.
 *   3. Start the trial state machine (`startTrial()`), which generates the
 *      first target pose.
 *   4. Start the render loop (`animate()`).
 *
 * Called once, at the bottom of this file. Everything it sets up
 * (`scene`, `camera`, `renderer`, `cube`, `target`) is written into the
 * module-scope variables declared above, so the rest of the file can keep
 * referring to them as plain names instead of threading them through every
 * function call.
 */
function main() {
  ({ scene, cube, target } = buildScene());

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.05,
    100
  );
  camera.position.set(0, 1.4, 4);
  camera.lookAt(0, 0.5, 0);
  camera.layers.enable(1);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", handleWindowResize);

  startTrial();
  animate();
}

/**
 * handleWindowResize()
 *
 * Keeps the camera's aspect ratio and the renderer's output size in sync
 * with the browser window. Registered as the "resize" listener in main().
 */
function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---------------------------------------------------------------------------
// Target-pose generation — provided
//
// Uses Shoemake's algorithm for a uniformly-random unit quaternion (uniform
// over SO(3)), rather than converting random Euler angles, which would bias
// the sampled orientations. Position is uniform within a bounding box in
// front of the camera.
// ---------------------------------------------------------------------------

function randomQuaternionShoemake() {
  const u1 = Math.random();
  const u2 = Math.random();
  const u3 = Math.random();

  const sqrt1MinusU1 = Math.sqrt(1 - u1);
  const sqrtU1 = Math.sqrt(u1);

  const theta1 = 2 * Math.PI * u2;
  const theta2 = 2 * Math.PI * u3;

  return new THREE.Quaternion(
    sqrt1MinusU1 * Math.sin(theta1),
    sqrt1MinusU1 * Math.cos(theta1),
    sqrtU1 * Math.sin(theta2),
    sqrtU1 * Math.cos(theta2)
  );
}

const TARGET_BOUNDS = {
  x: [-1.0, 1.0],
  y: [0.2, 1.6],
  z: [-0.6, 0.6],
};

function randomInRange([min, max]) {
  return min + Math.random() * (max - min);
}

function generateTargetPose() {
  target.position.set(
    randomInRange(TARGET_BOUNDS.x),
    randomInRange(TARGET_BOUNDS.y),
    randomInRange(TARGET_BOUNDS.z)
  );
  target.quaternion.copy(randomQuaternionShoemake());
}

// ---------------------------------------------------------------------------
// Tolerance check — provided
//
// Position tolerance: 0.05 units (world units == meters, at this scene
// scale). Orientation tolerance: 10 degrees, measured via
// Quaternion.angleTo(), which is robust to double-cover (q and -q represent
// the same rotation) — do not compute orientation error from Euler angles.
// ---------------------------------------------------------------------------

const POSITION_TOLERANCE = 0.05;
const ORIENTATION_TOLERANCE_DEG = 10;

function checkTolerance() {
  const positionError = cube.position.distanceTo(target.position);
  const orientationErrorRad = cube.quaternion.angleTo(target.quaternion);
  const orientationErrorDeg = THREE.MathUtils.radToDeg(orientationErrorRad);

  const withinTolerance =
    positionError <= POSITION_TOLERANCE &&
    orientationErrorDeg <= ORIENTATION_TOLERANCE_DEG;

  return { positionError, orientationErrorDeg, withinTolerance };
}

// ---------------------------------------------------------------------------
// HUD references — provided
// ---------------------------------------------------------------------------

const participantIdInput = document.getElementById("participantId");
const mappingSelect = document.getElementById("mappingSelect");
const trialCountEl = document.getElementById("trialCount");
const confirmBtn = document.getElementById("confirmBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");

// ---------------------------------------------------------------------------
// Trial state machine — provided
//
// presentation_order counts trials within the *current* mapping selection
// since the page loaded — it does not reset when you switch mapping in the
// dropdown mid-session, since order-of-presentation across mappings is part
// of what you're counterbalancing across participants (see A1's ABBA
// counterbalancing note). trial_number is a simple running counter of every
// trial confirmed this session, regardless of mapping.
// ---------------------------------------------------------------------------

let trialNumber = 0;
let presentationOrderByMapping = { 1: 0, 2: 0 };
let trialStartTime = performance.now();
let pathLength = 0; // accumulated cube-position travel distance this trial
// Placeholder — cube doesn't exist yet at module-load time (main() creates
// it via buildScene()). startTrial() calls lastCubePosition.copy(cube.position)
// before this value is ever read, so the zero vector here is never used.
let lastCubePosition = new THREE.Vector3();

// ===== STUDENT TODO =====
// Increment this from your own mapping code every time the user switches
// input mode (e.g. toggling translate/rotate mode in the baseline mapping).
// It is read (and reset) when a trial is confirmed.
let modeSwitches = 0;
// ===== END STUDENT TODO =====

const rows = [];
const CSV_HEADER = [
  "participant_id",
  "mapping",
  "trial_number",
  "presentation_order",
  "completion_time_s",
  "final_position_error",
  "final_orientation_error_deg",
  "mode_switches",
  "path_length",
];

function currentMapping() {
  return mappingSelect.value;
}

function startTrial() {
  trialStartTime = performance.now();
  pathLength = 0;
  lastCubePosition.copy(cube.position);
  modeSwitches = 0;
  generateTargetPose();
  trialCountEl.textContent = `Trial ${trialNumber + 1}`;
}

function confirmTrial() {
  const { positionError, orientationErrorDeg } = checkTolerance();
  const completionTimeS = (performance.now() - trialStartTime) / 1000;
  const mapping = currentMapping();

  trialNumber += 1;
  presentationOrderByMapping[mapping] = (presentationOrderByMapping[mapping] || 0) + 1;

  rows.push({
    participant_id: participantIdInput.value.trim() || "UNKNOWN",
    mapping,
    trial_number: trialNumber,
    presentation_order: presentationOrderByMapping[mapping],
    completion_time_s: completionTimeS.toFixed(3),
    final_position_error: positionError.toFixed(4),
    final_orientation_error_deg: orientationErrorDeg.toFixed(2),
    mode_switches: modeSwitches,
    path_length: pathLength.toFixed(4),
  });

  startTrial();
}

confirmBtn.addEventListener("click", confirmTrial);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyUp);

let keys = {
  'a': 0, 'd': 0, 'w': 0, 's': 0, 'r': 0, 'f': 0,
  'u': 0, 'o': 0, 'j': 0, 'l': 0, 'i': 0, 'k': 0
};

/**
 * handleKeydown(e)
 *
 * Keyboard shortcut for Confirm: Enter does the same thing as clicking
 * #confirmBtn. Registered as the "keydown" listener above.
 */
function handleKeydown(e) {
  keys[e.key] = 1;
}

function handleKeyUp(e) {
  keys[e.key] = 0;
}

// ---------------------------------------------------------------------------
// CSV download — provided
// ---------------------------------------------------------------------------

function buildCsv() {
  const lines = [CSV_HEADER.join(",")];
  for (const row of rows) {
    lines.push(
      CSV_HEADER.map(function (key) {
        return row[key];
      }).join(",")
    );
  }
  return lines.join("\n");
}

downloadBtn.addEventListener("click", handleDownloadClick);

/**
 * handleDownloadClick()
 *
 * Builds the CSV from `rows` (via buildCsv()), then triggers a browser
 * download through a temporary Blob URL and an off-DOM `<a>` click.
 * Registered as the "click" listener on #downloadBtn above.
 */
function handleDownloadClick() {
  const csv = buildCsv();
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const pid = participantIdInput.value.trim() || "UNKNOWN";
  a.href = url;
  a.download = `a1_${pid}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Status indicator — provided
// ---------------------------------------------------------------------------

function updateStatus() {
  const { positionError, orientationErrorDeg, withinTolerance } = checkTolerance();
  statusEl.textContent = `dPos ${positionError.toFixed(3)} | dRot ${orientationErrorDeg.toFixed(1)}deg`;
  statusEl.classList.toggle("in-tolerance", withinTolerance);
}

// ===== STUDENT TODO =====


let mouse = new THREE.Vector2(), lastMouse = new THREE.Vector2();
let TRANSLATION_MODE = true, TARGETING = false;

const cubeRaycaster = new THREE.Raycaster();
cubeRaycaster.layers.set(1);

function normalizeCursorCoords(mouseX, mouseY) {
  return new THREE.Vector2(
      (mouseX / window.innerWidth)  * 2 - 1,
    -((mouseY / window.innerHeight) * 2 - 1)
  )
}

/**
 * Checks if mouse cursor is above scene's main cube
 * 
 * @param {number} mouseX 
 * @param {number} mouseY 
 * @returns List of intersections
 */
function checkCubeIntersection(mouseX, mouseY) {
  const worldCoords = normalizeCursorCoords(mouseX, mouseY);

  cubeRaycaster.setFromCamera(worldCoords, camera);

  return cubeRaycaster.intersectObjects(scene.children, true);
}

// Handlers and Events

document.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX; mouse.y = event.clientY;
})
document.addEventListener('mousedown', handleMouseDown);

function handleMouseDown(event) {
  if(TARGETING)  {
    TARGETING = false;
    return;
  }

  // Currently not targeting the cube
  const intersections = checkCubeIntersection(event.clientX, event.clientY);
  TARGETING = intersections.length > 0;

  lastMouse.x = event.clientX;
  lastMouse.y = event.clientY;
}
document.addEventListener('wheel', (event) => {
  if(!TARGETING) return;

  if(TRANSLATION_MODE) cube.position.z -= event.deltaY * 0.01;
  else cube.rotateOnWorldAxis(new THREE.Vector3(0.0, 0.0, 1.0), event.deltaY * 0.01);
})

// Control Mapping

function updateControlMapping(deltaTime) {
  if (keys["Enter"]) {
    confirmTrial();
    keys["Enter"] = 0;
  }

  const mapping = currentMapping();
  if (mapping === "1") {
    baselineMapping();
  } else {
    keyboardMapping(deltaTime);
  }
}

function baselineMapping() {
    if(keys[' '] || keys['Tab']) {
      TRANSLATION_MODE = !TRANSLATION_MODE;
      modeSwitches++;
      keys[' '] = keys['Tab'] = 0;
    }

    if(!TARGETING) return;

    const cursorCoords  = normalizeCursorCoords(mouse.x, mouse.y);
    const intersection  = checkCubeIntersection(mouse.x, mouse.y);

    if(TRANSLATION_MODE) {
      // Translation
      const dist = camera.position.distanceTo(cube.position);
      const targetPoint = new THREE.Vector3();
      cubeRaycaster.ray.at(dist, targetPoint);

      cube.position.x = targetPoint.x;
      cube.position.y = targetPoint.y;
    } else {
      // Rotation
      const deltaX = mouse.x - lastMouse.x;
      const deltaY = mouse.y - lastMouse.y;

      cube.rotateOnWorldAxis(new THREE.Vector3(0.0, 1.0, 0.0), deltaX * 0.01);
      cube.rotateOnWorldAxis(new THREE.Vector3(1.0, 0.0, 0.0), deltaY * 0.01);
    }

    lastMouse = mouse.clone();
}

const KEYBOARD_TRANS_SENS = new THREE.Vector3(0.4, 0.4, 1.2);
const KEYBOARD_ROT_SENS   = new THREE.Vector3(1.0, 1.0, 1.0);

function keyboardMapping(deltaTime) {
  let transOffset = new THREE.Vector3(0.0, 0.0, 0.0);
  let rotOffset   = new THREE.Vector3(0.0, 0.0, 0.0);

  transOffset.x += (keys['d'] - keys['a']) * KEYBOARD_TRANS_SENS.x;
  transOffset.y += (keys['w'] - keys['s']) * KEYBOARD_TRANS_SENS.y;
  transOffset.z += (keys['f'] - keys['r']) * KEYBOARD_TRANS_SENS.z;

  rotOffset.x += (keys['k'] - keys['i']) * KEYBOARD_ROT_SENS.x;
  rotOffset.y += (keys['l'] - keys['j']) * KEYBOARD_ROT_SENS.y;
  rotOffset.z += (keys['u'] - keys['o']) * KEYBOARD_ROT_SENS.z;

  transOffset.multiplyScalar(deltaTime);
  rotOffset.multiplyScalar(deltaTime);

  cube.position.add(transOffset);
  cube.rotateOnWorldAxis(new THREE.Vector3(1.0, 0.0, 0.0), rotOffset.x);
  cube.rotateOnWorldAxis(new THREE.Vector3(0.0, 1.0, 0.0), rotOffset.y);
  cube.rotateOnWorldAxis(new THREE.Vector3(0.0, 0.0, 1.0), rotOffset.z);
}

// ===== END STUDENT TODO =====

// ---------------------------------------------------------------------------
// Render loop — provided
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateControlMapping(delta);

  // Generic path-length accumulation — measures how far the cube has
  // physically travelled this trial, regardless of mapping.
  pathLength += cube.position.distanceTo(lastCubePosition);
  lastCubePosition.copy(cube.position);

  updateStatus();

  renderer.render(scene, camera);
}

main();
