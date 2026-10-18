import * as THREE from "three";

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

// ---------------- SOUND & BACKGROUND INSTRUMENTAL MUSIC SYSTEM (WEB AUDIO API) ----------------
class DesiAudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.bgmPlaying = false;
    this.bgmTempo = 118; // Desi running folk tempo (BPM)
    this.bgmStep = 0;
    this.bgmTimer = null;
    this.bgmNextNoteTime = 0.0;
    this.bgmMasterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgmMasterGain = this.ctx.createGain();
        this.bgmMasterGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
        this.bgmMasterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startBGM() {
    if (!this.musicEnabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.bgmPlaying) return;

    this.bgmPlaying = true;
    this.bgmStep = 0;
    this.bgmNextNoteTime = this.ctx.currentTime + 0.05;

    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.bgmTimer = setInterval(() => this.scheduleBGM(), 25);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.musicEnabled;
  }

  setBGMTempo(bpm) {
    this.bgmTempo = Math.max(105, Math.min(155, bpm));
  }

  scheduleBGM() {
    if (!this.bgmPlaying || !this.ctx || !this.musicEnabled) return;

    const secondsPer16th = 60.0 / this.bgmTempo / 4.0;
    while (this.bgmNextNoteTime < this.ctx.currentTime + 0.12) {
      this.playBGMStep(this.bgmStep, this.bgmNextNoteTime);
      this.bgmStep = (this.bgmStep + 1) % 32;
      this.bgmNextNoteTime += secondsPer16th;
    }
  }

  playBGMStep(step, time) {
    if (!this.bgmMasterGain || !this.ctx) return;

    // --- 1. DHOLAK & TABLA FOLK PERCUSSION GROOVE ---
    // Resonant Bass Dholak "DHUM" (steps 0, 8, 16, 24)
    if (step % 8 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
      gain.gain.setValueAtTime(0.42, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain);
      gain.connect(this.bgmMasterGain);
      osc.start(time);
      osc.stop(time + 0.14);
    }
    // Dholak secondary open tap "GE" (syncopated steps 2, 10, 18, 26)
    else if (step % 8 === 2) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(85, time);
      osc.frequency.exponentialRampToValueAtTime(52, time + 0.08);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(gain);
      gain.connect(this.bgmMasterGain);
      osc.start(time);
      osc.stop(time + 0.08);
    }

    // High Rim Slap "TAK / TIN" (steps 4, 12, 20, 28)
    if (step % 8 === 4) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(920, time);
      osc.frequency.exponentialRampToValueAtTime(320, time + 0.04);
      gain.gain.setValueAtTime(0.26, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(this.bgmMasterGain);
      osc.start(time);
      osc.stop(time + 0.05);
    }
    // Subtle double tap rim on step 6 & 14
    else if (step % 4 === 2) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, time);
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
      osc.connect(gain);
      gain.connect(this.bgmMasterGain);
      osc.start(time);
      osc.stop(time + 0.035);
    }

    // --- 2. HARMONIUM & TANPURA DRONE BACKING ---
    // Warm tonic backing drone (Sa - Pa / C3 130.81Hz + G3 196.00Hz)
    if (step % 8 === 0) {
      const droneNotes = step < 16 ? [130.81, 196.0] : [130.81, 220.0];
      droneNotes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, time);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.32);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmMasterGain);
        osc.start(time);
        osc.stop(time + 0.42);
      });
    }

    // --- 3. BANSURI FLUTE & SITAR DESI FOLK MELODY ---
    // Catchy 32-step running folk melody
    const melodySeq = [
      523.25, 0, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25,
      440.0, 523.25, 587.33, 0, 659.25, 587.33, 523.25, 0,
      659.25, 783.99, 880.0, 783.99, 659.25, 0, 587.33, 659.25,
      523.25, 440.0, 523.25, 587.33, 523.25, 0, 0, 0,
    ];
    const freq = melodySeq[step];
    if (freq && freq > 0) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      // Gentle slide (meend) into the note for authentic Indian flute feel
      osc.frequency.setValueAtTime(freq * 0.95, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.025);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, time);

      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmMasterGain);
      osc.start(time);
      osc.stop(time + 0.18);
    }
  }

  playCoin() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = "sine";
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
    osc.type = "triangle";
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
    filter.type = "lowpass";
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
    filter.type = "lowpass";
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
      osc.type = "square";
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
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playSurge() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  playPaceUp() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.07;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  playLevelComplete() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Celebratory ascending royal chime fanfare
    [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.07;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }
}

// ---------------- CHARACTER DEFINITIONS ----------------
const CHARACTERS = {
  tabish: {
    name: "Tabish",
    tagline: "The Village Sprinter",
    cost: 0,
    unlocked: true,
    kurtaColor: 0xe65100, // Terracotta Saffron Kurta
    dhotiColor: 0xf5f5f0, // Pure White Dhoti
    gamchhaColor: 0xb71c1c, // Authentic Bihari Red Gamchha
    skinColor: 0xc88556, // Warm bronze desi skin tone
    shoesColor: 0x4e342e, // Rustic leather Mojari
    headStyle: "gamchha_knot", // Folded Bihari Gamchha head wrap with knot & tail
    hasMoustache: true,
    hasSunglasses: false,
  },
  akhil: {
    name: "Akhil",
    tagline: "The Auto Rickshaw Rider",
    cost: 150,
    unlocked: false,
    kurtaColor: 0x2e7d32, // Auto Rickshaw Green Kurta
    dhotiColor: 0xffd54f, // Marigold Yellow Dhoti
    gamchhaColor: 0xff9800, // Vibrant Orange Gamchha
    skinColor: 0xb77242, // Sun-tanned skin tone
    shoesColor: 0x212121, // Black runners with athletic sole
    headStyle: "sport_band", // Athletic headband & sunglasses
    hasMoustache: true,
    hasSunglasses: true, // Cool dark aviator sunglasses
  },
  firoz: {
    name: "Firoz",
    tagline: "The Fast Runner",
    cost: 300,
    unlocked: false,
    kurtaColor: 0x880e4f, // Royal Deep Maroon Kurta
    dhotiColor: 0x1565c0, // Royal Blue Pleated Dhoti
    gamchhaColor: 0xffd700, // Golden Yellow Zari Dupatta
    skinColor: 0xd79669, // Fair radiant skin tone
    shoesColor: 0x6d4c41, // Pointed embroidered Mojari
    headStyle: "royal_pagdi", // Grand Bihari royal Pagdi with kalgi & emerald
    hasMoustache: true,
    hasSunglasses: false,
  },
};

// ---------------- MAP & ENVIRONMENT DEFINITIONS ----------------
const MAPS = {
  village: {
    id: "village",
    name: "Bihar Village",
    shortName: "GAON",
    subtitle: "Mitti Tracks & Mustard Fields",
    groundColor: 0x3d6628,
    roadColor: 0x7a5b43, // Mud clay
    dashColor: 0xefd8a1,
    shoulderColor: 0x937053,
    skyColor: 0xff8a43,
    fogColor: 0xff9e60,
    sunColor: 0xfff3b0,
  },
  bazaar: {
    id: "bazaar",
    name: "Haat Bazaar",
    shortName: "BAZAAR",
    subtitle: "Local Market & Awnings",
    groundColor: 0x4e342e,
    roadColor: 0x3e3532, // Cobblestone street
    dashColor: 0xd7ccc8,
    shoulderColor: 0x5d4037,
    skyColor: 0xd84315, // Festive twilight
    fogColor: 0xbf360c,
    sunColor: 0xffab40,
  },
  railway: {
    id: "railway",
    name: "Railway Junction",
    shortName: "PATNA JN",
    subtitle: "Platforms & Freight Tracks",
    groundColor: 0x37474f, // Ballast gravel
    roadColor: 0x212121, // Railway track bed
    dashColor: 0x90a4ae,
    shoulderColor: 0x455a64,
    skyColor: 0x4a148c, // Dusk purple sky
    fogColor: 0x512da8,
    sunColor: 0xffd54f,
  },
  highway: {
    id: "highway",
    name: "NH-31 Highway",
    shortName: "HIGHWAY",
    subtitle: "Grand Trunk Expressway",
    groundColor: 0x556b2f, // Dry savanna grass
    roadColor: 0x1a2327, // Dark asphalt highway
    dashColor: 0xffd600, // Bright yellow highway dashes
    shoulderColor: 0x37474f,
    skyColor: 0xe65100, // Golden sunset highway
    fogColor: 0xff8f00,
    sunColor: 0xfff176,
  },
  tour: {
    id: "tour",
    name: "Grand Bihar Tour",
    shortName: "TOUR",
    subtitle: "Dynamic Biomes Rotation",
    groundColor: 0x3d6628,
    roadColor: 0x7a5b43,
    dashColor: 0xefd8a1,
    shoulderColor: 0x937053,
    skyColor: 0xff8a43,
    fogColor: 0xff9e60,
    sunColor: 0xfff3b0,
  },
};

// ---------------- DESTINATION LEVEL PROGRESSION ----------------
const LEVELS = [
  {
    level: 1,
    name: "Bihar Village Outskirts",
    shortName: "GAON",
    subtitle: "Mitti Tracks & Mustard Fields",
    mapId: "village",
    targetDistance: 350,
    coinReward: 50,
  },
  {
    level: 2,
    name: "Haat Bazaar Mandi",
    shortName: "BAZAAR",
    subtitle: "Village Market & Awnings",
    mapId: "bazaar",
    targetDistance: 750,
    coinReward: 75,
  },
  {
    level: 3,
    name: "Patna Junction Freight Yard",
    shortName: "PATNA JN",
    subtitle: "Platforms & Freight Tracks",
    mapId: "railway",
    targetDistance: 1250,
    coinReward: 100,
  },
  {
    level: 4,
    name: "NH-31 Expressway Bypass",
    shortName: "HIGHWAY",
    subtitle: "Grand Trunk Highway & Dhabas",
    mapId: "highway",
    targetDistance: 1850,
    coinReward: 150,
  },
  {
    level: 5,
    name: "Rajgir Heritage Valley",
    shortName: "RAJGIR",
    subtitle: "Ancient Hills & Historic Trail",
    mapId: "village",
    targetDistance: 2550,
    coinReward: 200,
  },
  {
    level: 6,
    name: "Grand Bihar Champions Tour",
    shortName: "CHAMPIONS",
    subtitle: "High-Speed Dynamic Biome Rotation",
    mapId: "tour",
    targetDistance: 3350,
    coinReward: 250,
  },
];

// ---------------- MAIN GAME CLASS ----------------
class MittiRunGame {
  constructor() {
    this.container = document.getElementById("game-container");
    this.audio = new DesiAudioManager();

    // Game state
    this.state = "MENU"; // MENU, PLAYING, PAUSED, GAMEOVER
    this.score = 0;
    this.distance = 0;
    this.coinsThisRun = 0;
    this.currentSpeed = BASE_SPEED;
    this.currentLane = 1; // 0: Left, 1: Center, 2: Right
    this.targetX = LANES[1];

    // Destination Level Progression
    this.currentLevel = 1;
    this.maxLevelReached = 1;
    this.levelStartDist = 0;
    this.levelTargetDist = 350;
    this.confettiParticles = [];

    // Map & Biome state
    this.selectedMap = "village";
    this.currentBiome = "village";
    this.targetSkyColor = new THREE.Color(0xff8a43);
    this.targetFogColor = new THREE.Color(0xff9e60);

    // Jump & Slide
    this.playerY = 0;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;

    // Power-ups & Speed Milestones & Periodic Acceleration
    this.magnetTimer = 0;
    this.boostTimer = 0;
    this.shieldActive = false;
    this.lastMilestoneLevel = 0;
    this.milestoneSurgeTimer = 0.0;
    this.runTime = 0.0;
    this.speedTier = 1;
    this.lastSpeedTier = 1;
    this.displaySpeed = BASE_SPEED * 3.6;

    // Persistent storage
    this.loadSaveData();

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Scene groups & Realistic Player Rig
    this.playerGroup = null;
    this.playerMesh = null;
    this.playerMaterials = {};
    this.shieldMesh = null;
    this.legL = null;
    this.legR = null;
    this.armL = null;
    this.armR = null;
    this.gamchhaTail = null;
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
    this.initConfetti();
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
      const data = JSON.parse(localStorage.getItem("mitti_run_save") || "{}");
      this.highScore = data.highScore || 0;
      this.totalCoins = data.totalCoins || 0;
      this.maxLevelReached = data.maxLevelReached || 1;
      const rawChar = (data.selectedCharacter || "tabish").toLowerCase();
      this.selectedCharacter = CHARACTERS[rawChar] ? rawChar : "tabish";
      const unlocked = (data.unlockedCharacters || ["tabish"]).map(id => String(id).toLowerCase());
      unlocked.forEach((id) => {
        if (CHARACTERS[id]) CHARACTERS[id].unlocked = true;
      });
      CHARACTERS.tabish.unlocked = true;
      if (typeof data.soundEnabled === "boolean") {
        this.audio.enabled = data.soundEnabled;
      }
      if (typeof data.musicEnabled === "boolean") {
        this.audio.musicEnabled = data.musicEnabled;
      }
    } catch (e) {
      this.highScore = 0;
      this.totalCoins = 0;
      this.maxLevelReached = 1;
      this.selectedCharacter = "tabish";
    }
    try {
      const data = JSON.parse(localStorage.getItem("mitti_run_save") || "{}");
      this.selectedMap = (data.selectedMap && MAPS[data.selectedMap]) ? data.selectedMap : "village";
    } catch (e) {
      this.selectedMap = "village";
    }
  }

  saveData() {
    try {
      const unlocked = Object.keys(CHARACTERS).filter(
        (id) => CHARACTERS[id].unlocked,
      );
      const data = {
        highScore: this.highScore,
        totalCoins: this.totalCoins,
        maxLevelReached: this.maxLevelReached,
        selectedCharacter: this.selectedCharacter,
        selectedMap: this.selectedMap,
        unlockedCharacters: unlocked,
        soundEnabled: this.audio.enabled,
        musicEnabled: this.audio.musicEnabled,
      };
      localStorage.setItem("mitti_run_save", JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
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

  // ---------------- REALISTIC PLAYER CHARACTER RIG (Tabish, Akhil, Firoz) ----------------
  initPlayer() {
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0, 0);

    // Player Mesh Root
    this.playerMesh = new THREE.Group();
    this.playerGroup.add(this.playerMesh);

    // Suraksha Shield Bubble (invisible by default)
    const shieldGeo = new THREE.SphereGeometry(1.25, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 0.95;
    this.shieldMesh.visible = false;
    this.playerGroup.add(this.shieldMesh);

    this.scene.add(this.playerGroup);

    // Build the realistic 3D model
    this.rebuildPlayerMesh();
  }

  rebuildPlayerMesh() {
    if (!this.playerMesh) return;

    // Clear existing character hierarchy
    while (this.playerMesh.children.length > 0) {
      const child = this.playerMesh.children[0];
      this.playerMesh.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const charInfo = CHARACTERS[this.selectedCharacter] || CHARACTERS.tabish;

    // Materials
    const skinMat = new THREE.MeshLambertMaterial({
      color: charInfo.skinColor || 0xc88556,
    });
    const kurtaMat = new THREE.MeshLambertMaterial({
      color: charInfo.kurtaColor,
    });
    const dhotiMat = new THREE.MeshLambertMaterial({
      color: charInfo.dhotiColor,
    });
    const gamchhaMat = new THREE.MeshLambertMaterial({
      color: charInfo.gamchhaColor,
    });
    const hairMat = new THREE.MeshLambertMaterial({
      color: 0x181818,
    });
    const shoesMat = new THREE.MeshLambertMaterial({
      color: charInfo.shoesColor || 0x4e342e,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.25,
    });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    this.playerMaterials = {
      skin: skinMat,
      kurta: kurtaMat,
      dhoti: dhotiMat,
      gamchha: gamchhaMat,
      shoes: shoesMat,
    };

    // 1. HEAD & EXPRESIVE FACIAL FEATURES
    const headGroup = new THREE.Group();

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.1, 0.115, 0.16, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.38;
    neck.castShadow = true;
    headGroup.add(neck);

    // Nehru / Mandarin Collar
    const collarGeo = new THREE.CylinderGeometry(0.125, 0.13, 0.08, 14);
    const collar = new THREE.Mesh(collarGeo, kurtaMat);
    collar.position.y = 1.35;
    headGroup.add(collar);

    // Cranium
    const headGeo = new THREE.SphereGeometry(0.24, 18, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.58, -0.02);
    head.castShadow = true;
    headGroup.add(head);

    // Styled Hair Cap
    const hairGeo = new THREE.SphereGeometry(
      0.246,
      14,
      14,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.52,
    );
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.6, -0.015);
    hair.rotation.x = -0.15;
    headGroup.add(hair);

    // Sideburns
    const sbGeo = new THREE.BoxGeometry(0.03, 0.1, 0.06);
    const sbL = new THREE.Mesh(sbGeo, hairMat);
    sbL.position.set(-0.23, 1.55, -0.04);
    const sbR = new THREE.Mesh(sbGeo, hairMat);
    sbR.position.set(0.23, 1.55, -0.04);
    headGroup.add(sbL);
    headGroup.add(sbR);

    // Back Hair Volume
    const backHairGeo = new THREE.BoxGeometry(0.26, 0.18, 0.12);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.position.set(0, 1.52, 0.12);
    headGroup.add(backHair);

    // 3D Nose (Facing forward towards -Z)
    const noseGeo = new THREE.ConeGeometry(0.04, 0.09, 8);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, 1.57, -0.25);
    nose.rotation.x = -Math.PI / 2;
    headGroup.add(nose);

    // Detailed Eyes & Dark Pupils
    const eyeGeo = new THREE.BoxGeometry(0.05, 0.032, 0.02);
    const pupilGeo = new THREE.BoxGeometry(0.024, 0.024, 0.024);

    const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeL.position.set(-0.08, 1.61, -0.23);
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-0.08, 1.61, -0.245);

    const eyeR = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeR.position.set(0.08, 1.61, -0.23);
    const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR.position.set(0.08, 1.61, -0.245);

    headGroup.add(eyeL);
    headGroup.add(pupilL);
    headGroup.add(eyeR);
    headGroup.add(pupilR);

    // Athletic Eyebrows
    const browGeo = new THREE.BoxGeometry(0.075, 0.02, 0.02);
    const browL = new THREE.Mesh(browGeo, hairMat);
    browL.position.set(-0.08, 1.65, -0.235);
    browL.rotation.z = 0.08;
    const browR = new THREE.Mesh(browGeo, hairMat);
    browR.position.set(0.08, 1.65, -0.235);
    browR.rotation.z = -0.08;
    headGroup.add(browL);
    headGroup.add(browR);

    // Authentic Bihari Moustache
    if (charInfo.hasMoustache) {
      const stachePartGeo = new THREE.BoxGeometry(0.08, 0.03, 0.03);
      const stacheL = new THREE.Mesh(stachePartGeo, hairMat);
      stacheL.position.set(-0.055, 1.515, -0.242);
      stacheL.rotation.z = -0.15;
      const stacheR = new THREE.Mesh(stachePartGeo, hairMat);
      stacheR.position.set(0.055, 1.515, -0.242);
      stacheR.rotation.z = 0.15;
      const stacheCenter = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.03, 0.03),
        hairMat,
      );
      stacheCenter.position.set(0, 1.52, -0.245);
      headGroup.add(stacheL);
      headGroup.add(stacheR);
      headGroup.add(stacheCenter);
    }

    // Character Distinct Headgear & Accessories
    if (charInfo.headStyle === "gamchha_knot") {
      // Tabish: Bihari Gamchha head wrap with tied knot & tail
      const wrapGeo = new THREE.CylinderGeometry(0.265, 0.265, 0.1, 16);
      const wrap = new THREE.Mesh(wrapGeo, gamchhaMat);
      wrap.position.set(0, 1.64, -0.015);
      wrap.rotation.z = 0.05;
      headGroup.add(wrap);

      // Knot bun on side
      const knotGeo = new THREE.SphereGeometry(0.08, 10, 10);
      const knot = new THREE.Mesh(knotGeo, gamchhaMat);
      knot.position.set(0.23, 1.68, 0.05);
      headGroup.add(knot);

      // Hanging knot tail
      const tailGeo = new THREE.BoxGeometry(0.07, 0.22, 0.03);
      const knotTail = new THREE.Mesh(tailGeo, gamchhaMat);
      knotTail.position.set(0.25, 1.54, 0.06);
      knotTail.rotation.z = -0.2;
      headGroup.add(knotTail);
    } else if (charInfo.headStyle === "sport_band") {
      // Akhil: Athletic headband + Aviator shades
      const bandGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 16);
      const band = new THREE.Mesh(bandGeo, gamchhaMat);
      band.position.set(0, 1.65, -0.015);
      headGroup.add(band);

      if (charInfo.hasSunglasses) {
        const shadesMat = new THREE.MeshBasicMaterial({ color: 0x11161b });
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          metalness: 0.9,
          roughness: 0.2,
        });
        // Bridge
        const bridge = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.015, 0.02),
          frameMat,
        );
        bridge.position.set(0, 1.61, -0.255);
        // Lens L & R
        const lensGeo = new THREE.BoxGeometry(0.075, 0.045, 0.02);
        const lensL = new THREE.Mesh(lensGeo, shadesMat);
        lensL.position.set(-0.075, 1.605, -0.255);
        const lensR = new THREE.Mesh(lensGeo, shadesMat);
        lensR.position.set(0.075, 1.605, -0.255);
        // Temples
        const templeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.24);
        const templeL = new THREE.Mesh(templeGeo, frameMat);
        templeL.position.set(-0.21, 1.61, -0.13);
        const templeR = new THREE.Mesh(templeGeo, frameMat);
        templeR.position.set(0.21, 1.61, -0.13);

        headGroup.add(bridge);
        headGroup.add(lensL);
        headGroup.add(lensR);
        headGroup.add(templeL);
        headGroup.add(templeR);
      }
    } else if (charInfo.headStyle === "royal_pagdi") {
      // Firoz: Regal Royal Pagdi with pleated folds, gold trim, kalgi plume & emerald jewel
      const pagdiGeo = new THREE.SphereGeometry(0.28, 16, 14);
      const pagdi = new THREE.Mesh(pagdiGeo, gamchhaMat);
      pagdi.position.set(0, 1.7, -0.01);
      headGroup.add(pagdi);

      // Gold pleated rim
      const rimGeo = new THREE.TorusGeometry(0.26, 0.05, 8, 20);
      const rim = new THREE.Mesh(rimGeo, goldMat);
      rim.position.set(0, 1.66, -0.01);
      rim.rotation.x = Math.PI / 2;
      headGroup.add(rim);

      // Kalgi crest
      const kalgiGeo = new THREE.ConeGeometry(0.08, 0.24, 8);
      const kalgi = new THREE.Mesh(kalgiGeo, gamchhaMat);
      kalgi.position.set(0, 1.94, -0.16);
      kalgi.rotation.x = 0.25;
      headGroup.add(kalgi);

      // Emerald royal gem
      const gemGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const gemMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(0, 1.76, -0.26);
      headGroup.add(gem);
    }

    this.playerMesh.add(headGroup);

    // 2. TORSO (Tailored Kurta & Draped Gamchha)
    const torsoGroup = new THREE.Group();

    // Chest (Upper Kurta)
    const chestGeo = new THREE.BoxGeometry(0.6, 0.44, 0.32);
    const chest = new THREE.Mesh(chestGeo, kurtaMat);
    chest.position.set(0, 1.1, 0);
    chest.castShadow = true;
    torsoGroup.add(chest);

    // Waist / Lower Kurta
    const waistGeo = new THREE.BoxGeometry(0.56, 0.36, 0.3);
    const waist = new THREE.Mesh(waistGeo, kurtaMat);
    waist.position.set(0, 0.76, 0);
    waist.castShadow = true;
    torsoGroup.add(waist);

    // Button Placket down the front chest
    const placketGeo = new THREE.BoxGeometry(0.06, 0.34, 0.02);
    const placketMat = new THREE.MeshLambertMaterial({
      color: charInfo.kurtaColor,
    });
    const placket = new THREE.Mesh(placketGeo, placketMat);
    placket.position.set(0, 1.12, -0.165);
    torsoGroup.add(placket);

    // 3 Golden Kurta Buttons
    const btnGeo = new THREE.SphereGeometry(0.016, 6, 6);
    [-0.08, 0, 0.08].forEach((offsetY) => {
      const b = new THREE.Mesh(btnGeo, goldMat);
      b.position.set(0, 1.12 + offsetY, -0.176);
      torsoGroup.add(b);
    });

    // Desi Gamchha Scarf across shoulder
    const scarfGeo = new THREE.BoxGeometry(0.18, 0.68, 0.35);
    const scarf = new THREE.Mesh(scarfGeo, gamchhaMat);
    scarf.position.set(-0.16, 1.05, 0.01);
    scarf.rotation.z = -0.2;
    torsoGroup.add(scarf);
    this.gamchhaMesh = scarf;

    // Animated Fluttering Gamchha Tail trailing behind
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-0.2, 1.18, 0.16);
    const tailGeo = new THREE.BoxGeometry(0.14, 0.46, 0.03);
    const tailMesh = new THREE.Mesh(tailGeo, gamchhaMat);
    tailMesh.position.set(0, -0.23, 0);
    tailMesh.castShadow = true;
    tailPivot.add(tailMesh);
    torsoGroup.add(tailPivot);
    this.gamchhaTail = tailPivot;

    this.playerMesh.add(torsoGroup);

    // 3. DUAL ARTICULATED ARMS (Running gait swing)
    const armGeoUpper = new THREE.CylinderGeometry(0.085, 0.075, 0.28, 10);
    const armGeoForearm = new THREE.CylinderGeometry(0.07, 0.06, 0.26, 10);
    const fistGeo = new THREE.BoxGeometry(0.085, 0.09, 0.09);

    // Left Arm
    const armL = new THREE.Group();
    armL.position.set(-0.35, 1.25, 0);

    const sleeveL = new THREE.Mesh(armGeoUpper, kurtaMat);
    sleeveL.position.set(0, -0.14, 0);
    sleeveL.castShadow = true;
    armL.add(sleeveL);

    const foreArmL = new THREE.Mesh(armGeoForearm, skinMat);
    foreArmL.position.set(0, -0.38, 0.02);
    foreArmL.rotation.x = -0.25;
    foreArmL.castShadow = true;
    armL.add(foreArmL);

    const fistL = new THREE.Mesh(fistGeo, skinMat);
    fistL.position.set(0, -0.52, 0.06);
    armL.add(fistL);

    if (charInfo.name === "Akhil") {
      // Sport watch on left wrist
      const watch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.076, 0.076, 0.04, 10),
        new THREE.MeshLambertMaterial({ color: 0x212121 }),
      );
      watch.position.set(0, -0.44, 0.04);
      armL.add(watch);
    }

    this.playerMesh.add(armL);
    this.armL = armL;

    // Right Arm
    const armR = new THREE.Group();
    armR.position.set(0.35, 1.25, 0);

    const sleeveR = new THREE.Mesh(armGeoUpper, kurtaMat);
    sleeveR.position.set(0, -0.14, 0);
    sleeveR.castShadow = true;
    armR.add(sleeveR);

    const foreArmR = new THREE.Mesh(armGeoForearm, skinMat);
    foreArmR.position.set(0, -0.38, 0.02);
    foreArmR.rotation.x = -0.25;
    foreArmR.castShadow = true;
    armR.add(foreArmR);

    const fistR = new THREE.Mesh(fistGeo, skinMat);
    fistR.position.set(0, -0.52, 0.06);
    armR.add(fistR);

    this.playerMesh.add(armR);
    this.armR = armR;

    // 4. LOWER BODY & LEGS (Pleated Dhoti & Desi Mojari Footwear)
    const pelvisGeo = new THREE.BoxGeometry(0.54, 0.34, 0.32);
    const pelvis = new THREE.Mesh(pelvisGeo, dhotiMat);
    pelvis.position.set(0, 0.52, 0);
    pelvis.castShadow = true;
    this.playerMesh.add(pelvis);

    // Kashta central pleat fold
    const kashtaGeo = new THREE.BoxGeometry(0.14, 0.36, 0.05);
    const kashta = new THREE.Mesh(kashtaGeo, dhotiMat);
    kashta.position.set(0, 0.48, -0.16);
    this.playerMesh.add(kashta);

    // Left Leg
    const legL = new THREE.Group();
    legL.position.set(-0.16, 0.44, 0);

    const thighL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.09, 0.32, 10),
      dhotiMat,
    );
    thighL.position.set(0, -0.16, 0);
    thighL.castShadow = true;
    legL.add(thighL);

    const calfL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.07, 0.26, 10),
      skinMat,
    );
    calfL.position.set(0, -0.36, 0);
    calfL.castShadow = true;
    legL.add(calfL);

    // Mojari Footwear L
    const shoeL = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.09, 0.24),
      shoesMat,
    );
    shoeL.position.set(0, -0.49, -0.04);
    shoeL.castShadow = true;
    legL.add(shoeL);

    // Upturned curled toe tip
    const toeL = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.09, 6),
      shoesMat,
    );
    toeL.position.set(0, -0.46, -0.16);
    toeL.rotation.x = -Math.PI / 3;
    legL.add(toeL);

    this.playerMesh.add(legL);
    this.legL = legL;

    // Right Leg
    const legR = new THREE.Group();
    legR.position.set(0.16, 0.44, 0);

    const thighR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.09, 0.32, 10),
      dhotiMat,
    );
    thighR.position.set(0, -0.16, 0);
    thighR.castShadow = true;
    legR.add(thighR);

    const calfR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.07, 0.26, 10),
      skinMat,
    );
    calfR.position.set(0, -0.36, 0);
    calfR.castShadow = true;
    legR.add(calfR);

    // Mojari Footwear R
    const shoeR = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.09, 0.24),
      shoesMat,
    );
    shoeR.position.set(0, -0.49, -0.04);
    shoeR.castShadow = true;
    legR.add(shoeR);

    // Upturned curled toe tip
    const toeR = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.09, 6),
      shoesMat,
    );
    toeR.position.set(0, -0.46, -0.16);
    toeR.rotation.x = -Math.PI / 3;
    legR.add(toeR);

    this.playerMesh.add(legR);
    this.legR = legR;
  }

  updatePlayerSkin() {
    this.rebuildPlayerMesh();
  }

  // ---------------- MITTI DUST PARTICLES ----------------
  initDust() {
    const dustGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0x9e7855,
      transparent: true,
      opacity: 0.6,
    });
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
        vz: 0,
      });
    }
  }

  spawnDustPuff(x, y, z) {
    const p = this.dustParticles.find((item) => item.life <= 0);
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
    this.dustParticles.forEach((p) => {
      if (p.life > 0) {
        p.life -= delta;
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        const progress = 1 - p.life / p.maxLife;
        const s = 1 + progress * 2.5;
        p.mesh.scale.set(s, s, s);
        p.mesh.material.opacity = Math.max(0, 0.6 * (1 - progress));
        if (p.life <= 0) p.mesh.visible = false;
      }
    });
  }

  // ---------------- CELEBRATION CONFETTI PARTICLES ----------------
  initConfetti() {
    this.confettiParticles = [];
    const colors = [0xffd700, 0xff5722, 0xe91e63, 0x00e5ff, 0xffeb3b, 0x76ff03];
    const geo = new THREE.PlaneGeometry(0.12, 0.12);
    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.confettiParticles.push({
        mesh,
        life: 0,
        maxLife: 1.4,
        vx: 0,
        vy: 0,
        vz: 0,
        rotSpeed: 0,
      });
    }
  }

  burstConfetti() {
    const px = this.playerGroup.position.x;
    const py = this.playerGroup.position.y + 1.4;
    const pz = this.playerGroup.position.z - 0.5;

    this.confettiParticles.forEach((p) => {
      p.mesh.position.set(
        px + (Math.random() - 0.5) * 1.2,
        py + (Math.random() - 0.5) * 0.8,
        pz + (Math.random() - 0.5) * 1.2,
      );
      p.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      p.mesh.visible = true;
      p.life = p.maxLife * (0.7 + Math.random() * 0.3);
      p.vx = (Math.random() - 0.5) * 5.0;
      p.vy = Math.random() * 4.5 + 2.5;
      p.vz = (Math.random() - 0.5) * 4.0;
      p.rotSpeed = (Math.random() - 0.5) * 12.0;
    });
  }

  updateConfetti(delta) {
    this.confettiParticles.forEach((p) => {
      if (p.life > 0) {
        p.life -= delta;
        p.vy -= 9.8 * delta; // Gravity
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        p.mesh.rotation.x += p.rotSpeed * delta;
        p.mesh.rotation.y += p.rotSpeed * 0.7 * delta;
        if (p.life <= 0) {
          p.mesh.visible = false;
        }
      }
    });
  }

  getLevelInfo(lvl) {
    if (lvl <= LEVELS.length) {
      return LEVELS[lvl - 1];
    }
    const base = LEVELS[LEVELS.length - 1];
    return {
      level: lvl,
      name: `Grand Bihar Tour Stage ${lvl - 5}`,
      shortName: `STAGE ${lvl}`,
      subtitle: "Ultimate Sprint Across Bihar",
      mapId: "tour",
      targetDistance: 3350 + (lvl - 6) * 850,
      coinReward: 250 + (lvl - 6) * 50,
    };
  }

  completeCurrentLevel() {
    const currentInfo = this.getLevelInfo(this.currentLevel);
    const reward = currentInfo.coinReward;

    // Coins reward
    this.coinsThisRun += reward;
    this.totalCoins += reward;
    this.saveData();

    // Sound fanfare & 3D Confetti burst
    this.audio.playLevelComplete();
    this.burstConfetti();

    // Advance Level
    this.currentLevel++;
    if (this.currentLevel > this.maxLevelReached) {
      this.maxLevelReached = this.currentLevel;
      this.saveData();
    }

    const nextInfo = this.getLevelInfo(this.currentLevel);
    this.levelStartDist = this.distance;
    const span = Math.max(400, nextInfo.targetDistance - currentInfo.targetDistance);
    this.levelTargetDist = this.distance + span;

    // Dynamic map change on level progression to match destination!
    if (nextInfo.mapId && nextInfo.mapId !== "tour") {
      this.currentBiome = nextInfo.mapId;
    }

    // Trigger Celebratory Banner
    this.triggerLevelCompleteAnnouncement(currentInfo, nextInfo, reward);
  }

  triggerLevelCompleteAnnouncement(completedInfo, nextInfo, reward) {
    const popup = document.getElementById("level-complete-announcement");
    const title = document.getElementById("level-popup-title");
    const rewardText = document.getElementById("level-popup-reward");
    const nextText = document.getElementById("level-popup-next");

    if (popup && title) {
      title.textContent = `LVL ${completedInfo.level} COMPLETE: ${completedInfo.shortName}`;
      if (rewardText) rewardText.textContent = `+ ₹ ${reward} BONUS COINS!`;
      if (nextText) nextText.textContent = `NEXT STOP: ${nextInfo.name.toUpperCase()}`;

      popup.classList.remove("hidden");
      popup.style.animation = "none";
      void popup.offsetHeight;
      popup.style.animation = "";
      setTimeout(() => {
        if (popup) popup.classList.add("hidden");
      }, 3200);
    }
  }

  // ---------------- TRACK & ENVIRONMENT ----------------
  initInitialTrack() {
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      const isSafe = i < 2;
      this.spawnChunk(isSafe);
    }
  }

  getBiomeForZ(z) {
    if (this.selectedMap && this.selectedMap !== "tour") {
      return this.selectedMap;
    }
    // Tour mode: rotates biomes every 350 meters (~10 chunks)
    const biomes = ["village", "bazaar", "railway", "highway"];
    const idx = Math.floor(Math.abs(z) / 350) % biomes.length;
    return biomes[idx];
  }

  spawnChunk(isSafe = false) {
    this.chunkSpawnCounter++;
    const biome = this.getBiomeForZ(this.nextChunkZ);
    const mapConfig = MAPS[biome] || MAPS.village;
    const isRailway =
      !isSafe &&
      (biome === "railway" ||
        (biome === "village" && this.chunkSpawnCounter % 6 === 0));

    const chunk = new THREE.Group();
    chunk.position.set(0, 0, this.nextChunkZ);

    // 1. Ground Mesh (Color adapts to map)
    const groundGeo = new THREE.BoxGeometry(26, 0.3, CHUNK_LENGTH);
    const groundMat = new THREE.MeshLambertMaterial({
      color: mapConfig.groundColor,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    chunk.add(ground);

    // 2. Road Surface Mesh (3 Lanes)
    const roadGeo = new THREE.BoxGeometry(8.2, 0.32, CHUNK_LENGTH);
    const roadMat = new THREE.MeshLambertMaterial({
      color: mapConfig.roadColor,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.y = -0.12;
    road.receiveShadow = true;
    chunk.add(road);

    // 3. Dashed Lane Dividers (White / Ochre / Yellow)
    const dashGeo = new THREE.BoxGeometry(0.12, 0.33, 2.0);
    const dashMat = new THREE.MeshBasicMaterial({
      color: mapConfig.dashColor,
      transparent: true,
      opacity: biome === "highway" ? 0.9 : 0.5,
    });
    for (let dz = -CHUNK_LENGTH / 2 + 1.5; dz < CHUNK_LENGTH / 2; dz += 4.5) {
      const dashL = new THREE.Mesh(dashGeo, dashMat);
      dashL.position.set(-1.25, -0.11, dz);
      const dashR = new THREE.Mesh(dashGeo, dashMat);
      dashR.position.set(1.25, -0.11, dz);
      chunk.add(dashL);
      chunk.add(dashR);
    }

    // 4. Road Shoulders / Curbs
    const shoulderGeo = new THREE.BoxGeometry(1.2, 0.33, CHUNK_LENGTH);
    const shoulderMat = new THREE.MeshLambertMaterial({
      color: mapConfig.shoulderColor,
    });
    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderL.position.set(-4.7, -0.12, 0);
    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderR.position.set(4.7, -0.12, 0);
    chunk.add(shoulderL);
    chunk.add(shoulderR);

    // 5. BIOME-SPECIFIC PROPS
    if (biome === "village") {
      this.createRoadsideTrees(chunk);
      if (Math.random() < 0.45) this.createVillageHut(chunk);
      if (Math.random() < 0.35) this.createMilestone(chunk);
      if (isRailway) this.createRailwayCrossing(chunk);
    } else if (biome === "bazaar") {
      this.createBazaarStalls(chunk);
      this.createBazaarGarlands(chunk);
      this.createMarketLanterns(chunk);
    } else if (biome === "railway") {
      this.createStationPlatform(chunk);
      this.createTrainCarriage(chunk);
      this.createSignalPole(chunk);
      if (Math.random() < 0.6) this.createRailwayCrossing(chunk);
    } else if (biome === "highway") {
      this.createHighwayLamps(chunk);
      this.createHighwayGuardrails(chunk);
      if (Math.random() < 0.35) this.createHighwaySign(chunk);
      if (Math.random() < 0.4) this.createHighwayDhaba(chunk);
      if (Math.random() < 0.35) this.createMilestone(chunk);
    }

    // Add obstacles and coins if not safe start chunk
    if (!isSafe) {
      this.populateChunkEntities(chunk);
    }

    this.scene.add(chunk);
    this.chunks.push(chunk);

    this.nextChunkZ -= CHUNK_LENGTH;
  }

  // ---------------- BAZAAR ENVIRONMENT PROPS ----------------
  createBazaarStalls(chunk) {
    [-5.6, 5.6].forEach((sideX) => {
      for (let dz = -CHUNK_LENGTH / 3; dz <= CHUNK_LENGTH / 3; dz += 14) {
        if (Math.random() < 0.85) {
          const stall = new THREE.Group();

          // Wooden table/counter
          const counterGeo = new THREE.BoxGeometry(2.4, 0.9, 3.2);
          const counterMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
          const counter = new THREE.Mesh(counterGeo, counterMat);
          counter.position.y = 0.45;
          stall.add(counter);

          // Stalls awning roof (striped colorful fabric)
          const awningGeo = new THREE.BoxGeometry(2.8, 0.12, 3.6);
          const colors = [0xff6f00, 0x0288d1, 0xd81b60, 0x388e3c, 0xfbc02d];
          const awningColor = colors[Math.floor(Math.random() * colors.length)];
          const awningMat = new THREE.MeshLambertMaterial({
            color: awningColor,
          });
          const awning = new THREE.Mesh(awningGeo, awningMat);
          awning.position.y = 2.4;
          awning.rotation.z = sideX > 0 ? 0.15 : -0.15;
          stall.add(awning);

          // 4 Corner Wooden Pillars
          const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6);
          const poleMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
          [
            [-1.1, -1.4],
            [1.1, -1.4],
            [-1.1, 1.4],
            [1.1, 1.4],
          ].forEach(([px, pz]) => {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(px, 1.2, pz);
            stall.add(pole);
          });

          // Crates of fruits/vegetables on counter
          const crateGeo = new THREE.BoxGeometry(0.7, 0.35, 0.8);
          const produceColors = [0xff9800, 0x4caf50, 0xffeb3b, 0xe53935];
          for (let c = -0.6; c <= 0.6; c += 0.6) {
            const cMat = new THREE.MeshLambertMaterial({
              color:
                produceColors[Math.floor(Math.random() * produceColors.length)],
            });
            const crate = new THREE.Mesh(crateGeo, cMat);
            crate.position.set(0, 1.05, c);
            stall.add(crate);
          }

          stall.position.set(sideX, 0, dz);
          chunk.add(stall);
        }
      }
    });
  }

  createBazaarGarlands(chunk) {
    for (let dz = -CHUNK_LENGTH / 3; dz <= CHUNK_LENGTH / 3; dz += 16) {
      const garlandGroup = new THREE.Group();
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
      const pL = new THREE.Mesh(poleGeo, poleMat);
      pL.position.set(-4.5, 2.1, 0);
      const pR = new THREE.Mesh(poleGeo, poleMat);
      pR.position.set(4.5, 2.1, 0);
      garlandGroup.add(pL);
      garlandGroup.add(pR);

      // Hanging Marigold Beads
      const flowerGeo = new THREE.SphereGeometry(0.14, 6, 6);
      const flowerMat1 = new THREE.MeshBasicMaterial({ color: 0xffb300 });
      const flowerMat2 = new THREE.MeshBasicMaterial({ color: 0xff6d00 });
      for (let x = -4.2; x <= 4.2; x += 0.5) {
        const drop = (1 - (x * x) / 20) * 0.65;
        const mat = Math.random() < 0.5 ? flowerMat1 : flowerMat2;
        const fl = new THREE.Mesh(flowerGeo, mat);
        fl.position.set(x, 3.8 - drop, 0);
        garlandGroup.add(fl);
      }

      garlandGroup.position.set(0, 0, dz);
      chunk.add(garlandGroup);
    }
  }

  createMarketLanterns(chunk) {
    [-4.6, 4.6].forEach((sideX) => {
      for (let dz = -CHUNK_LENGTH / 4; dz <= CHUNK_LENGTH / 4; dz += 15) {
        const lantern = new THREE.Group();
        const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 6);
        const postMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 1.4;
        lantern.add(post);

        const glowGeo = new THREE.BoxGeometry(0.35, 0.45, 0.35);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffecb3 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 2.7;
        lantern.add(glow);

        lantern.position.set(sideX, 0, dz);
        chunk.add(lantern);
      }
    });
  }

  // ---------------- RAILWAY ENVIRONMENT PROPS ----------------
  createStationPlatform(chunk) {
    const platGroup = new THREE.Group();
    const platGeo = new THREE.BoxGeometry(3.5, 0.65, CHUNK_LENGTH);
    const platMat = new THREE.MeshLambertMaterial({ color: 0x78909c });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(5.8, 0.2, 0);
    platform.receiveShadow = true;
    platGroup.add(platform);

    const edgeGeo = new THREE.BoxGeometry(0.18, 0.66, CHUNK_LENGTH);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xfdd835 });
    const edgeLine = new THREE.Mesh(edgeGeo, edgeMat);
    edgeLine.position.set(4.15, 0.21, 0);
    platGroup.add(edgeLine);

    // Signboard: "PATNA JN"
    const signGroup = new THREE.Group();
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-1.0, 1.1, 0);
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(1.0, 1.1, 0);
    signGroup.add(leg1);
    signGroup.add(leg2);

    const boardGeo = new THREE.BoxGeometry(2.6, 0.8, 0.08);
    const boardMat = new THREE.MeshLambertMaterial({ color: 0xfbc02d });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 2.0, 0);
    signGroup.add(board);

    const barGeo = new THREE.BoxGeometry(2.4, 0.35, 0.1);
    const barMat = new THREE.MeshLambertMaterial({ color: 0x0d47a1 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 2.0, 0);
    signGroup.add(bar);

    signGroup.position.set(6.2, 0, 0);
    platGroup.add(signGroup);

    chunk.add(platGroup);
  }

  createTrainCarriage(chunk) {
    const train = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(2.8, 2.8, 22);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.0;
    body.castShadow = true;
    train.add(body);

    const winBandGeo = new THREE.BoxGeometry(2.84, 0.8, 21.6);
    const winBandMat = new THREE.MeshLambertMaterial({ color: 0xfff9c4 });
    const winBand = new THREE.Mesh(winBandGeo, winBandMat);
    winBand.position.y = 2.2;
    train.add(winBand);

    const roofGeo = new THREE.CylinderGeometry(
      1.45,
      1.45,
      22,
      12,
      1,
      false,
      0,
      Math.PI,
    );
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.y = 3.3;
    train.add(roof);

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 10);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
    [-7, -5, 5, 7].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, 0.4, wz);
      train.add(w);
    });

    train.position.set(-6.5, 0, 0);
    chunk.add(train);
  }

  createSignalPole(chunk) {
    const signal = new THREE.Group();
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.14, 4.8, 8);
    const mastMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.4;
    signal.add(mast);

    const headGeo = new THREE.BoxGeometry(0.4, 1.2, 0.15);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 4.4, 0);
    signal.add(head);

    const lensGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
    const green = new THREE.Mesh(lensGeo, greenMat);
    green.position.set(0, 4.7, 0.1);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const red = new THREE.Mesh(lensGeo, redMat);
    red.position.set(0, 4.1, 0.1);
    signal.add(green);
    signal.add(red);

    signal.position.set(-4.5, 0, 8);
    chunk.add(signal);
  }

  // ---------------- HIGHWAY ENVIRONMENT PROPS ----------------
  createHighwayLamps(chunk) {
    [-5.4, 5.4].forEach((sideX) => {
      const lamp = new THREE.Group();
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 5.5, 8);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x78909c });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 2.75;
      lamp.add(pole);

      const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(sideX > 0 ? -0.7 : 0.7, 5.4, 0);
      arm.rotation.z = sideX > 0 ? 1.0 : -1.0;
      lamp.add(arm);

      const lightGeo = new THREE.BoxGeometry(0.4, 0.1, 0.5);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff9c4 });
      const lightHead = new THREE.Mesh(lightGeo, lightMat);
      lightHead.position.set(sideX > 0 ? -1.3 : 1.3, 5.3, 0);
      lamp.add(lightHead);

      lamp.position.set(sideX, 0, 0);
      chunk.add(lamp);
    });
  }

  createHighwayGuardrails(chunk) {
    [-4.5, 4.5].forEach((sideX) => {
      const railGeo = new THREE.BoxGeometry(0.12, 0.28, CHUNK_LENGTH);
      const railMat = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(sideX, 0.65, 0);
      chunk.add(rail);

      const postGeo = new THREE.BoxGeometry(0.12, 0.7, 0.12);
      const postMat = new THREE.MeshLambertMaterial({ color: 0x607d8b });
      for (let dz = -CHUNK_LENGTH / 2 + 1; dz < CHUNK_LENGTH / 2; dz += 4) {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(sideX, 0.35, dz);
        chunk.add(post);
      }
    });
  }

  createHighwaySign(chunk) {
    const gantry = new THREE.Group();
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.14, 5.5, 8);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x546e7a });
    const pL = new THREE.Mesh(pillarGeo, pillarMat);
    pL.position.set(-4.6, 2.75, 0);
    const pR = new THREE.Mesh(pillarGeo, pillarMat);
    pR.position.set(4.6, 2.75, 0);
    gantry.add(pL);
    gantry.add(pR);

    const trussGeo = new THREE.BoxGeometry(9.4, 0.2, 0.2);
    const truss = new THREE.Mesh(trussGeo, pillarMat);
    truss.position.set(0, 5.4, 0);
    gantry.add(truss);

    const boardGeo = new THREE.BoxGeometry(7.2, 1.4, 0.08);
    const boardMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 4.4, 0);
    gantry.add(board);

    const textBarGeo = new THREE.BoxGeometry(6.6, 0.4, 0.1);
    const textBarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textBar = new THREE.Mesh(textBarGeo, textBarMat);
    textBar.position.set(0, 4.4, 0);
    gantry.add(textBar);

    gantry.position.set(0, 0, 5);
    chunk.add(gantry);
  }

  createHighwayDhaba(chunk) {
    const dhaba = new THREE.Group();
    const side = Math.random() < 0.5 ? -1 : 1;

    const shedGeo = new THREE.BoxGeometry(4.2, 2.6, 5.5);
    const shedMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
    const shed = new THREE.Mesh(shedGeo, shedMat);
    shed.position.y = 1.3;
    dhaba.add(shed);

    const roofGeo = new THREE.BoxGeometry(4.6, 0.14, 5.8);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.7;
    roof.rotation.z = side > 0 ? -0.12 : 0.12;
    dhaba.add(roof);

    const signGeo = new THREE.BoxGeometry(3.2, 0.7, 0.1);
    const signMat = new THREE.MeshLambertMaterial({ color: 0xfbc02d });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 3.2, 0);
    dhaba.add(sign);

    const cotGeo = new THREE.BoxGeometry(1.6, 0.35, 1.0);
    const cotMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const cot = new THREE.Mesh(cotGeo, cotMat);
    cot.position.set(side > 0 ? -2.4 : 2.4, 0.18, 1.2);
    dhaba.add(cot);

    dhaba.position.set(side * 7.5, 0, -4);
    chunk.add(dhaba);
  }

  createRoadsideTrees(chunk) {
    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3.5, 8);
    const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
    const foliageGeo = new THREE.SphereGeometry(2.3, 10, 10);
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2e5c1e });

    [-6.5, 6.5].forEach((sideX) => {
      for (
        let zOffset = -CHUNK_LENGTH / 3;
        zOffset <= CHUNK_LENGTH / 3;
        zOffset += CHUNK_LENGTH / 1.8
      ) {
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
          tree.position.set(
            sideX + (Math.random() - 0.5) * 1.5,
            0,
            zOffset + (Math.random() - 0.5) * 4,
          );
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
    obstacleLanes.forEach((laneIdx) => {
      const laneX = LANES[laneIdx];
      const zOffset = (Math.random() - 0.5) * (CHUNK_LENGTH * 0.65);
      const obsType = Math.floor(Math.random() * 5); // 0: Tractor, 1: Auto, 2: Cycle, 3: Pothole, 4: Barrier

      let obsMesh = null;
      let obsData = {};

      switch (obsType) {
        case 0: // Tractor
          obsMesh = this.buildTractor();
          obsData = {
            type: "tractor",
            width: 1.8,
            height: 2.2,
            depth: 2.6,
            canJump: false,
            canSlide: false,
          };
          break;
        case 1: // Auto Rickshaw
          obsMesh = this.buildAutoRickshaw();
          obsData = {
            type: "auto",
            width: 1.5,
            height: 2.0,
            depth: 2.2,
            canJump: false,
            canSlide: false,
          };
          break;
        case 2: // Bicycle with milk cans
          obsMesh = this.buildBicycle();
          obsData = {
            type: "cycle",
            width: 0.9,
            height: 1.2,
            depth: 1.8,
            canJump: true,
            canSlide: false,
          };
          break;
        case 3: // Pothole
          obsMesh = this.buildPothole();
          obsData = {
            type: "pothole",
            width: 1.6,
            height: 0.3,
            depth: 1.6,
            canJump: true,
            canSlide: false,
          };
          break;
        case 4: // Bamboo Barrier
          obsMesh = this.buildBarrier();
          obsData = {
            type: "barrier",
            width: 2.1,
            height: 1.4,
            depth: 0.5,
            canJump: true,
            canSlide: true,
          };
          break;
      }

      if (obsMesh) {
        obsMesh.position.set(laneX, 0, zOffset);
        chunk.add(obsMesh);

        this.activeObstacles.push({
          mesh: obsMesh,
          chunk: chunk,
          laneX: laneX,
          ...obsData,
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
      const pTypes = ["magnet", "boost", "shield"];
      const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
      const pMesh = this.buildPowerupMesh(pType);
      pMesh.position.set(LANES[freeLane], 0.85, (Math.random() - 0.5) * 8);
      chunk.add(pMesh);
      this.activePowerups.push({
        mesh: pMesh,
        chunk: chunk,
        type: pType,
        collected: false,
      });
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
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0x81d4fa,
      transparent: true,
      opacity: 0.7,
    });
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
    const hubcapMat = new THREE.MeshStandardMaterial({
      color: 0xb0bec5,
      metalness: 0.8,
      roughness: 0.2,
    });

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
    const canMat = new THREE.MeshStandardMaterial({
      color: 0xdcdcdc,
      metalness: 0.8,
      roughness: 0.3,
    });
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
      emissiveIntensity: 0.4,
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    return coin;
  }

  buildPowerupMesh(type) {
    const group = new THREE.Group();
    let col = 0xff1744; // Magnet Red
    if (type === "boost") col = 0xff9100; // Boost Orange
    if (type === "shield") col = 0x00e5ff; // Shield Cyan

    const sphereGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const mat = new THREE.MeshLambertMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.5,
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }

  // ---------------- EVENT BINDINGS & CONTROLS ----------------
  bindEvents() {
    // Window Resize
    window.addEventListener("resize", () => {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Touch Swipe Detection for Android & Mobile devices
    window.addEventListener(
      "touchstart",
      (e) => {
        this.audio.init();
        if (this.state !== "PLAYING") return;
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
      },
      { passive: true },
    );

    window.addEventListener(
      "touchend",
      (e) => {
        if (this.state !== "PLAYING") return;
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
      },
      { passive: true },
    );

    // Keyboard Controls
    window.addEventListener("keydown", (e) => {
      this.audio.init();
      if (this.state !== "PLAYING") return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this.changeLane(-1);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this.changeLane(1);
      } else if (
        e.key === "ArrowUp" ||
        e.key === "w" ||
        e.key === "W" ||
        e.key === " "
      ) {
        this.jump();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        this.slide();
      }
    });

    // UI Buttons
    document.getElementById("btn-play").addEventListener("click", () => {
      this.audio.init();
      this.audio.playClick();
      this.startGame();
    });

    document.getElementById("btn-open-shop").addEventListener("click", () => {
      this.audio.init();
      this.audio.playClick();
      this.openShop();
    });

    document.getElementById("btn-close-shop").addEventListener("click", () => {
      this.audio.playClick();
      this.closeShop();
    });

    document
      .getElementById("btn-sound-toggle")
      .addEventListener("click", () => {
        this.audio.enabled = !this.audio.enabled;
        this.audio.playClick();
        this.saveData();
        this.updateMenuUI();
      });

    const menuMusicBtn = document.getElementById("btn-music-toggle");
    if (menuMusicBtn) {
      menuMusicBtn.addEventListener("click", () => {
        this.audio.playClick();
        this.audio.toggleMusic();
        this.saveData();
        this.updateMenuUI();
        this.refreshIcons();
      });
    }

    const hudMusicBtn = document.getElementById("btn-hud-music");
    if (hudMusicBtn) {
      hudMusicBtn.addEventListener("click", () => {
        this.audio.playClick();
        this.audio.toggleMusic();
        this.saveData();
        this.updateHUD();
        this.updateMenuUI();
        this.refreshIcons();
      });
    }

    document.getElementById("btn-pause").addEventListener("click", () => {
      this.audio.playClick();
      this.pauseGame();
    });

    document.getElementById("btn-resume").addEventListener("click", () => {
      this.audio.playClick();
      this.resumeGame();
    });

    document
      .getElementById("btn-restart-pause")
      .addEventListener("click", () => {
        this.audio.playClick();
        this.startGame();
      });

    document.getElementById("btn-menu-pause").addEventListener("click", () => {
      this.audio.playClick();
      this.returnToMenu();
    });

    document.getElementById("btn-retry").addEventListener("click", () => {
      this.audio.playClick();
      this.startGame();
    });

    document.getElementById("btn-over-shop").addEventListener("click", () => {
      this.audio.playClick();
      this.openShop();
    });

    const btnOverMaps = document.getElementById("btn-over-maps");
    if (btnOverMaps) {
      btnOverMaps.addEventListener("click", () => {
        this.audio.playClick();
        this.openMaps();
      });
    }

    const btnOpenMaps = document.getElementById("btn-open-maps");
    if (btnOpenMaps) {
      btnOpenMaps.addEventListener("click", () => {
        this.audio.playClick();
        this.openMaps();
      });
    }

    const btnCloseMaps = document.getElementById("btn-close-maps");
    if (btnCloseMaps) {
      btnCloseMaps.addEventListener("click", () => {
        this.audio.playClick();
        this.closeMaps();
      });
    }

    document.getElementById("btn-over-menu").addEventListener("click", () => {
      this.audio.playClick();
      this.returnToMenu();
    });

    // Shop Character Selection & Unlocking
    this.bindShopButtons();
    // Map Selection
    this.bindMapButtons();
  }

  openMaps() {
    this.audio.playClick();
    this.showScreen("maps-screen");
    this.refreshMapsUI();
  }

  closeMaps() {
    this.audio.playClick();
    this.showScreen("menu-screen");
    this.updateMenuUI();
  }

  bindMapButtons() {
    ["village", "bazaar", "railway", "highway", "tour"].forEach((mapId) => {
      const btn = document.getElementById(`btn-map-${mapId}`);
      if (btn) {
        btn.addEventListener("click", () => {
          this.audio.playClick();
          this.selectedMap = mapId;
          this.saveData();
          this.refreshMapsUI();
          this.updateMenuUI();
        });
      }
    });
  }

  refreshMapsUI() {
    const badge = document.getElementById("maps-active-badge");
    const activeInfo = MAPS[this.selectedMap] || MAPS.village;
    if (badge) badge.textContent = activeInfo.name.toUpperCase();

    ["village", "bazaar", "railway", "highway", "tour"].forEach((mapId) => {
      const card = document.getElementById(`map-card-${mapId}`);
      const btn = document.getElementById(`btn-map-${mapId}`);
      if (!card || !btn) return;
      if (this.selectedMap === mapId) {
        card.classList.add("active");
        btn.textContent = "ACTIVE";
        btn.className = "btn btn-sm btn-select active";
      } else {
        card.classList.remove("active");
        btn.textContent = "CHOOSE";
        btn.className = "btn btn-sm btn-secondary";
      }
    });
    this.refreshIcons();
  }

  bindShopButtons() {
    ["tabish", "akhil", "firoz"].forEach((charId) => {
      const btn = document.getElementById(`btn-char-${charId}`);
      if (btn) {
        btn.addEventListener("click", () => {
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
    this.state = "PLAYING";
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
    this.lastMilestoneLevel = 0;
    this.milestoneSurgeTimer = 0.0;
    this.runTime = 0.0;
    this.speedTier = 1;
    this.lastSpeedTier = 1;
    this.displaySpeed = BASE_SPEED * 3.6;

    // Destination Level Reset
    this.currentLevel = 1;
    this.levelStartDist = 0;
    const firstInfo = this.getLevelInfo(1);
    this.levelTargetDist = firstInfo.targetDistance;
    if (this.selectedMap !== "tour") {
      this.currentBiome = firstInfo.mapId || "village";
    }

    const surgePopup = document.getElementById("surge-announcement");
    if (surgePopup) surgePopup.classList.add("hidden");

    const pacePopup = document.getElementById("pace-announcement");
    if (pacePopup) pacePopup.classList.add("hidden");

    const lvlPopup = document.getElementById("level-complete-announcement");
    if (lvlPopup) lvlPopup.classList.add("hidden");

    // Reset player position
    this.playerGroup.position.set(0, 0, 0);

    // Clear old chunks
    this.chunks.forEach((chunk) => this.scene.remove(chunk));
    this.chunks = [];
    this.activeObstacles = [];
    this.activeCoins = [];
    this.activePowerups = [];
    this.nextChunkZ = 0;
    this.chunkSpawnCounter = 0;

    this.initInitialTrack();

    // Start background instrumental song
    this.audio.startBGM();

    // UI Updates
    this.showScreen("hud");

    // Show touch hint briefly for 3 seconds
    const hint = document.getElementById("touch-hint");
    if (hint) {
      hint.style.display = "flex";
      setTimeout(() => {
        hint.style.display = "none";
      }, 3200);
    }

    this.updateHUD();
  }

  showScreen(screenId) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((s) => {
      s.classList.remove("active");
      s.classList.add("hidden");
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove("hidden");
      target.classList.add("active");
    }
    this.refreshIcons();
  }

  refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  pauseGame() {
    if (this.state === "PLAYING") {
      this.state = "PAUSED";
      this.audio.stopBGM();
      document.getElementById("pause-screen").classList.remove("hidden");
      document.getElementById("pause-screen").classList.add("active");
    }
  }

  resumeGame() {
    if (this.state === "PAUSED") {
      this.state = "PLAYING";
      this.audio.startBGM();
      document.getElementById("pause-screen").classList.add("hidden");
      document.getElementById("pause-screen").classList.remove("active");
    }
  }

  gameOver() {
    this.state = "GAMEOVER";
    this.audio.stopBGM();
    this.audio.playCrash();

    // Update persistent stats
    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) this.highScore = this.score;
    this.totalCoins += this.coinsThisRun;
    if (this.currentLevel > this.maxLevelReached) {
      this.maxLevelReached = this.currentLevel;
    }
    this.saveData();

    // Game over UI
    document.getElementById("final-score").textContent = this.score;
    document.getElementById("final-distance").textContent =
      `${Math.floor(this.distance)} M`;
    document.getElementById("final-coins").textContent =
      `+ ₹ ${this.coinsThisRun}`;
    document.getElementById("final-best").textContent = this.highScore;

    const finalLevel = document.getElementById("final-level");
    if (finalLevel) finalLevel.textContent = `LVL ${this.currentLevel}`;

    const newRecordTag = document.getElementById("new-high-badge");
    if (isNewRecord && this.score > 0) newRecordTag.classList.remove("hidden");
    else newRecordTag.classList.add("hidden");

    this.showScreen("gameover-screen");
  }

  returnToMenu() {
    this.state = "MENU";
    this.audio.stopBGM();
    this.showScreen("menu-screen");
    this.updateMenuUI();
  }

  openShop() {
    this.state = "SHOP";
    this.showScreen("shop-screen");
    this.refreshShopUI();
  }

  closeShop() {
    this.returnToMenu();
  }

  // ---------------- UI UPDATES ----------------
  updateHUD() {
    document.getElementById("hud-score").textContent = this.score;
    const distText =
      this.distance >= 1000
        ? `${(this.distance / 1000).toFixed(2)} KM`
        : `${Math.floor(this.distance)} M`;
    document.getElementById("hud-distance").textContent = distText;
    document.getElementById("hud-coins").textContent = `₹ ${this.coinsThisRun}`;

    // Buffs
    const magFill = document.getElementById("buff-magnet-fill");
    const magItem = document.getElementById("buff-magnet");
    if (this.magnetTimer > 0) {
      magItem.classList.remove("hidden");
      magFill.style.width = `${(this.magnetTimer / 10) * 100}%`;
    } else {
      magItem.classList.add("hidden");
    }

    const boostFill = document.getElementById("buff-boost-fill");
    const boostItem = document.getElementById("buff-boost");
    if (this.boostTimer > 0) {
      boostItem.classList.remove("hidden");
      boostFill.style.width = `${(this.boostTimer / 6) * 100}%`;
    } else {
      boostItem.classList.add("hidden");
    }

    const shieldItem = document.getElementById("buff-shield");
    if (this.shieldActive) {
      shieldItem.classList.remove("hidden");
    } else {
      shieldItem.classList.add("hidden");
    }

    // 5,000 Milestone Speed Indicator
    const milestoneBuff = document.getElementById("buff-milestone");
    const milestoneText = document.getElementById("buff-milestone-text");
    if (milestoneBuff && milestoneText) {
      if (this.milestoneSurgeTimer > 0) {
        milestoneBuff.classList.remove("hidden");
        milestoneBuff.classList.add("surge-active");
        milestoneText.textContent = `⚡ 1.5x SURGE (${Math.ceil(this.milestoneSurgeTimer)}s)`;
      } else if (this.lastMilestoneLevel > 0) {
        milestoneBuff.classList.remove("hidden");
        milestoneBuff.classList.remove("surge-active");
        milestoneText.textContent = `⚡ SPEED 1.25x`;
      } else {
        milestoneBuff.classList.add("hidden");
      }
    }

    // Active Map Indicator
    const mapBadge = document.getElementById("hud-map-name");
    if (mapBadge) {
      const activeInfo = MAPS[this.currentBiome] || MAPS.village;
      mapBadge.textContent = activeInfo.shortName;
    }

    // Real-Time Speedometer (KM/H)
    const speedValue = document.getElementById("hud-speed-value");
    if (speedValue) {
      const kmh = Math.round(this.displaySpeed || BASE_SPEED * 3.6);
      speedValue.textContent = `${kmh} KM/H`;
    }

    // Level & Destination Travel Progress Bar
    const lvlBadge = document.getElementById("hud-level-value");
    if (lvlBadge) lvlBadge.textContent = `LVL ${this.currentLevel}`;

    const travelBadge = document.getElementById("travel-level-badge");
    if (travelBadge) travelBadge.textContent = `LVL ${this.currentLevel}`;

    const nextInfo = this.getLevelInfo(this.currentLevel);
    const destName = document.getElementById("travel-dest-name");
    if (destName) {
      destName.textContent = `DESTINATION: ${nextInfo.shortName}`;
    }

    const currentSpan = Math.max(1, this.levelTargetDist - this.levelStartDist);
    const distInLevel = Math.max(0, this.distance - this.levelStartDist);
    const pct = Math.min(
      100,
      Math.max(0, Math.floor((distInLevel / currentSpan) * 100)),
    );

    const pctVal = document.getElementById("travel-pct-val");
    if (pctVal) pctVal.textContent = `${pct}%`;

    const progFill = document.getElementById("travel-progress-fill");
    if (progFill) progFill.style.width = `${pct}%`;

    const runnerPin = document.getElementById("travel-runner-pin");
    if (runnerPin) runnerPin.style.left = `${pct}%`;

    // Music HUD button state
    const hudMusicBtn = document.getElementById("btn-hud-music");
    const hudMusicIcon = document.getElementById("hud-music-icon");
    if (hudMusicBtn && hudMusicIcon) {
      if (this.audio.musicEnabled) {
        hudMusicBtn.classList.remove("muted");
        hudMusicIcon.setAttribute("data-lucide", "music");
      } else {
        hudMusicBtn.classList.add("muted");
        hudMusicIcon.setAttribute("data-lucide", "music-2");
      }
    }
  }

  triggerSurgeAnnouncement(score) {
    const surgePopup = document.getElementById("surge-announcement");
    const surgeScore = document.getElementById("surge-milestone-text");
    if (surgePopup && surgeScore) {
      surgeScore.textContent = `${score.toLocaleString()} PTS!`;
      surgePopup.classList.remove("hidden");
      // Re-trigger CSS animation
      surgePopup.style.animation = "none";
      void surgePopup.offsetHeight;
      surgePopup.style.animation = "";
      setTimeout(() => {
        if (surgePopup) surgePopup.classList.add("hidden");
      }, 2800);
    }
  }

  triggerPaceAnnouncement(tier, kmh) {
    const pacePopup = document.getElementById("pace-announcement");
    const tierText = document.getElementById("pace-tier-text");
    const kmhText = document.getElementById("pace-kmh-text");
    if (pacePopup && tierText) {
      tierText.textContent = `SPEED TIER ${tier}`;
      if (kmhText) {
        kmhText.textContent = `${kmh} KM/H • RUNNING FASTER!`;
      }
      pacePopup.classList.remove("hidden");
      // Re-trigger CSS animation
      pacePopup.style.animation = "none";
      void pacePopup.offsetHeight;
      pacePopup.style.animation = "";
      setTimeout(() => {
        if (pacePopup) pacePopup.classList.add("hidden");
      }, 2800);
    }
  }

  updateMenuUI() {
    document.getElementById("menu-best-score").textContent = this.highScore;
    document.getElementById("menu-total-coins").textContent =
      `₹ ${this.totalCoins}`;
    document.getElementById("menu-active-char").textContent =
      CHARACTERS[this.selectedCharacter].name;

    const maxLvlText = document.getElementById("menu-max-level");
    if (maxLvlText) maxLvlText.textContent = `LVL ${this.maxLevelReached}`;

    const mapMenuText = document.getElementById("menu-active-map");
    if (mapMenuText) {
      const activeMap = MAPS[this.selectedMap] || MAPS.village;
      mapMenuText.textContent = activeMap.name.split(" ")[0];
    }

    const soundText = document.getElementById("sound-btn-text");
    const soundIcon = document.getElementById("menu-sound-icon");
    if (soundText)
      soundText.textContent = `SOUND: ${this.audio.enabled ? "ON" : "OFF"}`;
    if (soundIcon)
      soundIcon.setAttribute(
        "data-lucide",
        this.audio.enabled ? "volume-2" : "volume-x",
      );

    const musicText = document.getElementById("music-btn-text");
    const musicIcon = document.getElementById("menu-music-icon");
    if (musicText)
      musicText.textContent = `BGM: ${this.audio.musicEnabled ? "ON" : "OFF"}`;
    if (musicIcon)
      musicIcon.setAttribute(
        "data-lucide",
        this.audio.musicEnabled ? "music" : "music-2",
      );

    this.refreshIcons();
  }

  refreshShopUI() {
    document.getElementById("shop-coins-display").textContent =
      `₹ ${this.totalCoins}`;
    ["tabish", "akhil", "firoz"].forEach((charId) => {
      const card = document.getElementById(`card-${charId}`);
      const btn = document.getElementById(`btn-char-${charId}`);
      const info = CHARACTERS[charId];

      if (this.selectedCharacter === charId) {
        card.classList.add("selected");
        btn.textContent = "ACTIVE";
        btn.className = "btn btn-sm btn-select active";
      } else if (info.unlocked) {
        card.classList.remove("selected");
        btn.textContent = "CHOOSE";
        btn.className = "btn btn-sm btn-secondary";
      } else {
        card.classList.remove("selected");
        btn.textContent = `₹ ${info.cost}`;
        btn.className = "btn btn-sm btn-primary";
        if (this.totalCoins < info.cost) {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";
        } else {
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
        }
      }
    });
  }

  // ---------------- GAME TICK & PHYSICS ----------------
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === "PLAYING") {
      this.updatePhysics(delta);
      this.updateTrackAndChunks(delta);
      this.updateCollectibles(delta);
      this.updateDust(delta);
      this.updateConfetti(delta);
      this.updateHUD();
    }

    // Camera follow player
    if (this.playerGroup && this.camera) {
      this.camera.position.z = this.playerGroup.position.z + 6.2;
      this.camera.position.x +=
        (this.playerGroup.position.x * 0.65 - this.camera.position.x) * 0.1;
      this.camera.position.y +=
        (this.playerGroup.position.y * 0.5 + 3.6 - this.camera.position.y) *
        0.1;

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

    // Dynamic Sky & Fog transition matching active biome
    if (this.scene && this.scene.fog && this.currentBiome) {
      const activeMap = MAPS[this.currentBiome] || MAPS.village;
      this.targetSkyColor.setHex(activeMap.skyColor);
      this.targetFogColor.setHex(activeMap.fogColor);

      this.scene.background.lerp(this.targetSkyColor, delta * 2.0);
      this.scene.fog.color.lerp(this.targetFogColor, delta * 2.0);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updatePhysics(delta) {
    // 0. Update active biome based on player Z position
    this.currentBiome = this.getBiomeForZ(this.playerGroup.position.z);

    // Track active survival running time
    this.runTime += delta;

    // Check Destination Travel Progression (Level completion after travel target)
    if (this.distance >= this.levelTargetDist) {
      this.completeCurrentLevel();
    }

    // Periodic Speed Tier Escalation:
    // Every 15 seconds, speed increases to next Tier (+1.1 m/s base speed boost per tier)
    const newTier = Math.floor(this.runTime / 15.0) + 1;
    if (newTier > this.speedTier) {
      this.speedTier = newTier;
      this.audio.playPaceUp();
      const currentKmh = Math.round(this.displaySpeed || BASE_SPEED * 3.6);
      this.triggerPaceAnnouncement(this.speedTier, currentKmh);
    }

    // Dynamic BGM Instrumental Tempo (accelerates with speed & level)
    const targetTempo =
      118 +
      Math.min(32, (this.currentLevel - 1) * 4 + (this.speedTier - 1) * 2);
    this.audio.setBGMTempo(targetTempo);

    // 1. Milestone Surge Timer Countdown (from 5,000 score milestones)
    if (this.milestoneSurgeTimer > 0) {
      this.milestoneSurgeTimer -= delta;
      if (this.milestoneSurgeTimer < 0) this.milestoneSurgeTimer = 0;
    }

    // Speed Multiplier:
    // Every 5,000 score: speed surges to 1.5x for 10 seconds, then decreases and continues with 1.25x
    let milestoneMult = 1.0;
    if (this.milestoneSurgeTimer > 0) {
      milestoneMult = 1.5;
    } else if (this.lastMilestoneLevel > 0) {
      milestoneMult = 1.25;
    }

    const boostMult = this.boostTimer > 0 ? 1.6 : 1.0;
    // Level Speed Bonus (+1.5 m/s per level) + Time Tier Bonus
    const levelSpeedBonus = (this.currentLevel - 1) * 1.5;
    const tierBonus = (this.speedTier - 1) * 1.1;
    const basePace = Math.min(
      BASE_SPEED + levelSpeedBonus + tierBonus + SPEED_INCREMENT * this.runTime,
      MAX_SPEED + (this.currentLevel - 1) * 1.2,
    );
    this.currentSpeed = basePace;

    const speedMult = milestoneMult * boostMult;
    const effSpeed = this.currentSpeed * speedMult;
    this.displaySpeed = effSpeed * 3.6; // in km/h

    const forwardMovement = effSpeed * delta;
    this.playerGroup.position.z -= forwardMovement;
    this.distance += forwardMovement;
    this.score = Math.floor(this.distance) + this.coinsThisRun * 10;

    // Check for 5,000 score milestones (5,000, 10,000, 15,000, ...)
    const currentMilestone = Math.floor(this.score / 5000);
    if (currentMilestone > this.lastMilestoneLevel) {
      this.lastMilestoneLevel = currentMilestone;
      this.milestoneSurgeTimer = 10.0; // 10 seconds of 1.5x speed
      this.audio.playSurge();
      this.triggerSurgeAnnouncement(currentMilestone * 5000);
    }

    // 2. Smooth Lane Interpolation
    const curX = this.playerGroup.position.x;
    this.playerGroup.position.x +=
      (this.targetX - curX) * LANE_CHANGE_SPEED * delta;

    // 3. Jump Physics
    if (this.isJumping) {
      this.playerY += this.verticalVelocity * delta;
      this.verticalVelocity -= GRAVITY * delta;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.spawnDustPuff(
          this.playerGroup.position.x,
          0,
          this.playerGroup.position.z,
        );
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

    // 5. Visual Animations (Realistic Anatomical Running Gait, Dual-Arm Swing & Wind Flutter)
    if (this.playerMesh) {
      if (this.isSliding) {
        this.playerMesh.scale.set(1.05, 0.44, 1.25);
        this.playerMesh.position.y = 0.18;
        if (this.armL && this.armR) {
          this.armL.rotation.x = -1.35;
          this.armR.rotation.x = -1.35;
          this.armL.rotation.z = 0.2;
          this.armR.rotation.z = -0.2;
        }
        if (this.legL && this.legR) {
          this.legL.rotation.x = 1.1;
          this.legR.rotation.x = 1.1;
        }
        if (this.gamchhaTail) {
          this.gamchhaTail.rotation.x = 0.75;
        }
      } else if (this.isJumping) {
        this.playerMesh.scale.set(0.98, 1.08, 0.95);
        this.playerMesh.position.y = 0.0;
        if (this.armL && this.armR) {
          this.armL.rotation.x = -0.85;
          this.armR.rotation.x = -0.85;
          this.armL.rotation.z = 0.35;
          this.armR.rotation.z = -0.35;
        }
        if (this.legL && this.legR) {
          this.legL.rotation.x = -0.45;
          this.legR.rotation.x = 0.55;
        }
        if (this.gamchhaTail) {
          this.gamchhaTail.rotation.x = 0.65;
        }
      } else {
        // Dynamic Running Gait
        const runCycle = this.distance * 0.45;
        const bob = Math.abs(Math.sin(runCycle)) * 0.12;
        this.playerMesh.scale.set(1.0, 1.0, 1.0);
        this.playerMesh.position.y = bob;
        this.playerMesh.rotation.z = Math.sin(runCycle * 0.5) * 0.06;

        // Limbs & Counter-swing
        const legSwing = Math.sin(runCycle) * 0.8;
        if (this.legL && this.legR) {
          this.legL.rotation.x = legSwing;
          this.legR.rotation.x = -legSwing;
        }
        if (this.armL && this.armR) {
          this.armL.rotation.x = -legSwing * 0.85;
          this.armR.rotation.x = legSwing * 0.85;
          this.armL.rotation.z = 0.12 + Math.cos(runCycle) * 0.04;
          this.armR.rotation.z = -0.12 - Math.cos(runCycle) * 0.04;
        }

        // Gamchha wind fluttering in the breeze
        if (this.gamchhaTail) {
          this.gamchhaTail.rotation.x = 0.32 + Math.sin(runCycle * 2.2) * 0.28;
          this.gamchhaTail.rotation.z = Math.cos(runCycle * 1.5) * 0.1;
        }

        // Spawn dust while running on dirt
        if (Math.random() < 0.25) {
          this.spawnDustPuff(
            this.playerGroup.position.x,
            0,
            this.playerGroup.position.z,
          );
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

      if (dz < obs.depth * 0.45 + 0.3 && dx < obs.width * 0.42 + 0.3) {
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
        this.activeObstacles = this.activeObstacles.filter(
          (o) => o.chunk !== oldestChunk,
        );
        this.activeCoins = this.activeCoins.filter(
          (c) => c.chunk !== oldestChunk,
        );
        this.activePowerups = this.activePowerups.filter(
          (p) => p.chunk !== oldestChunk,
        );

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
    this.activeCoins.forEach((coin) => {
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
    this.activePowerups.forEach((p) => {
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

        if (p.type === "magnet") this.magnetTimer = 10.0;
        else if (p.type === "boost") this.boostTimer = 6.0;
        else if (p.type === "shield") this.shieldActive = true;
      }
    });
  }
}

// ---------------- BOOTSTRAP ----------------
function bootMittiRun() {
  if (window.mGame) return;
  try {
    window.mGame = new MittiRunGame();
    console.log("[MittiRun] Game engine initialized successfully.");
  } catch (err) {
    console.error("[MittiRun] Initialization failed:", err);
    const errDiv = document.createElement("div");
    errDiv.style.cssText =
      "position:fixed;bottom:12px;left:12px;right:12px;background:rgba(211,47,47,0.9);color:#fff;padding:12px;border-radius:8px;font-family:sans-serif;font-size:13px;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.5);";
    errDiv.innerHTML =
      "<strong>Mitti Run Error:</strong> " +
      (err && err.message ? err.message : String(err));
    document.body.appendChild(errDiv);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootMittiRun);
} else {
  bootMittiRun();
}
