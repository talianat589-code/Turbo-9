
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

document.querySelector('#app').innerHTML = `
<div id="orientation-gate">
<div class="start-panel">
  <div class="start-logo">🏎️</div>
  <h2>TURBO KART 3D</h2>
  <p>Prepárate para correr.</p>
  <p id="orientation-hint">
    Para una mejor experiencia, juega con el teléfono en horizontal.
  </p>
  <button id="start-game">JUGAR</button>
</div>
</div>
  <main class="game">
    <header class="hud">
      <div>
        <span class="eyebrow">RACING EXPERIENCE</span>
        <h1>TURBO <span>KART</span></h1>
      </div>
      <div class="speed-panel">
  <div class="speed-box">
    <strong id="speed">000</strong>
    <span>KM/H</span>
  </div>

  <div class="turbo-panel">
    <div class="turbo-heading">
      <span>⚡ TURBO</span>
      <strong id="turbo-value">100%</strong>
    </div>

    <div class="turbo-track">
      <div id="turbo-fill"></div>
    </div>
  </div>
</div>
    </header>

    <div class="race-info">
      <span>VUELTA <b id="lap">1 / 3</b></span>
      <span id="status">LISTO PARA CORRER</span>
    </div>

    <div id="viewport"></div>

    <div class="garage">
      <span class="eyebrow">TU VEHÍCULO</span>
      <strong id="kart-name">VOLT X1</strong>
      <button id="change-kart">CAMBIAR KART ↗</button>
    </div>

    <div class="race-message" id="message">¡ACELERA Y TOMA LA DELANTERA!</div>

    <div class="mobile-controls">
    <div class="steering">
    <div id="steering-zone" aria-label="Control flotante de dirección">
      <div id="steering-base">
        <div id="steering-stick"></div>
      </div>
    </div>
  </div>
  <div class="driving">
  <button class="control brake" data-key="brake">
    FRENO
  </button>

  <button class="control reverse" data-key="reverse">
    ▼<br>MARCHA ATRÁS
  </button>

  <button class="control boost" id="boost">
    ⚡ TURBO
  </button>

  <button class="control accelerate" data-key="gas">
    ACELERAR<br>▲
  </button>
</div>
    </div>

    <footer>TOCA LOS CONTROLES PARA CONDUCIR</footer>
  </main>
`;
const orientationGate = document.querySelector('#orientation-gate');
const startGameButton = document.querySelector('#start-game');
const orientationHint = document.querySelector('#orientation-hint');

startGameButton.addEventListener('click', async () => {
  // Solicitar pantalla completa cuando el navegador lo permita.
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.info('Pantalla completa no disponible en este navegador.');
  }

  // Solicitar orientación horizontal.
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (error) {
    orientationHint.textContent =
      'Gira el teléfono horizontalmente para disfrutar mejor la carrera.';
  }

  orientationGate.classList.add('start-hidden');

  // Actualizar el tamaño del juego después de iniciar.
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 250);
});
const viewport = document.querySelector('#viewport');
const speedLabel = document.querySelector('#speed');
const turboFill = document.querySelector('#turbo-fill');
const turboValue = document.querySelector('#turbo-value');
const statusLabel = document.querySelector('#status');
const kartName = document.querySelector('#kart-name');
const message = document.querySelector('#message');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9dc8df);
scene.fog = new THREE.Fog(0x9dc8df, 65, 230);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 350);
camera.position.set(0, 6, 11);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

// Sombras dinámicas optimizadas para dispositivos móviles.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

viewport.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe5f4ff, 0x42513a, 2.1));

const sun = new THREE.DirectionalLight(0xfff0d5, 2.5);

sun.position.set(-20, 35, 15);

// Configuración de sombras.
sun.castShadow = true;

sun.shadow.mapSize.set(1024, 1024);

sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;

sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 100;

sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.025;

scene.add(sun);

function material(color, roughness = 0.65, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness
  });
}

// ============================================
// TEXTURA PROCEDURAL DE ASFALTO
// ============================================

function createAsphaltTexture() {
  const canvas = document.createElement('canvas');

  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');

  // Base oscura del pavimento.
  ctx.fillStyle = '#383b40';
  ctx.fillRect(0, 0, 512, 512);

  // Variación natural de pequeños granos.
  for (let i = 0; i < 22000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 1.8 + 0.3;
    const brightness = Math.floor(55 + Math.random() * 65);

    ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.32)`;

    ctx.fillRect(x, y, size, size);
  }

  // Pequeñas partículas claras y oscuras.
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;

    ctx.fillStyle = Math.random() > 0.5
      ? 'rgba(180, 180, 180, 0.22)'
      : 'rgba(10, 10, 10, 0.25)';

    ctx.fillRect(x, y, 1.2, 1.2);
  }

  // Crear textura de Three.js.
  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // Repetición del grano sobre la pista.
  texture.repeat.set(8, 8);

  return texture;
}

const asphaltTexture = createAsphaltTexture();

function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');

  // Base de césped verde.
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#527b43');
  gradient.addColorStop(0.5, '#668b4d');
  gradient.addColorStop(1, '#456d3c');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Variaciones naturales de color.
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 3 + 0.5;

    ctx.fillStyle = Math.random() > 0.5
      ? 'rgba(155, 180, 91, 0.18)'
      : 'rgba(25, 65, 30, 0.20)';

    ctx.fillRect(x, y, size, size);
  }

  // Pequeñas marcas que simulan hierba.
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;

    ctx.strokeStyle = Math.random() > 0.5
      ? 'rgba(185, 199, 115, 0.25)'
      : 'rgba(30, 75, 35, 0.25)';

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + (Math.random() - 0.5) * 3,
      y - Math.random() * 5
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(22, 22);

  return texture;
}

const grassTexture = createGrassTexture();

const grassMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: grassTexture,
  roughness: 1,
  metalness: 0
});
const asphaltMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: asphaltTexture,
  roughness: 0.94,
  metalness: 0
});
const whiteMat = material(0xf1f1e8);
const redMat = material(0xe33a42);
const tireMat = material(0x15191e, 0.95);
const metalMat = material(0x778b9d, 0.28, 0.8);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  grassMat
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
ground.receiveShadow = true;
scene.add(ground);

// Circuito ovalado
const track = new THREE.Group();
scene.add(track);

const outerRadiusX = 24;
const outerRadiusZ = 15;
const innerRadiusX = 13;
const innerRadiusZ = 6;

const trackShape = new THREE.Shape();
trackShape.absellipse(0, 0, outerRadiusX, outerRadiusZ, 0, Math.PI * 2, false, 0);

const hole = new THREE.Path();
hole.absellipse(0, 0, innerRadiusX, innerRadiusZ, 0, Math.PI * 2, true, 0);
trackShape.holes.push(hole);

const trackMesh = new THREE.Mesh(
  new THREE.ShapeGeometry(trackShape, 100),
  asphaltMat
);
trackMesh.rotation.x = -Math.PI / 2;
trackMesh.position.y = 0;
trackMesh.receiveShadow = true;
track.add(trackMesh);

function makeLine(rx, rz, color, thickness = 0.12) {
  const points = [];
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(a) * rx,
      0.035,
      Math.sin(a) * rz
    ));
  }
  const line = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      240,
      thickness,
      5,
      false
    ),
    material(color)
  );
  track.add(line);
}

makeLine(outerRadiusX, outerRadiusZ, 0xf0f1f2, 0.18);
makeLine(innerRadiusX, innerRadiusZ, 0xf0f1f2, 0.18);
makeLine(18.5, 10.5, 0xf6f6f2, 0.055);


// ============================================
// DETALLES PROFESIONALES DEL CIRCUITO
// Pianos, barreras y línea de salida/meta
// ============================================

const curbRedMat = material(0xe52d3a, 0.72);
const curbWhiteMat = material(0xf4f4ef, 0.72);
const barrierMat = material(0xd8e0e8, 0.48, 0.18);
const barrierDarkMat = material(0x303943, 0.72);
const startBlackMat = material(0x171b20, 0.8);

// Crear pianos rojos y blancos siguiendo una curva ovalada.
function createCurbs(rx, rz, count, offset = 0) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;

    const x = Math.cos(a) * rx;
    const z = Math.sin(a) * rz;

    const tangentX = -rx * Math.sin(a);
    const tangentZ = rz * Math.cos(a);
    const rotation = Math.atan2(-tangentZ, tangentX);

    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.13, 0.62),
      (i + offset) % 2 === 0 ? curbRedMat : curbWhiteMat
    );

    curb.position.set(x, 0.075, z);
    curb.rotation.y = rotation;
    track.add(curb);
  }
}

// Pianos en ambos bordes de la pista.
createCurbs(24.35, 15.35, 88);
createCurbs(12.65, 5.65, 64, 1);

// Barreras exteriores de seguridad.
function createTrackBarriers() {
  const count = 56;
  const radiusX = 27.2;
  const radiusZ = 18.2;

  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;

    const x = Math.cos(a) * radiusX;
    const z = Math.sin(a) * radiusZ;

    const tangentX = -radiusX * Math.sin(a);
    const tangentZ = radiusZ * Math.cos(a);
    const rotation = Math.atan2(-tangentZ, tangentX);

    // Panel principal de protección.
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 0.48, 0.2),
      i % 4 === 0 ? curbRedMat : barrierMat
    );

    rail.position.set(x, 0.68, z);
    rail.rotation.y = rotation;
    track.add(rail);

    // Soportes inferiores oscuros.
    if (i % 2 === 0) {
      const support = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.72, 0.3),
        barrierDarkMat
      );

      support.position.set(x, 0.42, z);
      support.rotation.y = rotation;
      track.add(support);
    }
  }
}

createTrackBarriers();

// Línea de salida y meta a cuadros.
function createStartFinishLine() {
  const squareSize = 0.65;
  const squaresAcross = 22;
  const rows = 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < squaresAcross; col++) {
      const square = new THREE.Mesh(
        new THREE.BoxGeometry(squareSize, 0.025, squareSize),
        (row + col) % 2 === 0 ? startBlackMat : curbWhiteMat
      );

      square.position.set(
        (col - (squaresAcross - 1) / 2) * squareSize,
        0.045,
        10.5 + (row - 0.5) * squareSize
      );

      track.add(square);
    }
  }
}

createStartFinishLine();

console.info('Circuito profesional: pianos, barreras y meta preparados.');

// Zona central
const island = new THREE.Mesh(
  new THREE.CircleGeometry(1, 48),
  grassMat
);
island.scale.set(12.8, 5.8, 1);
island.rotation.x = -Math.PI / 2;
island.position.y = -0.04;
scene.add(island);

// Árboles de bajo coste para el primer escenario
function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.2, 1.5, 7),
    material(0x61422e)
  );
  trunk.position.y = 0.75;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 2.3, 7),
    material(0x28543b)
  );
  crown.position.y = 2.1;
  tree.add(crown);

  scene.add(tree);
}

for (let i = 0; i < 44; i++) {
  const a = (i / 44) * Math.PI * 2;
  createTree(
    Math.cos(a) * 32,
    Math.sin(a) * 23,
    0.8 + (i % 3) * 0.16
  );
}


// ============================================
// ESTADIO: TRIBUNAS, ILUMINACIÓN Y PUBLICIDAD
// ============================================

const standBaseMat = material(0x343e4b, 0.78, 0.18);
const standSeatBlue = material(0x1769d2, 0.55);
const standSeatRed = material(0xd93645, 0.55);
const stadiumWhite = material(0xe8edf2, 0.5, 0.12);
const advertisingBlue = material(0x075bd8, 0.38, 0.2);
const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c2 });

function stadiumBox(parent, w, h, d, mat, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat
  );
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// Dos tribunas elevadas en los extremos del circuito.
function createGrandstand(zPosition, direction = 1) {
  const stand = new THREE.Group();
  stand.position.set(0, 0, zPosition);
  stand.rotation.y = direction === 1 ? 0 : Math.PI;

  // Estructura inferior.
  stadiumBox(
    stand, 25, 1.1, 4.2,
    standBaseMat, 0, 0.55, 0
  );

  // Gradas escalonadas.
  for (let row = 0; row < 5; row++) {
    const width = 23 - row * 1.1;
    const height = 0.48 + row * 0.55;
    const depth = 0.72;

    stadiumBox(
      stand,
      width,
      0.28,
      depth,
      row % 2 === 0 ? standSeatBlue : standSeatRed,
      0,
      height,
      1.2 + row * 0.58
    );

    // Pequeños asientos decorativos.
    for (let seat = 0; seat < 15; seat++) {
      const x = -width / 2 + 0.8 + seat * (width - 1.6) / 14;

      stadiumBox(
        stand,
        0.48,
        0.3,
        0.36,
        (seat + row) % 4 === 0 ? standSeatRed : standSeatBlue,
        x,
        height + 0.24,
        1.18 + row * 0.58
      );
    }
  }

  // Techo superior de la tribuna.
  stadiumBox(
    stand, 25, 0.32, 5.2,
    stadiumWhite, 0, 4.2, 3.0
  );

  // Panel publicitario frontal.
  stadiumBox(
    stand, 17, 1.05, 0.22,
    advertisingBlue, 0, 2.0, -2.15
  );

  scene.add(stand);
}

createGrandstand(-31, 1);
createGrandstand(31, -1);

// Torres de iluminación alrededor del circuito.
function createLightTower(x, z) {
  const tower = new THREE.Group();
  tower.position.set(x, 0, z);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.2, 9, 8),
    barrierDarkMat
  );
  pole.position.y = 4.5;
  tower.add(pole);

  const lampBar = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.42, 0.55),
    stadiumWhite
  );
  lampBar.position.y = 9.05;
  tower.add(lampBar);

  // Focos decorativos visibles.
  for (let i = 0; i < 4; i++) {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.2, 0.12),
      lightMat
    );
    lamp.position.set(-0.72 + i * 0.48, 9.0, -0.31);
    tower.add(lamp);
  }

  scene.add(tower);
}

[
  [-31, -19],
  [31, -19],
  [-31, 19],
  [31, 19]
].forEach(([x, z]) => createLightTower(x, z));

// Paneles publicitarios junto a la pista.
function createTrackSign(x, z, rotation, color) {
  const sign = new THREE.Group();
  sign.position.set(x, 0, z);
  sign.rotation.y = rotation;

  stadiumBox(
    sign, 4.2, 1.35, 0.18,
    material(color, 0.4, 0.15),
    0, 1.8, 0
  );

  stadiumBox(
    sign, 0.16, 1.8, 0.2,
    barrierDarkMat, -1.7, 0.9, 0
  );

  stadiumBox(
    sign, 0.16, 1.8, 0.2,
    barrierDarkMat, 1.7, 0.9, 0
  );

  scene.add(sign);
}

createTrackSign(-29, -8, Math.PI / 2, 0x0879ed);
createTrackSign(29, 8, -Math.PI / 2, 0xe52d3a);

console.info('Estadio 3D: tribunas, focos y publicidad preparados.');


// ============================================
// ENTORNO 3D: PAISAJE, EDIFICIOS Y VEGETACIÓN
// ============================================

const hillMat = material(0x526c59, 1);
const hillLightMat = material(0x71866b, 1);
const buildingGlassMat = material(0x263f55, 0.3, 0.35);
const buildingWallMat = material(0xc5d0d8, 0.65, 0.15);
const buildingDarkMat = material(0x354451, 0.65, 0.2);
const windowLightMat = new THREE.MeshBasicMaterial({
  color: 0x9edfff
});

// Montañas y colinas lejanas.
function createHill(x, z, sx, sy, sz, mat) {
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    mat
  );

  hill.position.set(x, sy * 0.55 - 0.2, z);
  hill.scale.set(sx, sy, sz);
  scene.add(hill);
}

createHill(-75, -55, 32, 13, 22, hillMat);
createHill(-30, -78, 28, 17, 24, hillLightMat);
createHill(20, -82, 35, 19, 25, hillMat);
createHill(75, -58, 32, 15, 23, hillLightMat);
createHill(-82, 35, 30, 17, 25, hillLightMat);
createHill(82, 38, 34, 18, 25, hillMat);

// Edificios modernos del complejo deportivo.
function createSportBuilding(x, z, width, height, depth) {
  const building = new THREE.Group();
  building.position.set(x, 0, z);

  const main = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    buildingWallMat
  );
  main.position.y = height / 2;
  building.add(main);

  // Fachada acristalada.
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.72, height * 0.65, 0.12),
    buildingGlassMat
  );
  glass.position.set(0, height * 0.55, -depth / 2 - 0.07);
  building.add(glass);

  // Filas de ventanas.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(0.35, width * 0.09),
          0.48,
          0.045
        ),
        windowLightMat
      );

      windowMesh.position.set(
        -width * 0.3 + col * width * 0.15,
        height * 0.3 + row * height * 0.19,
        -depth / 2 - 0.15
      );

      building.add(windowMesh);
    }
  }

  // Cubierta superior.
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 1, 0.5, depth + 1),
    buildingDarkMat
  );
  roof.position.y = height + 0.25;
  building.add(roof);

  scene.add(building);
}

createSportBuilding(-54, -42, 15, 9, 7);
createSportBuilding(53, -43, 17, 12, 8);
createSportBuilding(-55, 40, 18, 10, 8);
createSportBuilding(55, 42, 14, 8, 7);

// Pequeñas agrupaciones de vegetación decorativa.
function createDecorativeTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.15, 1.1, 6),
    material(0x705039)
  );
  trunk.position.y = 0.55;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 8, 7),
    hillMat
  );
  crown.position.y = 1.5;
  crown.scale.set(1, 1.15, 1);
  tree.add(crown);

  scene.add(tree);
}

for (let i = 0; i < 20; i++) {
  const angle = (i / 20) * Math.PI * 2;
  const radius = 43 + (i % 3) * 3;

  createDecorativeTree(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    0.8 + (i % 3) * 0.15
  );
}

// Nubes decorativas de bajo coste.
const cloudMat = new THREE.MeshBasicMaterial({
  color: 0xf4f7fa,
  transparent: true,
  opacity: 0.82
});

function createCloud(x, y, z, scale = 1) {
  const cloud = new THREE.Group();
  cloud.position.set(x, y, z);
  cloud.scale.setScalar(scale);

  const parts = [
    [-1, 0, 0, 1.1],
    [0, 0.35, 0, 1.35],
    [1, 0.05, 0, 0.95]
  ];

  parts.forEach(([px, py, pz, size]) => {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 6),
      cloudMat
    );
    puff.position.set(px, py, pz);
    cloud.add(puff);
  });

  scene.add(cloud);
}

createCloud(-45, 28, -65, 2.4);
createCloud(35, 32, -75, 2.8);
createCloud(75, 25, 5, 2.1);
createCloud(-72, 30, 20, 2.3);

console.info('Entorno 3D: paisaje y complejo deportivo preparados.');

// Karts originales con diferentes carrocerías
function createKart(color, accent, futuristic = false) {
  const kart = new THREE.Group();
  const bodyMat = material(color, 0.27, 0.55);
  const accentMat = material(accent, 0.25, 0.35);

  function box(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d), mat
    );
    mesh.position.set(x, y, z);
    kart.add(mesh);
    return mesh;
  }

  // Chasis y carrocería
  box(1.45, 0.28, 2.15, tireMat, 0, 0.42, 0);
  box(1.6, 0.32, futuristic ? 1.65 : 1.8, bodyMat, 0, 0.58, 0);

  // Nariz delantera
  const nose = box(0.95, 0.24, 0.68, bodyMat, 0, 0.59, -1.13);
  nose.rotation.x = -0.12;

  // Cabina y asiento
  box(0.7, 0.42, 0.58, tireMat, 0, 0.78, 0.22);
  box(0.9, 0.12, 0.35, accentMat, 0, 1.0, 0.32);

  // Luces frontales
  for (const x of [-0.55, 0.55]) {
    box(0.3, 0.1, 0.07, material(0xbdeeff, 0.2, 0.2),
      x, 0.65, -1.47);
  }

  // Ruedas
  for (const x of [-0.88, 0.88]) {
    for (const z of [-0.72, 0.72]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16),
        tireMat
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.34, z);
      kart.add(wheel);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.235, 12),
        metalMat
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      kart.add(hub);
    }
  }

  // Alerón deportivo
  box(1.45, 0.12, 0.24, accentMat, 0, 0.91, 1.0);

  if (futuristic) {
    box(1.75, 0.055, 0.13,
      material(0x26e9ff, 0.25, 0.25), 0, 0.62, 0.94);
  }

  // El frente del vehículo apunta hacia -Z

// Activar sombras en todas las piezas del vehículo.
kart.traverse((obj) => {
  if (!obj.isMesh) return;

  obj.castShadow = true;
  obj.receiveShadow = true;
});

scene.add(kart);
return kart;
}

const player = createKart(0x1769ff, 0x35e6ff, true);
const rival = createKart(0xff4a32, 0xffd34d, false);

player.position.set(0, 0, 10.5);
rival.position.set(-4, 0, 10.5);

// ============================================
// EFECTO VISUAL DE HUMO PARA LOS DERRAPES
// Sistema de partículas reutilizables optimizado
// ============================================

const smokeCanvas = document.createElement('canvas');
smokeCanvas.width = 64;
smokeCanvas.height = 64;

const smokeContext = smokeCanvas.getContext('2d');
const smokeGradient = smokeContext.createRadialGradient(
  32, 32, 2,
  32, 32, 30
);

smokeGradient.addColorStop(0, 'rgba(235,245,255,0.65)');
smokeGradient.addColorStop(0.35, 'rgba(210,225,240,0.35)');
smokeGradient.addColorStop(1, 'rgba(190,205,220,0)');

smokeContext.fillStyle = smokeGradient;
smokeContext.fillRect(0, 0, 64, 64);

const smokeTexture = new THREE.CanvasTexture(smokeCanvas);

const smokeMaterial = new THREE.SpriteMaterial({
  map: smokeTexture,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  color: 0xffffff
});

const smokeParticles = [];
const smokeParticleCount = 18;

for (let i = 0; i < smokeParticleCount; i++) {
  const particle = new THREE.Sprite(smokeMaterial.clone());

  particle.scale.set(0.7, 0.7, 1);
  particle.visible = false;

  particle.userData.life = 0;
  particle.userData.velocity = new THREE.Vector3();

  scene.add(particle);
  smokeParticles.push(particle);
}

let smokeTimer = 0;
let smokeIndex = 0;

function createDriftSmoke() {
  const rearLeft = player.localToWorld(
    new THREE.Vector3(-0.72, 0.22, 0.72)
  );

  const rearRight = player.localToWorld(
    new THREE.Vector3(0.72, 0.22, 0.72)
  );

  const positions = [rearLeft, rearRight];

  for (const position of positions) {
    const particle = smokeParticles[smokeIndex];

    smokeIndex = (smokeIndex + 1) % smokeParticleCount;

    particle.position.copy(position);
    particle.position.y += 0.05;

    particle.userData.life = 0.75;

    particle.userData.velocity.set(
      (Math.random() - 0.5) * 0.8,
      0.65 + Math.random() * 0.45,
      (Math.random() - 0.5) * 0.8
    );

    particle.material.opacity = 0.42;
    particle.scale.set(0.65, 0.65, 1);
    particle.visible = true;
  }
}

function updateDriftSmoke(dt) {
  if (drift && speed > 8) {
    smokeTimer += dt;

    if (smokeTimer >= 0.065) {
      smokeTimer = 0;
      createDriftSmoke();
    }
  } else {
    smokeTimer = 0;
  }

  for (const particle of smokeParticles) {
    if (!particle.visible) continue;

    particle.userData.life -= dt;

    if (particle.userData.life <= 0) {
      particle.visible = false;
      particle.material.opacity = 0;
      continue;
    }

    particle.position.addScaledVector(
      particle.userData.velocity,
      dt
    );

    particle.userData.velocity.multiplyScalar(0.985);

    const remaining = particle.userData.life / 0.75;

    particle.material.opacity = remaining * 0.42;

    const size = 0.65 + (1 - remaining) * 0.9;

    particle.scale.set(size, size, 1);
  }
}

// Cargar el modelo 3D externo del jugador.
// Si el archivo no carga, el kart provisional permanece visible.
const playerModelLoader = new GLTFLoader();

playerModelLoader.load(
  '/models/raceCarWhite.glb',

  (gltf) => {
    const model = gltf.scene;

    // Activar sombras en todas las piezas del modelo 3D.
    model.traverse((obj) => {
      if (!obj.isMesh) return;

      obj.castShadow = true;
      obj.receiveShadow = true;
    });

    model.updateMatrixWorld(true);

    // Calcular dimensiones y centro del modelo.
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    // Ajustar el tamaño al espacio del vehículo.
    const largestSide = Math.max(size.x, size.z);

    const scale = largestSide > 0
      ? Math.min(
          2.7 / largestSide,
          1.25 / Math.max(size.y, 0.01)
        )
      : 1;

      model.scale.setScalar(scale);

      // Corregir la orientación: girar el auto 180 grados.
      model.rotation.y = Math.PI;
      
      // Centrar el modelo y apoyarlo sobre el suelo.
      model.position.set(
        -center.x * scale,
        -bounds.min.y * scale + 0.04,
        -center.z * scale
      );

    // Incorporarlo al vehículo del jugador.
    player.add(model);

    // Ocultar el kart provisional únicamente
    // después de confirmar que el modelo se cargó.
    player.children.forEach((child) => {
      if (child !== model) {
        child.visible = false;
      }
    });

    player.userData.externalModel = model;

    message.textContent = 'MODELO 3D DEL JUGADOR CARGADO';

    console.info(
      'Turbo Kart 3D: modelo GLB cargado correctamente.'
    );
  },

  undefined,

  (error) => {
    console.error(
      'No se pudo cargar el modelo GLB. Se conserva el kart provisional.',
      error
    );

    message.textContent = 'KART ORIGINAL LISTO';
  }
);


let kartIndex = 0;
const kartOptions = [
  { name: 'VOLT X1', color: 0x1769ff, accent: 0x35e6ff, future: true },
  { name: 'STORM GT', color: 0xdb2444, accent: 0xffd34d, future: false },
  { name: 'NOVA E-R', color: 0x9a52e8, accent: 0x47ffb0, future: true },
  { name: 'PHANTOM RS', color: 0x242b38, accent: 0xff7744, future: false }
];

// Estado de controles táctiles
const keys = {
  left: false,
  right: false,
  gas: false,
  brake: false,
  reverse: false
};

let speed = 0;
let reverseSpeed = 0;

// Velocidad física del kart en el mundo 3D.
// Permite conservar el desplazamiento lateral durante los derrapes.
const velocity = new THREE.Vector3(0, 0, 0);

let steering = 0;
let touchSteering = 0;
let touchSteeringActive = false;
let turbo = 100;
let boostActive = false;
let drift = false;
let elapsed = 0;
let rivalAngle = Math.PI / 2;
const clock = new THREE.Clock();
// ============================================
// MARCAS DE NEUMÁTICOS DURANTE LOS DERRAPES
// Sistema reutilizable para móviles
// ============================================

const tireMarkGeometry = new THREE.BoxGeometry(
  0.16,
  0.012,
  0.72
);

const tireMarkMaterial = new THREE.MeshBasicMaterial({
  color: 0x17191d,
  transparent: true,
  opacity: 0.42,
  depthWrite: false
});

const tireMarks = [];
const tireMarkCount = 64;

for (let i = 0; i < tireMarkCount; i++) {
  const mark = new THREE.Mesh(
    tireMarkGeometry,
    tireMarkMaterial
  );

  mark.visible = false;
  mark.castShadow = false;
  mark.receiveShadow = false;
  mark.renderOrder = 1;

  scene.add(mark);
  tireMarks.push(mark);
}

let tireMarkTimer = 0;
let tireMarkIndex = 0;

function createTireMarks() {
  const rearWheels = [
    new THREE.Vector3(-0.72, 0.035, 0.75),
    new THREE.Vector3(0.72, 0.035, 0.75)
  ];

  for (const wheelPosition of rearWheels) {
    const mark = tireMarks[tireMarkIndex];

    tireMarkIndex =
      (tireMarkIndex + 1) % tireMarkCount;

    mark.position.copy(
      player.localToWorld(wheelPosition.clone())
    );

    mark.position.y = 0.035;
    mark.rotation.y = player.rotation.y;
    mark.visible = true;
  }
}

function updateTireMarks(dt) {
  if (drift && speed > 9) {
    tireMarkTimer += dt;

    if (tireMarkTimer >= 0.11) {
      tireMarkTimer = 0;
      createTireMarks();
    }
  } else {
    tireMarkTimer = 0;
  }
}

function applyKartStyle(kart, color, accent) {
  // Cambia los materiales de carrocería y detalles.
  kart.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const c = obj.material.color;
    if (c.getHex() === player.userData.bodyColor) c.setHex(color);
    if (c.getHex() === player.userData.accentColor) c.setHex(accent);
  });
  player.userData.bodyColor = color;
  player.userData.accentColor = accent;
}

player.userData.bodyColor = 0x1769ff;
player.userData.accentColor = 0x35e6ff;

document.querySelector('#change-kart').addEventListener('click', () => {
  kartIndex = (kartIndex + 1) % kartOptions.length;
  const option = kartOptions[kartIndex];
  applyKartStyle(player, option.color, option.accent);
  kartName.textContent = option.name;
  message.textContent = 'KART SELECCIONADO: ' + option.name;
});

document.querySelectorAll('[data-key]').forEach((button) => {
  const key = button.dataset.key;

  const start = (event) => {
    event.preventDefault();
    keys[key] = true;
    button.classList.add('pressed');
  };

  const end = (event) => {
    event.preventDefault();
    keys[key] = false;
    button.classList.remove('pressed');
  };

  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', end);
  button.addEventListener('pointercancel', end);
  button.addEventListener('pointerleave', end);
  button.addEventListener('contextmenu', (e) => e.preventDefault());
});
// ============================================
// JOYSTICK FLOTANTE DE DIRECCIÓN 360°
// ============================================

const steeringZone = document.querySelector('#steering-zone');
const steeringBase = document.querySelector('#steering-base');
const steeringStick = document.querySelector('#steering-stick');

let joystickCenterX = 0;
let joystickCenterY = 0;
const joystickRadius = 55;

function moveJoystick(event) {
  const rect = steeringZone.getBoundingClientRect();

  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;

  let dx = pointerX - joystickCenterX;
  let dy = pointerY - joystickCenterY;

  const distance = Math.hypot(dx, dy);

  if (distance > joystickRadius) {
    const factor = joystickRadius / distance;
    dx *= factor;
    dy *= factor;
  }

  steeringStick.style.left = `${joystickCenterX + dx}px`;
  steeringStick.style.top = `${joystickCenterY + dy}px`;

  // El desplazamiento horizontal determina el giro.
  touchSteering = THREE.MathUtils.clamp(
    -dx / joystickRadius,
    -1,
    1
  );
}

function resetJoystick() {
  touchSteering = 0;
  touchSteeringActive = false;

  steeringZone.classList.remove('active');
  steeringBase.style.left = '50%';
  steeringBase.style.top = '50%';
  steeringStick.style.left = '50%';
  steeringStick.style.top = '50%';
}

steeringZone.addEventListener('pointerdown', (event) => {
  event.preventDefault();

  touchSteeringActive = true;
  steeringZone.classList.add('active');

  const rect = steeringZone.getBoundingClientRect();

  joystickCenterX = event.clientX - rect.left;
  joystickCenterY = event.clientY - rect.top;

  steeringBase.style.left = `${joystickCenterX}px`;
  steeringBase.style.top = `${joystickCenterY}px`;

  steeringStick.style.left = `${joystickCenterX}px`;
  steeringStick.style.top = `${joystickCenterY}px`;

  try {
    steeringZone.setPointerCapture(event.pointerId);
  } catch (error) {
    console.info('Captura táctil no disponible.');
  }
});

steeringZone.addEventListener('pointermove', (event) => {
  if (!touchSteeringActive) return;

  event.preventDefault();
  moveJoystick(event);
});

steeringZone.addEventListener('pointerup', resetJoystick);
steeringZone.addEventListener('pointercancel', resetJoystick);
const boostButton = document.querySelector('#boost');

function setBoost(value) {
  boostActive = value;
  boostButton.classList.toggle('pressed', value);
}

boostButton.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  setBoost(true);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((event) => {
  boostButton.addEventListener(event, () => setBoost(false));
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowleft', 'a'].includes(k)) keys.left = true;
  if (['arrowright', 'd'].includes(k)) keys.right = true;
  if (['arrowup', 'w'].includes(k)) keys.gas = true;
  if (['arrowdown', 's'].includes(k)) keys.brake = true;
  if (k === 'shift') setBoost(true);
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowleft', 'a'].includes(k)) keys.left = false;
  if (['arrowright', 'd'].includes(k)) keys.right = false;
  if (['arrowup', 'w'].includes(k)) keys.gas = false;
  if (['arrowdown', 's'].includes(k)) keys.brake = false;
  if (k === 'shift') setBoost(false);
});

function resize() {
  const w = viewport.clientWidth || window.innerWidth;
  const h = viewport.clientHeight || window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  
  // ============================================
  // FÍSICA DE CONDUCCIÓN: ACELERACIÓN Y FRENADO
  // ============================================

  
  // ============================================
  // ACELERACIÓN, VELOCIDAD MÁXIMA Y FRENADO
  // Respuesta progresiva y controlada
  // ============================================

    // ============================================
  // ACELERACIÓN, FRENADO Y MARCHA ATRÁS
  // ============================================

  const normalMaxSpeed = 30;
  const turboMaxSpeed = 36;
  const reverseMaxSpeed = 6;

  // La marcha atrás primero detiene el avance.
  if (keys.reverse && !keys.gas) {
    speed = Math.max(
      0,
      speed - (speed > 0 ? (7.0 + speed * 0.08) * dt : 0)
    );

    if (speed <= 0.01) {
      speed = 0;
      reverseSpeed = Math.min(
        reverseMaxSpeed,
        reverseSpeed + 2.2 * dt
      );
    } else {
      reverseSpeed = 0;
    }
  } else {
    // Al cambiar a avance, primero se detiene
    // el movimiento marcha atrás.
    if (reverseSpeed > 0) {
      const reverseBraking = keys.brake || keys.gas
        ? 7.0
        : 3.5;

      reverseSpeed = Math.max(
        0,
        reverseSpeed - reverseBraking * dt
      );
    }

    if (reverseSpeed <= 0.01) {
      reverseSpeed = 0;
    }

    // Aceleración normal, solo después de detenerse
    // el movimiento marcha atrás.
    if (
      keys.gas &&
      !keys.brake &&
      reverseSpeed === 0
    ) {
      const currentMaxSpeed =
        boostActive && turbo > 0
          ? turboMaxSpeed
          : normalMaxSpeed;

      const speedRatio = THREE.MathUtils.clamp(
        speed / currentMaxSpeed,
        0,
        1
      );

      const acceleration =
        2.8 * (1 - speedRatio * 0.55);

      speed += acceleration * dt;
    } else {
      // Resistencia natural al soltar el acelerador.
      const rollingResistance = 0.55 + speed * 0.035;

      speed = Math.max(
        0,
        speed - rollingResistance * dt
      );
    }

    // Frenado normal.
    if (keys.brake) {
      const brakingForce = 7.0 + speed * 0.08;

      speed = Math.max(
        0,
        speed - brakingForce * dt
      );
    }
  }

  // El turbo solo funciona avanzando.
  if (
    boostActive &&
    keys.gas &&
    !keys.brake &&
    !keys.reverse &&
    reverseSpeed === 0 &&
    turbo > 0 &&
    speed > 2
  ) {
    speed += 2.0 * dt;
    turbo = Math.max(0, turbo - 18 * dt);
  } else {
    turbo = Math.min(100, turbo + 6 * dt);
  }

  // Límites de velocidad.
  const finalMaxSpeed =
    boostActive &&
    keys.gas &&
    !keys.brake &&
    !keys.reverse &&
    turbo > 0
      ? turboMaxSpeed
      : normalMaxSpeed;

  speed = THREE.MathUtils.clamp(
    speed,
    0,
    finalMaxSpeed
  );

  reverseSpeed = THREE.MathUtils.clamp(
    reverseSpeed,
    0,
    reverseMaxSpeed
  );


  // ============================================
  // DIRECCIÓN INTELIGENTE SEGÚN LA VELOCIDAD
  // ============================================

  const keyboardSteer =
    (keys.left ? 1 : 0) - (keys.right ? 1 : 0);

  const targetSteer = touchSteeringActive
    ? touchSteering
    : keyboardSteer;

  steering = THREE.MathUtils.lerp(
    steering,
    targetSteer,
    Math.min(1, dt * 6.5)
  );

    // ============================================
  // DERRAPE REAL Y CONTROL DE AGARRE
  // ============================================

  // Capacidad de giro según la velocidad.
  const controlSpeed = Math.max(speed, reverseSpeed);

const steeringAuthority = THREE.MathUtils.lerp(
  1.8,
  0.82,
  controlSpeed / 38
);

const movementFactor = Math.min(
  1,
  controlSpeed / 3
);

  // El kart cambia su orientación al girar.
  player.rotation.y +=
    steering * steeringAuthority * movementFactor * dt;

  // Intensidad del derrape:
  // aumenta con giros fuertes y velocidades elevadas.
  const steeringIntensity = THREE.MathUtils.clamp(
    (Math.abs(steering) - 0.35) / 0.65,
    0,
    1
  );

  const speedIntensity = THREE.MathUtils.clamp(
    (speed - 7) / 14,
    0,
    1
  );

  const driftIntensity = steeringIntensity * speedIntensity;

  drift = driftIntensity > 0.25;

  // Dirección hacia delante del vehículo.
  const forward = new THREE.Vector3(
    -Math.sin(player.rotation.y),
    0,
    -Math.cos(player.rotation.y)
  );

  // Dirección lateral del vehículo.
  const sideways = new THREE.Vector3(
    Math.cos(player.rotation.y),
    0,
    -Math.sin(player.rotation.y)
  );

  // Velocidad deseada:
  // combina avance y deslizamiento lateral.
  const signedSpeed = speed - reverseSpeed;

const desiredVelocity = forward
  .clone()
  .multiplyScalar(signedSpeed);

desiredVelocity.addScaledVector(
  sideways,
  steering * signedSpeed * driftIntensity * 0.42
);

  // Durante el derrape hay menos agarre.
  // Al dejar de girar, el kart recupera estabilidad.
  const grip = THREE.MathUtils.lerp(
    6.5,
    2.2,
    driftIntensity
  );

  velocity.lerp(
    desiredVelocity,
    Math.min(1, grip * dt)
  );

  // Movimiento físico independiente de la orientación.
  player.position.addScaledVector(velocity, dt);

  // ============================================
  // LÍMITES DE SEGURIDAD DE LA PISTA
  // ============================================

  const limit = 21;

  if (player.position.x < -limit || player.position.x > limit) {
    player.position.x = THREE.MathUtils.clamp(
      player.position.x,
      -limit,
      limit
    );
    velocity.x = 0;
  }

  if (
    player.position.z < -12.5 ||
    player.position.z > 12.5
  ) {
    player.position.z = THREE.MathUtils.clamp(
      player.position.z,
      -12.5,
      12.5
    );
    velocity.z = 0;
  }

  // Rival automático recorriendo el óvalo
  rivalAngle += dt * (0.48 + speed * 0.005);
  rival.position.set(
    Math.cos(rivalAngle) * 18.5,
    0,
    Math.sin(rivalAngle) * 10.5
  );
  rival.rotation.y = -rivalAngle - Math.PI / 2;
// Actualizar humo de las ruedas durante los derrapes.
updateDriftSmoke(dt);
// Dibujar rastros de los neumáticos al derrapar.
updateTireMarks(dt);
  // Cámara suave detrás del kart
  const behind = new THREE.Vector3(0, 4.5, 8.5);
  behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  const cameraTarget = player.position.clone().add(behind);
  camera.position.lerp(cameraTarget, Math.min(1, dt * 3.5));

  const lookTarget = player.position.clone();
  lookTarget.y += 1.0;
  camera.lookAt(lookTarget);

  const displayedSpeed = Math.max(speed, reverseSpeed);

speedLabel.textContent = String(
  Math.round(displayedSpeed * 5)
).padStart(3, '0');
  // Actualización visual del nivel de turbo.
turboFill.style.width = `${turbo}%`;
turboValue.textContent = `${Math.round(turbo)}%`;

turboFill.classList.toggle(
  'turbo-active',
  boostActive && turbo > 0
);
  statusLabel.textContent = drift ? 'DERRAPE ACTIVO' : boostActive && turbo > 0 ? 'TURBO ACTIVADO' : 'EN CARRERA';
  statusLabel.classList.toggle('drift-active', drift);

  const messageText = document.querySelector('#message');
  messageText.textContent = boostActive && turbo > 0
    ? '⚡ TURBO ACTIVADO'
    : drift
      ? 'DERRAPE'
      : '¡ACELERA Y TOMA LA DELANTERA!';

  renderer.render(scene, camera);
}

animate();
