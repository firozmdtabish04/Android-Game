# MITTI RUN — A Desi Endless Adventure 🌾🏃‍♂️
**Platform:** Android (Direct APK & Play Store ready)  
**Developer & Designer:** Tabish Firoz  
**Budget:** ₹0 Target using Free & Open Source Tools  

---

## 🌅 Overview & Concept
**MITTI RUN** is an Indian-themed 3D endless runner celebrating the rustic beauty, vibrant energy, and culture of Bihar's rural countryside, un-gated railway crossings, bustling bazaars, and highways.

Players sprint endlessly down a 3-lane dirt road during a serene golden sunset, dodging iconic local obstacles, leaping over mud puddles, sliding under bamboo barricades, collecting shining golden Rupee coins (₹), activating Desi power-ups, and unlocking regional avatars.

---

## 🎮 Core Gameplay Mechanics
- **3-Lane Running:** Responsive lane switching across Left (`-2.5m`), Center (`0m`), and Right (`+2.5m`).
- **Mobile Touch Swipes:**
  - **Swipe Left / Right:** Quick lane dodge
  - **Swipe Up:** High jump over potholes and bicycles
  - **Swipe Down:** Low slide / duck under bamboo barriers (also fast-falls if triggered mid-air)
- **Desktop Keyboard Controls:**
  - `A` / `D` or `Left` / `Right` Arrow: Change lane
  - `W` / `Space` / `Up` Arrow: Jump
  - `S` / `Down` Arrow: Slide / Duck
- **Adaptive Difficulty:** Runner speed increases smoothly over distance traveled, ramping up tension and reflexes!

---

## 🛺 The 5 Desi Obstacles
1. **Swaraj / Mahindra Tractor:** Red agricultural tractor with massive rear tires and exhaust pipe. Wide obstacle; requires lane switch.
2. **Bihar Auto Rickshaw:** Iconic yellow-and-green three-wheeler. Tall obstacle; requires lane switch.
3. **Village Atlas Bicycle:** Traditional black roadster cycle with two silver milk dabbas (cans) on the luggage carrier. Can be jumped over or dodged!
4. **Mitti Pothole / Mud Puddle:** Water-filled dirt ditch in the earthen road. Can be jumped over or dodged!
5. **Bamboo Barricade (Challi):** Traditional rural road barrier. Can be ducked under via slide or cleared with a high jump!

---

## 🚂 The Sunset Railway Crossing (Special Feature)
Directly inspired by the rural railway junction atmosphere (with the single-car diesel railcar and St. Andrew's cross railway crossing sign at golden hour), the track periodically spawns a scenic railway crossing segment where train tracks cross the road amidst glowing evening skies and lush roadside neem/banyan trees.

---

## ⚡ Collectibles & Power-Ups
- **🪙 Golden Rupee Coins (₹):** Shiny spinning gold coins that add to your bank and final score multiplier.
- **🧲 Coin Magnet (10s):** Magnetically pulls all nearby coins on all 3 lanes directly towards the runner.
- **🛡️ Suraksha Shield:** Grants one-time invulnerability. Absorbs any collision crash without ending the run!
- **⚡ Desi Speed Boost (6s):** Triggers supersonic sprint, blasting through any obstacle in your path!

---

## 🛍️ Character Shop (Local Save)
Earn Rupee coins during runs to unlock custom desi runners:
1. **Birju (The Village Sprinter):** Unlocked by default. Wears an earthen saffron kurta, white dhoti, and a waving red-checked gamchha scarf.
2. **Lallan (The Auto Rickshaw Rider):** Unlock for **₹150**. Wears green kurta and yellow dhoti.
3. **Champa (The Fast Runner):** Unlock for **₹300**. Wears vibrant pink and blue traditional attire.

---

## 📁 Repository Structure
```
d:/FullStack/UIUX/AndroidGame/
├── godot_project/             # Complete Godot 4.x 3D Game Project
│   ├── project.godot          # Mobile portrait, touch emulation, rendering config
│   ├── export_presets.cfg     # Pre-configured Android APK export preset
│   ├── icon.svg               # Vector game logo & banner
│   ├── scenes/
│   │   ├── main.tscn          # World environment, lighting, camera, UI
│   │   ├── player.tscn        # CharacterBody3D Birju model, dust fx, shield
│   │   ├── track_chunk.tscn   # Modular Bihar earthen road with trees
│   │   ├── railway_chunk.tscn # Sunset railway crossing with train & signs
│   │   ├── obstacles/         # Tractor, Auto, Cycle, Pothole, Barrier
│   │   ├── collectibles/      # Rupee Coin, Magnet, Shield, Boost
│   │   └── ui/                # HUD, Main Menu, Game Over, Character Shop
│   └── scripts/
│       ├── game_manager.gd    # Central state, speed ramp, power-ups, signals
│       ├── player.gd          # 3-lane physics, swipes, jump, slide, magnet pull
│       ├── track_spawner.gd   # Infinite chunk recycling & procedural generation
│       ├── audio_manager.gd   # Zero-dependency procedural WAV sound synthesizer
│       └── save_manager.gd    # user://mitti_run_save.json local persistence
│
├── web_playable/              # Instant Playable Three.js Web/Mobile Edition
│   ├── index.html             # Mobile-optimized viewport and HUD overlay
│   ├── style.css              # Desi sunset color palette, responsive layout
│   └── game.js                # Full 3D Three.js runner engine + Web Audio synth
│
└── android/                   # Native Android Studio / Gradle Project
    ├── app/
    │   ├── build.gradle       # SDK 34, Android 14+ support
    │   └── src/main/
    │       ├── AndroidManifest.xml # Fullscreen sticky immersive mode
    │       ├── java/.../MainActivity.java # Hardware accelerated WebGL WebView
    │       └── assets/        # Packaged game client files for APK
    ├── build.gradle
    └── settings.gradle
```

---

## 🚀 How to Run & Test

### 1. Instant Play in Browser or Mobile Phone (Zero Setup!)
A local HTTP server is running at:
```
http://localhost:5173
```
Open this link in any browser (Chrome, Edge, or on an Android phone on the same Wi-Fi) to immediately play **MITTI RUN** with 60 FPS 3D graphics, sound effects, touch swiping, shop, and local high score persistence!

### 2. Opening & Exporting in Godot 4
1. Open **Godot 4.3+**.
2. Click **Import** and select `d:/FullStack/UIUX/AndroidGame/godot_project/project.godot`.
3. Press **F5** to run and test immediately in the Godot engine.
4. To export the Android APK:
   - Go to **Project > Export**.
   - Select the pre-configured **Android APK** preset.
   - Click **Export Project** to generate `MittiRun.apk`.

### 3. Building the Android APK via Android Studio / Gradle
1. Open the `android/` folder in **Android Studio**.
2. Connect your Android phone with USB Debugging enabled, or select an Android Emulator.
3. Click **Run (Shift+F10)** or run `./gradlew assembleDebug` to build the APK.
