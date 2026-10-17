import * as THREE from 'three';

/**
 * MITTI RUN — A Desi Endless Adventure
 * 3D Mobile Endless Runner Engine
 * Inspired by Bihar rural villages, railway crossings, and highways.
 * Developed for Tabish Firoz.
 */

// ---------------- GAME CONSTANTS ----------------
const LANES = [-2.5, 0.0, 2.5]; // Left, Center, Right
const LANE_CHANGE_SPEED = 18.0;
const BASE_SPEED = 16.0;
const MAX_SPEED = 32.0;
const SPEED_INCREMENT = 0.035; // per second
const JUMP_VELOCITY = 11.0;
const GRAVITY = 28.0;
const SLIDE_DURATION = 0.75;
const CHUNK_LENGTH = 35.0;
const TOTAL_CHUNKS = 7;

// ---------------- SOUND SYSTEM (WEB AUDIO API) ----------------
class DesiAudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCoin() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playJump() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playSlide() {
    if (!this.enabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playCrash() {
    if (!this.enabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playPowerup() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.06;
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  playClick() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}

// ---------------- CHARACTER DEFINITIONS ----------------
const CHARACTERS = {
  Tabish Firoz: {
    name: 'Tabish Firoz',
    tagline: 'The Village Sprinter',
    cost: 0,
    unlocked: true,
    kurtaColor: 0xe65100, // Terracotta Saffron
    dhotiColor: 0xf5f5f0, // White Dhoti
    gamchhaColor: 0xb71c1c  // Red checked Gamchha
  },
  lallan: {
    name: 'Lallan',
    tagline: 'The Auto Rickshaw Rider',
    cost: 150,
    unlocked: false,
    kurtaColor: 0x2e7d32, // Auto Rickshaw Green
    dhotiColor: 0xffd54f, // Yellow Dhoti
    gamchhaColor: 0xff9800  // Orange Gamchha
  },
  champa: {
    name: 'Champa',
    tagline: 'The Fast Runner',
    cost: 300,
    unlocked: false,
    kurtaColor: 0xad1457, // Vibrant Desi Magenta
    dhotiColor: 0x1976d2, // Blue Dhoti
    gamchhaColor: 0xffeb3b  // Golden Yellow Scarf
  }
};

// ---------------- MAIN GAME CLASS ----------------
class MittiRunGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.audio = new DesiAudioManager();

    // Game state
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
    this.score = 0;
    this.distance = 0;
    this.coinsThisRun = 0;
    this.currentSpeed = BASE_SPEED;
    this.currentLane = 1; // 0: Left, 1: Center, 2: Right
    this.targetX = LANES[1];

    // Jump & Slide
    this.playerY = 0;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;

    // Power-ups
    this.magnetTimer = 0;
    this.boostTimer = 0;
    this.shieldActive = false;

    // Persistent storage
    this.loadSaveData();

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Scene groups
    this.playerGroup = null;
    this.playerMesh = null;
    this.playerMaterials = {};
    this.shieldMesh = null;
    this.dustParticles = [];

    // Track chunks and entities
    this.chunks = [];
    this.chunkPool = [];
    this.nextChunkZ = 0;
    this.chunkSpawnCounter = 0;
    this.activeObstacles = [];
    this.activeCoins = [];
    this.activePowerups = [];

    // Touch controls
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;

    // Setup engine
    this.initThree();
    this.initPlayer();
    this.initDust();
    this.initInitialTrack();
    this.bindEvents();
    this.updateMenuUI();

    // Run animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // ---------------- PERSISTENCE ----------------
  loadSaveData() {
    try {
      const data = JSON.parse(localStorage.getItem('mitti_run_save') || '{}');
      this.highScore = data.highScore || 0;
      this.totalCoins = data.totalCoins || 0;
      this.selectedCharacter = data.selectedCharacter || 'Tabish Firoz';
      const unlocked = data.unlockedCharacters || ['Tabish Firoz'];
      unlocked.forEach(id => {
        if (CHARACTERS[id]) CHARACTERS[id].unlocked = true;
      });
      if (typeof data.soundEnabled === 'boolean') {
        this.audio.enabled = data.soundEnabled;
      }
    } catch (e) {
      this.highScore = 0;
      this.totalCoins = 0;
      this.selectedCharacter = 'Tabish Firoz';
    }
  }

  saveData() {
    try {
      const unlocked = Object.keys(CHARACTERS).filter(id => CHARACTERS[id].unlocked);
      const data = {
        highScore: this.highScore,
        totalCoins: this.totalCoins,
        selectedCharacter: this.selectedCharacter,
        unlockedCharacters: unlocked,
        soundEnabled: this.audio.enabled
      };
      localStorage.setItem('mitti_run_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  // ---------------- THREE.JS INITIALIZATION ----------------
  initThree() {
    // Scene
    this.scene = new THREE.Scene();

    // Sunset Sky gradient and fog matching reference image!
    this.scene.background = new THREE.Color(0xff8a43); // Warm sunset orange
    this.scene.fog = new THREE.FogExp2(0xff9e60, 0.009);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 200);
    this.camera.position.set(0, 3.6, 6.2);
    this.camera.lookAt(0, 1.2, -8);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // Lighting (Golden Hour Sunset)
    const ambientLight = new THREE.AmbientLight(0xffdfba, 0.85);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffe09e, 1.4);
    sunLight.position.set(10, 20, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -10;
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Glowing Sun Sphere in the distance horizon (matching photo)
    const sunGeo = new THREE.SphereGeometry(6, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });
    const sunDisk = new THREE.Mesh(sunGeo, sunMat);
    sunDisk.position.set(0, 8, -90);
    this.scene.add(sunDisk);
    this.sunDisk = sunDisk;
  }

  // ---------------- PLAYER CHARACTER (Tabish Firoz) ----------------
  initPlayer() {
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0, 0);

    const charInfo = CHARACTERS[this.selectedCharacter];

    // Materials
    this.playerMaterials.skin = new THREE.MeshLambertMaterial({ color: 0xc98a58 });
    this.playerMaterials.kurta = new THREE.MeshLambertMaterial({ color: charInfo.kurtaColor });
    this.playerMaterials.dhoti = new THREE.MeshLambertMaterial({ color: charInfo.dhotiColor });
    this.playerMaterials.gamchha = new THREE.MeshLambertMaterial({ color: charInfo.gamchhaColor });

    // Hierarchy
    this.playerMesh = new THREE.Group();

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const head = new THREE.Mesh(headGeo, this.playerMaterials.skin);
    head.position.y = 1.55;
    head.castShadow = true;
    this.playerMesh.add(head);

    // Desi Pagdi / Hair band
    const bandGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
    const bandMat = new THREE.MeshLambertMaterial({ color: 0xb71c1c });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = 1.62;
    this.playerMesh.add(band);

    // Torso (Kurta)
    const bodyGeo = new THREE.BoxGeometry(0.65, 0.75, 0.38);
    const body = new THREE.Mesh(bodyGeo, this.playerMaterials.kurta);
    body.position.y = 0.98;
    body.castShadow = true;
    this.playerMesh.add(body);

    // Desi Gamchha Scarf (slanted across shoulder)
    const scarfGeo = new THREE.BoxGeometry(0.18, 0.78, 0.42);
    const scarf = new THREE.Mesh(scarfGeo, this.playerMaterials.gamchha);
    scarf.position.set(-0.2, 0.98, 0.02);
    scarf.rotation.z = -0.15;
    this.playerMesh.add(scarf);
    this.gamchhaMesh = scarf;

    // Legs / Dhoti
    const dhotiGeo = new THREE.BoxGeometry(0.55, 0.65, 0.34);
    const dhoti = new THREE.Mesh(dhotiGeo, this.playerMaterials.dhoti);
    dhoti.position.y = 0.38;
    dhoti.castShadow = true;
    this.playerMesh.add(dhoti);

    // Limbs for running animation
    const limbGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
    const legL = new THREE.Mesh(limbGeo, this.playerMaterials.skin);
    legL.position.set(-0.16, 0.15, 0);
    const legR = new THREE.Mesh(limbGeo, this.playerMaterials.skin);
    legR.position.set(0.16, 0.15, 0);
    this.playerMesh.add(legL);
    this.playerMesh.add(legR);
    this.legL = legL;
    this.legR = legR;

    this.playerGroup.add(this.playerMesh);

    // Suraksha Shield Bubble (invisible by default)
    const shieldGeo = new THREE.SphereGeometry(1.25, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 0.95;
    this.shieldMesh.visible = false;
    this.playerGroup.add(this.shieldMesh);

    this.scene.add(this.playerGroup);
  }

  updatePlayerSkin() {
    const charInfo = CHARACTERS[this.selectedCharacter];
    if (this.playerMaterials.kurta) this.playerMaterials.kurta.color.setHex(charInfo.kurtaColor);
    if (this.playerMaterials.dhoti) this.playerMaterials.dhoti.color.setHex(charInfo.dhotiColor);
    if (this.playerMaterials.gamchha) this.playerMaterials.gamchha.color.setHex(charInfo.gamchhaColor);
  }

  // ---------------- MITTI DUST PARTICLES ----------------
  initDust() {
    const dustGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const dustMat = new THREE.MeshBasicMaterial({ color: 0x9e7855, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(dustGeo, dustMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.dustParticles.push({
        mesh: p,
        life: 0,
        maxLife: 0.4,
        vx: 0,
        vy: 0,
        vz: 0
      });
    }
  }

  spawnDustPuff(x, y, z) {
    const p = this.dustParticles.find(item => item.life <= 0);
    if (p) {
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + 0.1, z + 0.2);
      p.mesh.scale.set(1, 1, 1);
      p.mesh.visible = true;
      p.life = p.maxLife;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = Math.random() * 1.2 + 0.5;
      p.vz = Math.random() * 2.0 + 2.0;
    }
  }

  updateDust(delta) {
    this.dustParticles.forEach(p => {
      if (p.life > 0) {
        p.life -= delta;
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        const progress = 1 - (p.life / p.maxLife);
        const s = 1 + progress * 2.5;
        p.mesh.scale.set(s, s, s);
        p.mesh.material.opacity = Math.max(0, 0.6 * (1 - progress));
        if (p.life <= 0) p.mesh.visible = false;
      }
    });
  }

  // ---------------- TRACK & ENVIRONMENT ----------------
  initInitialTrack() {
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      const isSafe = i < 2;
      this.spawnChunk(isSafe);
    }
  }

  spawnChunk(isSafe = false) {
    this.chunkSpawnCounter++;
    const isRailway = !isSafe && (this.chunkSpawnCounter % 6 === 0);

    const chunk = new THREE.Group();
    chunk.position.set(0, 0, this.nextChunkZ);

    // 1. Lush Green Fields (Ground)
    const groundGeo = new THREE.BoxGeometry(26, 0.3, CHUNK_LENGTH);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d6628 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    chunk.add(ground);

    // 2. Mitti Mud Road (3 Lanes)
    const roadGeo = new THREE.BoxGeometry(8.2, 0.32, CHUNK_LENGTH);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x7a5b43 }); // Dusty Bihar clay road
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.y = -0.12;
    road.receiveShadow = true;
    chunk.add(road);

    // Dashed Lane Dividers (White/Ochre road dashes)
    const dashGeo = new THREE.BoxGeometry(0.12, 0.33, 2.0);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xefd8a1, transparent: true, opacity: 0.45 });
    for (let dz = -CHUNK_LENGTH / 2 + 1.5; dz < CHUNK_LENGTH / 2; dz += 4.5) {
      const dashL = new THREE.Mesh(dashGeo, dashMat);
      dashL.position.set(-1.25, -0.11, dz);
      const dashR = new THREE.Mesh(dashGeo, dashMat);
      dashR.position.set(1.25, -0.11, dz);
      chunk.add(dashL);
      chunk.add(dashR);
    }

    // Road shoulders (dirt banks)
    const shoulderGeo = new THREE.BoxGeometry(1.2, 0.33, CHUNK_LENGTH);
    const shoulderMat = new THREE.MeshLambertMaterial({ color: 0x937053 });
    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderL.position.set(-4.7, -0.12, 0);
    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderR.position.set(4.7, -0.12, 0);
    chunk.add(shoulderL);
    chunk.add(shoulderR);

    // Roadside Trees (Lush green canopies)
    this.createRoadsideTrees(chunk);

    // Traditional Bihar Village Hut (thatched roof cottage)
    if (Math.random() < 0.4) {
      this.createVillageHut(chunk);
    }

    // Roadside Milestone Marker
    if (Math.random() < 0.35) {
      this.createMilestone(chunk);
    }

    // Special Railway Crossing Chunk (inspired by the reference photo!)
    if (isRailway) {
      this.createRailwayCrossing(chunk);
    }

    // Add obstacles and coins if not safe start chunk
    if (!isSafe) {
      this.populateChunkEntities(chunk);
    }

    this.scene.add(chunk);
    this.chunks.push(chunk);

    this.nextChunkZ -= CHUNK_LENGTH;
  }

  createRoadsideTrees(chunk) {
    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3.5, 8);
    const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
    const foliageGeo = new THREE.SphereGeometry(2.3, 10, 10);
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2e5c1e });

    [-6.5, 6.5].forEach(sideX => {
      for (let zOffset = -CHUNK_LENGTH / 3; zOffset <= CHUNK_LENGTH / 3; zOffset += CHUNK_LENGTH / 1.8) {
        if (Math.random() < 0.75) {
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
          trunk.position.y = 1.75;
          trunk.castShadow = true;
          const foliage = new THREE.Mesh(foliageGeo, foliageMat);
          foliage.position.y = 4.0;
          foliage.castShadow = true;
          tree.add(trunk);
          tree.add(foliage);
          tree.position.set(sideX + (Math.random() - 0.5) * 1.5, 0, zOffset + (Math.random() - 0.5) * 4);
          chunk.add(tree);
        }
      }
    });
  }

  createMilestone(chunk) {
    const stone = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.9, 0.4);
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xfbc02d }); // Indian Highway Yellow Top
    const body = new THREE.Mesh(bodyGeo, whiteMat);
    body.position.y = 0.45;
    const topGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16);
    const top = new THREE.Mesh(topGeo, yellowMat);
    top.rotation.z = Math.PI / 2;
    top.position.y = 0.9;
    stone.add(body);
    stone.add(top);
    stone.position.set(4.8, 0, (Math.random() - 0.5) * 10);
    chunk.add(stone);
  }

  createVillageHut(chunk) {
    const hut = new THREE.Group();
    const side = Math.random() < 0.5 ? -1 : 1;
    const posX = side * (8.5 + Math.random() * 2.5);

    // Mud Walls (Clay ochre)
    const wallGeo = new THREE.BoxGeometry(3.2, 1.8, 3.2);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 0.9;
    walls.castShadow = true;
    hut.add(walls);

    // Sloped Thatched Straw Roof (Triangular prism / Pyramidal cone)
    const roofGeo = new THREE.ConeGeometry(2.8, 1.4, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xbcaaa4 }); // Straw thatch color
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    hut.add(roof);

    // Small doorway
    const doorGeo = new THREE.BoxGeometry(0.8, 1.2, 0.2);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.6, -1.61 * side);
    hut.add(door);

    hut.position.set(posX, 0, (Math.random() - 0.5) * 12);
    chunk.add(hut);
  }

  createRailwayCrossing(chunk) {
    // Railroad tracks crossing perpendicular across the road
    const railMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
    const sleeperMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });

    // Sleepers (wooden ties)
    for (let rx = -12; rx <= 12; rx += 1.4) {
      const sleeperGeo = new THREE.BoxGeometry(0.6, 0.08, 2.2);
      const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
      sleeper.position.set(rx, 0.04, 0);
      chunk.add(sleeper);
    }

    // Steel Rails
    const railGeo = new THREE.BoxGeometry(26, 0.14, 0.15);
    const rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(0, 0.1, -0.65);
    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(0, 0.1, 0.65);
    chunk.add(rail1);
    chunk.add(rail2);

    // Crossing Signpost (St. Andrew's Cross)
    const signPost = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
    const postMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.4;
    signPost.add(post);

    const crossArmGeo = new THREE.BoxGeometry(1.4, 0.16, 0.04);
    const crossArmMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f }); // Red railway cross
    const arm1 = new THREE.Mesh(crossArmGeo, crossArmMat);
    arm1.position.y = 2.4;
    arm1.rotation.z = 0.785;
    const arm2 = new THREE.Mesh(crossArmGeo, crossArmMat);
    arm2.position.y = 2.4;
    arm2.rotation.z = -0.785;
    signPost.add(arm1);
    signPost.add(arm2);

    signPost.position.set(4.9, 0, 2.5);
    chunk.add(signPost);

    // Decorative local train car on the side tracks (just like the reference image!)
    const trainCar = this.createLocalTrainCar();
    trainCar.position.set(-10.5, 0, 0);
    chunk.add(trainCar);
  }

  createLocalTrainCar() {
    const train = new THREE.Group();
    // Body (Green/Cream Indian local railcar)
    const bodyGeo = new THREE.BoxGeometry(7.0, 2.4, 2.0);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x388e3c }); // Indian Railways green
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    train.add(body);

    // Windows band (Cream/Yellow)
    const windowBandGeo = new THREE.BoxGeometry(7.05, 0.7, 2.02);
    const windowMat = new THREE.MeshLambertMaterial({ color: 0xfff59d }); // Warm interior glowing window
    const windowBand = new THREE.Mesh(windowBandGeo, windowMat);
    windowBand.position.y = 1.9;
    train.add(windowBand);

    // Roof
    const roofGeo = new THREE.BoxGeometry(7.2, 0.3, 2.1);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.9;
    train.add(roof);

    return train;
  }

  // ---------------- OBSTACLE BUILDERS ----------------
  populateChunkEntities(chunk) {
    const availableLanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    const numObstacles = Math.random() < 0.65 ? 1 : 2;
    const obstacleLanes = availableLanes.slice(0, numObstacles);
    const freeLane = availableLanes[availableLanes.length - 1];

    // Spawn obstacles
    obstacleLanes.forEach(laneIdx => {
      const laneX = LANES[laneIdx];
      const zOffset = (Math.random() - 0.5) * (CHUNK_LENGTH * 0.65);
      const obsType = Math.floor(Math.random() * 5); // 0: Tractor, 1: Auto, 2: Cycle, 3: Pothole, 4: Barrier

      let obsMesh = null;
      let obsData = {};

      switch (obsType) {
        case 0: // Tractor
          obsMesh = this.buildTractor();
          obsData = { type: 'tractor', width: 1.8, height: 2.2, depth: 2.6, canJump: false, canSlide: false };
          break;
        case 1: // Auto Rickshaw
          obsMesh = this.buildAutoRickshaw();
          obsData = { type: 'auto', width: 1.5, height: 2.0, depth: 2.2, canJump: false, canSlide: false };
          break;
        case 2: // Bicycle with milk cans
          obsMesh = this.buildBicycle();
          obsData = { type: 'cycle', width: 0.9, height: 1.2, depth: 1.8, canJump: true, canSlide: false };
          break;
        case 3: // Pothole
          obsMesh = this.buildPothole();
          obsData = { type: 'pothole', width: 1.6, height: 0.3, depth: 1.6, canJump: true, canSlide: false };
          break;
        case 4: // Bamboo Barrier
          obsMesh = this.buildBarrier();
          obsData = { type: 'barrier', width: 2.1, height: 1.4, depth: 0.5, canJump: true, canSlide: true };
          break;
      }

      if (obsMesh) {
        obsMesh.position.set(laneX, 0, zOffset);
        chunk.add(obsMesh);

        this.activeObstacles.push({
          mesh: obsMesh,
          chunk: chunk,
          laneX: laneX,
          ...obsData
        });
      }
    });

    // Spawn Coins in free lane
    if (Math.random() < 0.8) {
      const coinLaneX = LANES[freeLane];
      const startZ = -10;
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const coin = this.buildCoin();
        coin.position.set(coinLaneX, 0.7, startZ + i * 2.2);
        chunk.add(coin);
        this.activeCoins.push({ mesh: coin, chunk: chunk, collected: false });
      }
    }

    // Spawn Power-up occasionally (18% chance)
    if (Math.random() < 0.18) {
      const pTypes = ['magnet', 'boost', 'shield'];
      const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
      const pMesh = this.buildPowerupMesh(pType);
      pMesh.position.set(LANES[freeLane], 0.85, (Math.random() - 0.5) * 8);
      chunk.add(pMesh);
      this.activePowerups.push({ mesh: pMesh, chunk: chunk, type: pType, collected: false });
    }
  }

  buildTractor() {
    const tractor = new THREE.Group();
    // Red Engine Hood
    const hoodGeo = new THREE.BoxGeometry(1.4, 1.0, 2.2);
    const redMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f });
    const hood = new THREE.Mesh(hoodGeo, redMat);
    hood.position.y = 1.0;
    hood.castShadow = true;
    tractor.add(hood);

    // Big Rear Tires
    const rearTireGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.35, 12);
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
    const tireL = new THREE.Mesh(rearTireGeo, tireMat);
    tireL.rotation.z = Math.PI / 2;
    tireL.position.set(0.85, 0.75, -0.6);
    const tireR = new THREE.Mesh(rearTireGeo, tireMat);
    tireR.rotation.z = Math.PI / 2;
    tireR.position.set(-0.85, 0.75, -0.6);
    tractor.add(tireL);
    tractor.add(tireR);

    // Front Tires
    const frontTireGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12);
    const fTireL = new THREE.Mesh(frontTireGeo, tireMat);
    fTireL.rotation.z = Math.PI / 2;
    fTireL.position.set(0.75, 0.45, 0.7);
    const fTireR = new THREE.Mesh(frontTireGeo, tireMat);
    fTireR.rotation.z = Math.PI / 2;
    fTireR.position.set(-0.75, 0.45, 0.7);
    tractor.add(fTireL);
    tractor.add(fTireR);

    // Exhaust Pipe (chimney)
    const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8);
    const exhaust = new THREE.Mesh(exhaustGeo, tireMat);
    exhaust.position.set(0.45, 1.8, 0.6);
    tractor.add(exhaust);

    // Driver Seat
    const seatGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x424242 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 1.3, -0.5);
    tractor.add(seat);

    return tractor;
  }

  buildAutoRickshaw() {
    const auto = new THREE.Group();

    // 1. Green lower chassis & cabin
    const bodyGeo = new THREE.BoxGeometry(1.4, 0.75, 2.1);
    const greenMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 }); // Classic Rickshaw Green
    const body = new THREE.Mesh(bodyGeo, greenMat);
    body.position.y = 0.55;
    body.castShadow = true;
    auto.add(body);

    // 2. Yellow Canvas Roof Canopy with slanted front visor
    const roofGeo = new THREE.BoxGeometry(1.35, 0.8, 1.8);
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xfdd835 }); // Vibrant Rickshaw Yellow
    const roof = new THREE.Mesh(roofGeo, yellowMat);
    roof.position.set(0, 1.35, -0.15);
    roof.castShadow = true;
    auto.add(roof);

    // 3. Black Windshield Frame & Glass
    const frameGeo = new THREE.BoxGeometry(1.2, 0.65, 0.1);
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
    const windshieldFrame = new THREE.Mesh(frameGeo, blackMat);
    windshieldFrame.position.set(0, 1.25, 0.76);
    auto.add(windshieldFrame);

    const glassGeo = new THREE.BoxGeometry(1.1, 0.55, 0.08);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.7 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.25, 0.78);
    auto.add(glass);

    // 4. Glowing Center Headlight
    const lightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff59d }); // Glowing headlight
    const headlight = new THREE.Mesh(lightGeo, lightMat);
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(0, 0.65, 1.06);
    auto.add(headlight);

    // 5. Wheels (Front wheel and 2 rear wheels)
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const hubcapMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8, roughness: 0.2 });

    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.32, 0.82);
    auto.add(frontWheel);

    const rearWheelL = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheelL.rotation.z = Math.PI / 2;
    rearWheelL.position.set(0.68, 0.32, -0.65);
    auto.add(rearWheelL);

    const rearWheelR = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheelR.rotation.z = Math.PI / 2;
    rearWheelR.position.set(-0.68, 0.32, -0.65);
    auto.add(rearWheelR);

    // 6. Rear Black Bumper with reflectors
    const bumperGeo = new THREE.BoxGeometry(1.42, 0.18, 0.12);
    const bumper = new THREE.Mesh(bumperGeo, blackMat);
    bumper.position.set(0, 0.35, -1.06);
    auto.add(bumper);

    const reflectorGeo = new THREE.BoxGeometry(0.2, 0.1, 0.05);
    const refMat = new THREE.MeshBasicMaterial({ color: 0xd50000 });
    const refL = new THREE.Mesh(reflectorGeo, refMat);
    refL.position.set(-0.5, 0.35, -1.13);
    const refR = new THREE.Mesh(reflectorGeo, refMat);
    refR.position.set(0.5, 0.35, -1.13);
    auto.add(refL);
    auto.add(refR);

    return auto;
  }

  buildBicycle() {
    const cycle = new THREE.Group();
    // Frame & Wheels
    const frameGeo = new THREE.BoxGeometry(0.12, 0.7, 1.4);
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.55;
    cycle.add(frame);

    // Milk Dabbas (Aluminum Milk Cans on carrier)
    const canGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.55, 10);
    const canMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.8, roughness: 0.3 });
    const canL = new THREE.Mesh(canGeo, canMat);
    canL.position.set(0.26, 0.45, -0.3);
    const canR = new THREE.Mesh(canGeo, canMat);
    canR.position.set(-0.26, 0.45, -0.3);
    cycle.add(canL);
    cycle.add(canR);

    return cycle;
  }

  buildPothole() {
    const pothole = new THREE.Group();
    const puddleGeo = new THREE.CylinderGeometry(0.85, 0.7, 0.06, 14);
    const puddleMat = new THREE.MeshLambertMaterial({ color: 0x271911 }); // Dark muddy water puddle
    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
    puddle.position.y = 0.03;
    pothole.add(puddle);
    return pothole;
  }

  buildBarrier() {
    const barrier = new THREE.Group();
    // Bamboo crossbar
    const barGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
    const barMat = new THREE.MeshLambertMaterial({ color: 0xffb74d }); // Bamboo yellow
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = 1.25;
    barrier.add(bar);

    // Two wooden posts
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-0.95, 0.75, 0);
    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(0.95, 0.75, 0);
    barrier.add(postL);
    barrier.add(postR);

    return barrier;
  }

  // ---------------- COLLECTIBLES & POWERUPS ----------------
  buildCoin() {
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffb300,
      emissiveIntensity: 0.4
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    return coin;
  }

  buildPowerupMesh(type) {
    const group = new THREE.Group();
    let col = 0xff1744; // Magnet Red
    if (type === 'boost') col = 0xff9100; // Boost Orange
    if (type === 'shield') col = 0x00e5ff; // Shield Cyan

    const sphereGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const mat = new THREE.MeshLambertMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }

  // ---------------- EVENT BINDINGS & CONTROLS ----------------
  bindEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Touch Swipe Detection for Android & Mobile devices
    window.addEventListener('touchstart', e => {
      this.audio.init();
      if (this.state !== 'PLAYING') return;
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();
    }, { passive: true });

    window.addEventListener('touchend', e => {
      if (this.state !== 'PLAYING') return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const elapsed = Date.now() - this.touchStartTime;

      if (elapsed > 800) return; // Too slow for swipe

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > 28) {
        if (absX > absY) {
          if (deltaX > 0) this.changeLane(1);
          else this.changeLane(-1);
        } else {
          if (deltaY < 0) this.jump();
          else this.slide();
        }
      }
    }, { passive: true });

    // Keyboard Controls
    window.addEventListener('keydown', e => {
      this.audio.init();
      if (this.state !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.changeLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.changeLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.slide();
      }
    });

    // UI Buttons
    document.getElementById('btn-play').addEventListener('click', () => {
      this.audio.init();
      this.audio.playClick();
      this.startGame();
    });

    document.getElementById('btn-open-shop').addEventListener('click', () => {
      this.audio.init();
      this.audio.playClick();
      this.openShop();
    });

    document.getElementById('btn-close-shop').addEventListener('click', () => {
      this.audio.playClick();
      this.closeShop();
    });

    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      this.audio.enabled = !this.audio.enabled;
      document.getElementById('btn-sound-toggle').textContent = `🔊 SOUND: ${this.audio.enabled ? 'ON' : 'OFF'}`;
      this.audio.playClick();
      this.saveData();
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      this.audio.playClick();
      this.pauseGame();
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      this.audio.playClick();
      this.resumeGame();
    });

    document.getElementById('btn-restart-pause').addEventListener('click', () => {
      this.audio.playClick();
      this.startGame();
    });

    document.getElementById('btn-menu-pause').addEventListener('click', () => {
      this.audio.playClick();
      this.returnToMenu();
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      this.audio.playClick();
      this.startGame();
    });

    document.getElementById('btn-over-shop').addEventListener('click', () => {
      this.audio.playClick();
      this.openShop();
    });

    document.getElementById('btn-over-menu').addEventListener('click', () => {
      this.audio.playClick();
      this.returnToMenu();
    });

    // Shop Character Selection & Unlocking
    this.bindShopButtons();
  }

  bindShopButtons() {
    ['Tabish Firoz', 'lallan', 'champa'].forEach(charId => {
      const btn = document.getElementById(`btn-char-${charId}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.audio.playClick();
          const info = CHARACTERS[charId];
          if (info.unlocked) {
            this.selectedCharacter = charId;
            this.updatePlayerSkin();
            this.saveData();
            this.refreshShopUI();
          } else {
            if (this.totalCoins >= info.cost) {
              this.totalCoins -= info.cost;
              info.unlocked = true;
              this.selectedCharacter = charId;
              this.updatePlayerSkin();
              this.audio.playPowerup();
              this.saveData();
              this.refreshShopUI();
            }
          }
        });
      }
    });
  }

  // ---------------- GAME ACTIONS ----------------
  changeLane(dir) {
    const nextLane = Math.max(0, Math.min(2, this.currentLane + dir));
    if (nextLane !== this.currentLane) {
      this.currentLane = nextLane;
      this.targetX = LANES[this.currentLane];
      this.audio.playClick();
    }
  }

  jump() {
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.verticalVelocity = JUMP_VELOCITY;
      this.audio.playJump();
    }
  }

  slide() {
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = SLIDE_DURATION;
      if (this.isJumping) {
        // Fast fall
        this.verticalVelocity = -JUMP_VELOCITY * 1.5;
      }
      this.audio.playSlide();
    }
  }

  startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.distance = 0;
    this.coinsThisRun = 0;
    this.currentSpeed = BASE_SPEED;
    this.currentLane = 1;
    this.targetX = LANES[1];
    this.playerY = 0;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.magnetTimer = 0;
    this.boostTimer = 0;
    this.shieldActive = false;

    // Reset player position
    this.playerGroup.position.set(0, 0, 0);

    // Clear old chunks
    this.chunks.forEach(chunk => this.scene.remove(chunk));
    this.chunks = [];
    this.activeObstacles = [];
    this.activeCoins = [];
    this.activePowerups = [];
    this.nextChunkZ = 0;
    this.chunkSpawnCounter = 0;

    this.initInitialTrack();

    // UI Updates
    this.showScreen('hud');

    // Show touch hint briefly for 3 seconds
    const hint = document.getElementById('touch-hint');
    if (hint) {
      hint.style.display = 'flex';
      setTimeout(() => { hint.style.display = 'none'; }, 3200);
    }

    this.updateHUD();
  }

  showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }
  }

  pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pause-screen').classList.remove('hidden');
      document.getElementById('pause-screen').classList.add('active');
    }
  }

  resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-screen').classList.add('hidden');
      document.getElementById('pause-screen').classList.remove('active');
    }
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.audio.playCrash();

    // Update persistent stats
    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) this.highScore = this.score;
    this.totalCoins += this.coinsThisRun;
    this.saveData();

    // Game over UI
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-distance').textContent = `${Math.floor(this.distance)} M`;
    document.getElementById('final-coins').textContent = `+ ₹ ${this.coinsThisRun}`;
    document.getElementById('final-best').textContent = this.highScore;

    const newRecordTag = document.getElementById('new-high-badge');
    if (isNewRecord && this.score > 0) newRecordTag.classList.remove('hidden');
    else newRecordTag.classList.add('hidden');

    this.showScreen('gameover-screen');
  }

  returnToMenu() {
    this.state = 'MENU';
    this.showScreen('menu-screen');
    this.updateMenuUI();
  }

  openShop() {
    this.state = 'SHOP';
    this.showScreen('shop-screen');
    this.refreshShopUI();
  }

  closeShop() {
    this.returnToMenu();
  }

  // ---------------- UI UPDATES ----------------
  updateHUD() {
    document.getElementById('hud-score').textContent = this.score;
    const distText = this.distance >= 1000 ? `${(this.distance / 1000).toFixed(2)} KM` : `${Math.floor(this.distance)} M`;
    document.getElementById('hud-distance').textContent = distText;
    document.getElementById('hud-coins').textContent = `₹ ${this.coinsThisRun}`;

    // Buffs
    const magFill = document.getElementById('buff-magnet-fill');
    const magItem = document.getElementById('buff-magnet');
    if (this.magnetTimer > 0) {
      magItem.classList.remove('hidden');
      magFill.style.width = `${(this.magnetTimer / 10) * 100}%`;
    } else {
      magItem.classList.add('hidden');
    }

    const boostFill = document.getElementById('buff-boost-fill');
    const boostItem = document.getElementById('buff-boost');
    if (this.boostTimer > 0) {
      boostItem.classList.remove('hidden');
      boostFill.style.width = `${(this.boostTimer / 6) * 100}%`;
    } else {
      boostItem.classList.add('hidden');
    }

    const shieldItem = document.getElementById('buff-shield');
    if (this.shieldActive) {
      shieldItem.classList.remove('hidden');
    } else {
      shieldItem.classList.add('hidden');
    }
  }

  updateMenuUI() {
    document.getElementById('menu-best-score').textContent = this.highScore;
    document.getElementById('menu-total-coins').textContent = `₹ ${this.totalCoins}`;
    document.getElementById('menu-active-char').textContent = CHARACTERS[this.selectedCharacter].name;
    document.getElementById('btn-sound-toggle').textContent = `🔊 SOUND: ${this.audio.enabled ? 'ON' : 'OFF'}`;
  }

  refreshShopUI() {
    document.getElementById('shop-coins-display').textContent = `₹ ${this.totalCoins}`;
    ['Tabish Firoz', 'lallan', 'champa'].forEach(charId => {
      const card = document.getElementById(`card-${charId}`);
      const btn = document.getElementById(`btn-char-${charId}`);
      const info = CHARACTERS[charId];

      if (this.selectedCharacter === charId) {
        card.classList.add('selected');
        btn.textContent = 'ACTIVE';
        btn.className = 'btn btn-sm btn-select active';
      } else if (info.unlocked) {
        card.classList.remove('selected');
        btn.textContent = 'CHOOSE';
        btn.className = 'btn btn-sm btn-secondary';
      } else {
        card.classList.remove('selected');
        btn.textContent = `₹ ${info.cost}`;
        btn.className = 'btn btn-sm btn-primary';
        if (this.totalCoins < info.cost) {
          btn.style.opacity = '0.5';
          btn.style.pointerEvents = 'none';
        } else {
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        }
      }
    });
  }

  // ---------------- GAME TICK & PHYSICS ----------------
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === 'PLAYING') {
      this.updatePhysics(delta);
      this.updateTrackAndChunks(delta);
      this.updateCollectibles(delta);
      this.updateDust(delta);
      this.updateHUD();
    }

    // Camera follow player
    if (this.playerGroup && this.camera) {
      this.camera.position.z = this.playerGroup.position.z + 6.2;
      this.camera.position.x += (this.playerGroup.position.x * 0.65 - this.camera.position.x) * 0.1;
      this.camera.position.y += (this.playerGroup.position.y * 0.5 + 3.6 - this.camera.position.y) * 0.1;

      // Keep sun on distant horizon ahead of player
      if (this.sunDisk) {
        this.sunDisk.position.z = this.playerGroup.position.z - 90;
      }
      if (this.sunLight) {
        this.sunLight.position.z = this.playerGroup.position.z + 15;
        this.sunLight.target.position.z = this.playerGroup.position.z;
        this.sunLight.target.updateMatrixWorld();
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  updatePhysics(delta) {
    // 1. Forward Motion & Distance
    const speedMult = this.boostTimer > 0 ? 1.6 : 1.0;
    const effSpeed = this.currentSpeed * speedMult;
    this.currentSpeed = Math.min(this.currentSpeed + SPEED_INCREMENT * delta, MAX_SPEED);

    const forwardMovement = effSpeed * delta;
    this.playerGroup.position.z -= forwardMovement;
    this.distance += forwardMovement;
    this.score = Math.floor(this.distance) + this.coinsThisRun * 10;

    // 2. Smooth Lane Interpolation
    const curX = this.playerGroup.position.x;
    this.playerGroup.position.x += (this.targetX - curX) * LANE_CHANGE_SPEED * delta;

    // 3. Jump Physics
    if (this.isJumping) {
      this.playerY += this.verticalVelocity * delta;
      this.verticalVelocity -= GRAVITY * delta;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.spawnDustPuff(this.playerGroup.position.x, 0, this.playerGroup.position.z);
      }
    }

    // 4. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    this.playerGroup.position.y = this.playerY;

    // 5. Visual Animations
    if (this.playerMesh) {
      if (this.isSliding) {
        this.playerMesh.scale.set(1.1, 0.42, 1.3);
        this.playerMesh.position.y = 0.2;
      } else if (this.isJumping) {
        this.playerMesh.scale.set(1.0, 1.1, 0.9);
        this.playerMesh.position.y = 0.0;
      } else {
        // Running Bob & Step Animation
        const runTime = this.distance * 0.4;
        const bob = Math.abs(Math.sin(runTime)) * 0.12;
        this.playerMesh.scale.set(1.0, 1.0, 1.0);
        this.playerMesh.position.y = bob;
        this.playerMesh.rotation.z = Math.sin(runTime * 0.5) * 0.08;

        // Limbs swing
        if (this.legL && this.legR) {
          this.legL.rotation.x = Math.sin(runTime) * 0.8;
          this.legR.rotation.x = -Math.sin(runTime) * 0.8;
        }

        // Spawn dust while running on dirt
        if (Math.random() < 0.25) {
          this.spawnDustPuff(this.playerGroup.position.x, 0, this.playerGroup.position.z);
        }
      }
    }

    // 6. Shield visual sync
    if (this.shieldMesh) {
      this.shieldMesh.visible = this.shieldActive;
      if (this.shieldActive) this.shieldMesh.rotation.y += 2.0 * delta;
    }

    // 7. Powerup Timers
    if (this.magnetTimer > 0) this.magnetTimer -= delta;
    if (this.boostTimer > 0) this.boostTimer -= delta;

    // 8. Obstacle Collision Detection
    this.checkObstacleCollisions();
  }

  checkObstacleCollisions() {
    const playerZ = this.playerGroup.position.z;
    const playerX = this.playerGroup.position.x;
    const playerY = this.playerGroup.position.y;

    for (let i = 0; i < this.activeObstacles.length; i++) {
      const obs = this.activeObstacles[i];
      // Get global world position of obstacle
      const worldPos = new THREE.Vector3();
      obs.mesh.getWorldPosition(worldPos);

      // Hitbox checks
      const dz = Math.abs(playerZ - worldPos.z);
      const dx = Math.abs(playerX - worldPos.x);

      if (dz < (obs.depth * 0.45 + 0.3) && dx < (obs.width * 0.42 + 0.3)) {
        // Can duck under barrier?
        if (obs.canSlide && this.isSliding) {
          continue; // Ducked safely!
        }
        // Can jump over low obstacle?
        if (obs.canJump && this.isJumping && playerY > 1.1) {
          continue; // Cleared jump safely!
        }

        // Super boost smashes obstacle!
        if (this.boostTimer > 0) {
          this.audio.playCrash();
          obs.mesh.visible = false;
          continue;
        }

        // Suraksha shield saves once!
        if (this.shieldActive) {
          this.shieldActive = false;
          this.audio.playCrash();
          obs.mesh.visible = false;
          continue;
        }

        // Collision -> Game Over
        this.gameOver();
        break;
      }
    }
  }

  updateTrackAndChunks(delta) {
    const playerZ = this.playerGroup.position.z;

    // Recycle chunks that are far behind player
    if (this.chunks.length > 0) {
      const oldestChunk = this.chunks[0];
      if (oldestChunk.position.z - CHUNK_LENGTH > playerZ) {
        this.chunks.shift();
        this.scene.remove(oldestChunk);

        // Filter out destroyed chunk's entities
        this.activeObstacles = this.activeObstacles.filter(o => o.chunk !== oldestChunk);
        this.activeCoins = this.activeCoins.filter(c => c.chunk !== oldestChunk);
        this.activePowerups = this.activePowerups.filter(p => p.chunk !== oldestChunk);

        // Spawn next forward chunk
        this.spawnChunk(false);
      }
    }
  }

  updateCollectibles(delta) {
    const playerZ = this.playerGroup.position.z;
    const playerX = this.playerGroup.position.x;
    const playerY = this.playerGroup.position.y;

    // Coins
    this.activeCoins.forEach(coin => {
      if (coin.collected) return;
      coin.mesh.rotation.z += 4.0 * delta;

      const worldPos = new THREE.Vector3();
      coin.mesh.getWorldPosition(worldPos);

      const dist = Math.hypot(playerX - worldPos.x, playerZ - worldPos.z);

      // Magnet Pull Effect
      if (this.magnetTimer > 0 && dist < 12.0) {
        const pullFactor = 16.0 * delta;
        coin.mesh.position.x += (playerX - worldPos.x) * pullFactor;
        coin.mesh.position.z += (playerZ - worldPos.z) * pullFactor;
      }

      // Collect Check
      if (dist < 1.1 && Math.abs(playerY + 0.6 - worldPos.y) < 1.4) {
        coin.collected = true;
        coin.mesh.visible = false;
        this.coinsThisRun++;
        this.audio.playCoin();
      }
    });

    // Power-ups
    this.activePowerups.forEach(p => {
      if (p.collected) return;
      p.mesh.rotation.y += 3.0 * delta;
      p.mesh.position.y = 0.85 + Math.sin(this.distance * 0.1) * 0.2;

      const worldPos = new THREE.Vector3();
      p.mesh.getWorldPosition(worldPos);

      const dist = Math.hypot(playerX - worldPos.x, playerZ - worldPos.z);
      if (dist < 1.2 && Math.abs(playerY + 0.6 - worldPos.y) < 1.5) {
        p.collected = true;
        p.mesh.visible = false;
        this.audio.playPowerup();

        if (p.type === 'magnet') this.magnetTimer = 10.0;
        else if (p.type === 'boost') this.boostTimer = 6.0;
        else if (p.type === 'shield') this.shieldActive = true;
      }
    });
  }
}

// ---------------- BOOTSTRAP ----------------
window.addEventListener('DOMContentLoaded', () => {
  window.mGame = new MittiRunGame();
});
