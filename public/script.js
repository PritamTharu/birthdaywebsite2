// State Management
const state = {
  appInitialized: false,
  isMuted: false,
  balloonClicks: 0,
  currentColorIndex: 0,
  balloonsInflatedCount: 0,
  maxBalloons: 15,
  currentBalloonShape: "classic",
  buntingsHungCount: 0,
  maxBuntings: 1,
  lightsAdded: false,
  lightsOn: false,
  cakePlaced: false,
  candlesAllLit: false
};

// Balloon Colors List
const balloonColors = [
  "#ff4081", // Accent Pink
  "#2196f3", // Blue
  "#4caf50", // Green
  "#ffeb3b", // Yellow
  "#ff9800", // Orange
  "#9c27b0", // Purple
  "#00e5ff", // Cyan
  "#e91e63"  // Deep Pink
];

// Web Audio API Synthesizer Engine
let audioCtx = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSynthNote(freq, type, duration, volume) {
  if (!audioCtx || state.isMuted) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playSuccessChime() {
  initAudio();
  if (state.isMuted) return;
  playSynthNote(523.25, 'sine', 0.25, 0.1); // C5
  setTimeout(() => playSynthNote(659.25, 'sine', 0.25, 0.1), 80); // E5
  setTimeout(() => playSynthNote(783.99, 'sine', 0.3, 0.15), 160); // G5
  setTimeout(() => playSynthNote(1046.50, 'sine', 0.5, 0.2), 240); // C6
}

function playUnlockSound() {
  initAudio();
  if (state.isMuted) return;
  playSynthNote(150, 'triangle', 0.05, 0.2);
  setTimeout(() => playSynthNote(220, 'triangle', 0.08, 0.15), 60);
}

function playPumpSound() {
  initAudio();
  if (!audioCtx || state.isMuted) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  try {
    // 1. Mechanical Handle squeak
    const osc = audioCtx.createOscillator();
    const squeakGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.06);
    osc.frequency.linearRampToValueAtTime(250, now + 0.12);

    squeakGain.gain.setValueAtTime(0.02, now);
    squeakGain.gain.linearRampToValueAtTime(0.04, now + 0.04);
    squeakGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(squeakGain);
    squeakGain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // 2. Air / Gas puff (White Noise + Bandpass Filter)
    const bufferSize = audioCtx.sampleRate * 0.35; // 0.35 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(1000, now);
    filterNode.frequency.exponentialRampToValueAtTime(350, now + 0.35);
    filterNode.Q.setValueAtTime(4, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noiseNode.connect(filterNode);
    filterNode.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 0.35);
  } catch (e) {
    console.error("Error playing pump sound:", e);
  }
}

function playBalloonRiseSound() {
  initAudio();
  if (!audioCtx || state.isMuted) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const duration = 1.6;

  try {
    // 1. Rising pitch oscillator
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + duration * 0.7);
    osc.frequency.linearRampToValueAtTime(520, now + duration);

    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.05, now + 0.3);
    oscGain.gain.linearRampToValueAtTime(0.05, now + duration * 0.5);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);

    // 2. Air friction whoosh (White Noise + swept bandpass)
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(250, now);
    filterNode.frequency.exponentialRampToValueAtTime(750, now + duration * 0.8);
    filterNode.Q.setValueAtTime(2.5, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.4);
    noiseGain.gain.linearRampToValueAtTime(0.04, now + duration * 0.6);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseNode.connect(filterNode);
    filterNode.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);

  } catch (e) {
    console.error("Error playing balloon rise sound:", e);
  }
}

function playBounceSound() {
  initAudio();
  if (!audioCtx || state.isMuted) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    console.error(e);
  }
}

// Ambient Background Floating Particles
function createAmbientParticles() {
  const container = document.getElementById("ambient-particles");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 5 + 2;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}vw`;
    p.style.animationDuration = `${Math.random() * 6 + 6}s`;
    p.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(p);
  }
}

// PULL CORD & THEATER CURTAIN OPENING LOGIC
const cord = document.getElementById("light-cord");
const handle = document.getElementById("cord-handle");
const curtainsWrapper = document.getElementById("curtains-wrapper");
const darkOverlay = document.getElementById("dark-room-overlay");

let isDragging = false;
let startY = 0;
const dragLimit = 80;

handle.addEventListener("mousedown", dragStart);
handle.addEventListener("touchstart", dragStart, { passive: true });

function dragStart(e) {
  initAudio();
  isDragging = true;
  startY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  cord.style.transition = "none";
}

window.addEventListener("mousemove", dragMove);
window.addEventListener("touchmove", dragMove, { passive: false });

function dragMove(e) {
  if (!isDragging) return;

  const currentY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  const deltaY = currentY - startY;

  if (deltaY > 0 && deltaY < dragLimit) {
    cord.style.transform = `translateY(${deltaY}px)`;
    // Pull hum sound
    playSynthNote(120 + deltaY, 'sine', 0.05, 0.02);
  }

  if (deltaY >= dragLimit - 10) {
    triggerGrandCurtainsReveal();
    dragEnd();
  }
}

window.addEventListener("mouseup", dragEnd);
window.addEventListener("touchend", dragEnd);

function dragEnd() {
  if (!isDragging) return;
  isDragging = false;
  cord.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.5)";
  cord.style.transform = "translateY(0px)";
}

// Grand Curtain Opening & Party Reveal
function triggerGrandCurtainsReveal() {
  if (state.appInitialized) return;
  state.appInitialized = true;

  // 1. Play click and fanfare sound
  playUnlockSound();
  setTimeout(() => playSuccessChime(), 180);

  // 2. Open the Red-Brown Curtains from between!
  if (curtainsWrapper) {
    curtainsWrapper.classList.add("curtains-open");
  }

  // 3. Fade out the welcome switch overlay
  if (darkOverlay) {
    darkOverlay.classList.add("hidden");
  }

  // 4. Reveal the Main App Container smoothly
  const appContainer = document.getElementById("app-container");
  if (appContainer) {
    appContainer.classList.remove("hidden");
    setTimeout(() => {
      appContainer.classList.add("show-app");
    }, 400);
  }

  // 5. Initialize Atmosphere
  createAmbientParticles();

  // Initial color for the pump nozzle balloon
  updateNozzleBalloonColor();
}

// BALLOON PUMP LOGIC
const pumpContainer = document.getElementById("pump-visual-container");
const nozzleBalloon = document.getElementById("pump-balloon");
const pumpBtn = document.getElementById("pump-btn");

if (pumpContainer) {
  pumpContainer.addEventListener("click", performPumpAction);
}
if (pumpBtn) {
  pumpBtn.addEventListener("click", performPumpAction);
}

function updateNozzleBalloonColor() {
  if (!nozzleBalloon) return;
  const nextColor = balloonColors[state.currentColorIndex];
  nozzleBalloon.style.color = nextColor; // Sets color for child elements

  // Decide shape: 50% chance classic, 50% chance heart
  state.currentBalloonShape = Math.random() < 0.5 ? "heart" : "classic";

  const shapeInner = document.getElementById("pump-balloon-shape");
  if (shapeInner) {
    shapeInner.className = `balloon-shape-inner ${state.currentBalloonShape}`;
  }
}

function performPumpAction() {
  if (!state.appInitialized) return;
  if (state.balloonsInflatedCount >= state.maxBalloons) return;

  // 1. Animate Pump Handle Press Down
  if (pumpContainer) {
    pumpContainer.classList.add("pump-active");
    setTimeout(() => {
      pumpContainer.classList.remove("pump-active");
    }, 100);
  }

  // 2. Play Pump sound
  playPumpSound();

  // 3. Update Clicks & Inflation
  state.balloonClicks++;

  if (state.balloonClicks === 1) {
    nozzleBalloon.style.transform = "scale(0.7)";
  } else if (state.balloonClicks === 2) {
    nozzleBalloon.style.transform = "scale(1.1)";
  } else if (state.balloonClicks === 3) {
    // Balloon is full!
    nozzleBalloon.style.transform = "scale(1.5)";

    // Release balloon and float up
    setTimeout(releaseBalloonAndFloat, 200);
  }
}

function releaseBalloonAndFloat() {
  if (!nozzleBalloon) return;

  // Calculate nozzle balloon rect for starting coordinates
  const rect = nozzleBalloon.getBoundingClientRect();
  const startX = rect.left;
  const startY = rect.top;

  const balloonColor = balloonColors[state.currentColorIndex];

  // Create a new floating balloon element in the body
  const decContainer = document.getElementById("decorations-container") || document.body;

  const wrapper = document.createElement("div");
  wrapper.className = "balloon-wrapper";
  wrapper.style.left = `${startX}px`;
  wrapper.style.top = `${startY}px`;
  wrapper.style.color = balloonColor; // propagate color to children

  // Set random sway animation delay
  wrapper.style.animationDelay = `${Math.random() * -4}s`;

  // Create an inner wrapper for the bounce animation
  const innerNode = document.createElement("div");
  innerNode.className = "balloon-inner";
  innerNode.style.pointerEvents = "auto";
  innerNode.style.cursor = "pointer";

  const balloon = document.createElement("div");
  balloon.className = `balloon ${state.currentBalloonShape}`;

  // If heart shaped, append the wrapper knot to innerNode
  if (state.currentBalloonShape === "heart") {
    const knot = document.createElement("div");
    knot.className = "balloon-knot";
    innerNode.appendChild(knot);
  }

  const stringNode = document.createElement("div");
  stringNode.className = "balloon-string";

  balloon.appendChild(stringNode);
  innerNode.appendChild(balloon);
  wrapper.appendChild(innerNode);
  decContainer.appendChild(wrapper);

  // Add interactive click bounce behavior with randomized, uneven physics
  innerNode.addEventListener("click", () => {
    if (innerNode.classList.contains("bounce")) return;

    // Randomize bounce physics variables
    const height = Math.random() * -25 - 20; // -20px to -45px
    const dip = Math.random() * 8 + 6;      // 6px to 14px
    const rebound = Math.random() * -6 - 4;  // -4px to -10px
    const tilt = Math.random() * 24 - 12;    // -12deg to 12deg
    const tiltOpp = tilt * -0.5;
    const dur = Math.random() * 0.35 + 0.45; // 0.45s to 0.8s

    innerNode.style.setProperty("--bounce-height", `${height}px`);
    innerNode.style.setProperty("--bounce-dip", `${dip}px`);
    innerNode.style.setProperty("--bounce-rebound", `${rebound}px`);
    innerNode.style.setProperty("--bounce-tilt", `${tilt}deg`);
    innerNode.style.setProperty("--bounce-tilt-opp", `${tiltOpp}deg`);
    innerNode.style.setProperty("--bounce-dur", `${dur}s`);

    // Random squish/stretch values
    const squishX = Math.random() * 0.15 + 0.75; // 0.75 to 0.9
    const stretchY = 2 - squishX;
    innerNode.style.setProperty("--scale-x-squish", squishX);
    innerNode.style.setProperty("--scale-y-stretch", stretchY);

    const stretchX = Math.random() * 0.15 + 1.1; // 1.1 to 1.25
    const squishY = 2 - stretchX;
    innerNode.style.setProperty("--scale-x-stretch", stretchX);
    innerNode.style.setProperty("--scale-y-squish", squishY);

    innerNode.classList.add("bounce");
    playBounceSound();

    setTimeout(() => {
      innerNode.classList.remove("bounce");
    }, dur * 1000);
  });

  // Increment balloon count
  state.balloonsInflatedCount++;

  // Update description text when completed
  if (state.balloonsInflatedCount >= state.maxBalloons) {
    const descElem = document.getElementById("decorator-desc");
    if (descElem) {
      descElem.innerText = "Completed! 🎈";
    }

    // Hide nozzle balloon and disable interactions
    if (nozzleBalloon) nozzleBalloon.style.display = "none";
    if (pumpContainer) pumpContainer.style.pointerEvents = "none";
    if (pumpBtn) {
      pumpBtn.disabled = true;
      pumpBtn.innerText = "Completed! 🎈";
    }

    // Smoothly transition from Stage 1 (Balloon) to Stage 2 (Bunting)
    setTimeout(() => {
      const balloonStage = document.getElementById("balloon-stage");
      if (balloonStage) {
        balloonStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        balloonStage.style.opacity = "0";
        balloonStage.style.transform = "translateY(20px)";
        setTimeout(() => {
          balloonStage.classList.add("hidden");

          // Show Bunting Stage
          const buntingStage = document.getElementById("bunting-stage");
          if (buntingStage) {
            buntingStage.classList.remove("hidden");
            buntingStage.style.opacity = "0";
            buntingStage.style.transform = "translateY(20px)";
            buntingStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
            // Force reflow
            buntingStage.offsetHeight;
            buntingStage.style.opacity = "1";
            buntingStage.style.transform = "translateY(0)";
          }
        }, 800);
      }
    }, 1500);
  }

  // Reset the nozzle balloon scale and cycle color if not yet finished
  state.balloonClicks = 0;
  state.currentColorIndex = (state.currentColorIndex + 1) % balloonColors.length;
  if (state.balloonsInflatedCount < state.maxBalloons) {
    nozzleBalloon.style.transform = "scale(0.35)";
    updateNozzleBalloonColor();
  }

  // Force a browser reflow to register initial coordinates before transitioning
  wrapper.offsetHeight;

  // Calculate random target ceiling coordinates
  const targetX = Math.random() * 80 + 10; // 10vw to 90vw
  const targetY = Math.random() * 10 + 3;  // 3vh to 13vh (higher up to avoid bunting)

  // Glide the balloon up to its floating spot
  wrapper.style.left = `${targetX}vw`;
  wrapper.style.top = `${targetY}vh`;

  // Play balloon rising whoosh sound
  playBalloonRiseSound();
}

// BUNTING DECORATOR LOGIC
const buntingBtn = document.getElementById("bunting-btn");
if (buntingBtn) {
  buntingBtn.addEventListener("click", triggerBuntingDecorations);
}

function triggerBuntingDecorations() {
  if (!state.appInitialized) return;
  if (state.buntingsHungCount >= state.maxBuntings) return;

  // Play sound effect
  playUnlockSound();

  // Create new bunting banner wrapper
  const decContainer = document.getElementById("decorations-container") || document.body;
  const wrapper = document.createElement("div");
  wrapper.className = "bunting-banner-wrapper";
  wrapper.style.top = "90vh"; // Spawn at the bottom

  const stringNode = document.createElement("div");
  stringNode.className = "bunting-string";

  // Spawn 14 flags in a straight flex row
  const numFlags = 14;
  for (let i = 0; i < numFlags; i++) {
    const flag = document.createElement("div");
    flag.className = "bunting-flag";

    // Assign random color from balloon colors
    const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    flag.style.color = color;

    // Slightly randomize sway animation delay
    flag.style.animationDelay = `${Math.random() * -2}s`;

    stringNode.appendChild(flag);
  }

  wrapper.appendChild(stringNode);
  document.body.appendChild(wrapper);

  // Increment count
  state.buntingsHungCount++;

  // Force a browser reflow
  wrapper.offsetHeight;

  // Set the target height overlapping the curtains and valance (15px)
  wrapper.style.top = "15px";

  // Update button text / state
  const buntingDesc = document.getElementById("bunting-desc");
  if (buntingBtn) {
    if (state.buntingsHungCount >= state.maxBuntings) {
      buntingBtn.disabled = true;
      buntingBtn.innerText = "Completed! 🎊";
      if (buntingDesc) {
        buntingDesc.innerText = "Completed! Bunting banner hung! 🎊";
      }

      // Fade out bunting card section and transition to Lights Stage
      setTimeout(() => {
        const buntingStage = document.getElementById("bunting-stage");
        if (buntingStage) {
          buntingStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
          buntingStage.style.opacity = "0";
          buntingStage.style.transform = "translateY(20px)";
          setTimeout(() => {
            buntingStage.classList.add("hidden");

            // Show Lights Stage
            const lightsStage = document.getElementById("lights-stage");
            if (lightsStage) {
              lightsStage.classList.remove("hidden");
              lightsStage.style.opacity = "0";
              lightsStage.style.transform = "translateY(20px)";
              lightsStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
              // Force reflow
              lightsStage.offsetHeight;
              lightsStage.style.opacity = "1";
              lightsStage.style.transform = "translateY(0)";
            }
          }, 800);
        }
      }, 1500);
    }
  }

  // Play success chime after a short delay
  setTimeout(() => {
    playSuccessChime();
  }, 400);
}

// ============================================================
//  STAGE 3: FAIRY LIGHTS DECORATOR LOGIC
// ============================================================

const hangLightsBtn = document.getElementById("hang-lights-btn");
const turnOnLightsBtn = document.getElementById("turn-on-lights-btn");

if (hangLightsBtn) {
  hangLightsBtn.addEventListener("click", hangFairyLights);
}
if (turnOnLightsBtn) {
  turnOnLightsBtn.addEventListener("click", turnOnFairyLightsAction);
}

// Step 1: Hang the lights (off / dark state)
function hangFairyLights() {
  if (!state.appInitialized) return;
  if (state.lightsAdded) return;
  state.lightsAdded = true;

  // Play hanging sound
  playUnlockSound();

  // Create the light structure in the DOM (all bulbs are OFF by default via CSS)
  createFairyLightsStructure();

  // Update UI: hide hang button, show turn-on button
  hangLightsBtn.disabled = true;
  hangLightsBtn.classList.add("hidden");

  // Update description
  const lightsDesc = document.getElementById("lights-desc");
  if (lightsDesc) {
    lightsDesc.innerText = "Lights are hung! Now let's turn them on! 💡";
  }

  // Show the turn-on button after a brief delay
  setTimeout(() => {
    turnOnLightsBtn.classList.remove("hidden");
    turnOnLightsBtn.style.opacity = "0";
    turnOnLightsBtn.style.transition = "opacity 0.5s ease";
    turnOnLightsBtn.offsetHeight; // force reflow
    turnOnLightsBtn.style.opacity = "1";
  }, 800);
}

// Step 2: Turn the lights on one by one
function turnOnFairyLightsAction() {
  if (!state.appInitialized) return;
  if (state.lightsOn) return;
  state.lightsOn = true;

  // Play switch click
  playUnlockSound();

  // Disable button immediately
  turnOnLightsBtn.disabled = true;
  turnOnLightsBtn.innerText = "Turning on... ⚡";

  // Begin sequential turn-on
  setTimeout(() => {
    turnOnLightsSequentially();
  }, 300);
}

function createFairyLightsStructure() {
  const container = document.getElementById("fairy-lights-container");
  if (!container) return;
  container.innerHTML = "";
  container.classList.remove("hidden");

  // --- Create vertical cascading strings on left and right sides ---
  const isMobile = window.innerWidth <= 600;
  const numStringsPerSide = isMobile ? 3 : 6;
  const bulbsPerString = isMobile ? 12 : 18;
  const viewportWidth = window.innerWidth;

  for (let side = 0; side < 2; side++) {
    for (let s = 0; s < numStringsPerSide; s++) {
      const stringEl = document.createElement("div");
      stringEl.className = "fairy-string";

      // Position: left side strings on left 15%, right side on right 15%
      let xPos;
      if (side === 0) {
        // Left side: spread from 3% to 15%
        xPos = 3 + (s * 12 / (numStringsPerSide - 1));
      } else {
        // Right side: spread from 85% to 97%
        xPos = 85 + (s * 12 / (numStringsPerSide - 1));
      }
      stringEl.style.left = `${xPos}%`;

      // Vary the string length slightly
      const heightPercent = 70 + Math.random() * 25; // 70% to 95% of viewport
      stringEl.style.height = `${heightPercent}vh`;

      for (let b = 0; b < bulbsPerString; b++) {
        // Wire segment before each bulb
        const wire = document.createElement("div");
        wire.className = "wire-segment";
        const wireH = 18 + Math.random() * 16; // 18px to 34px
        wire.style.setProperty("--wire-h", `${wireH}px`);
        stringEl.appendChild(wire);

        // The bulb itself
        const bulb = document.createElement("div");
        bulb.className = "fairy-bulb";
        bulb.style.setProperty("--twinkle-delay", `${Math.random() * 3}s`);
        stringEl.appendChild(bulb);
      }

      container.appendChild(stringEl);
    }
  }

  // --- Create horizontal top wire ---
  const topWire = document.createElement("div");
  topWire.className = "fairy-top-wire";
  topWire.id = "fairy-top-wire";
  document.body.appendChild(topWire);

  // --- Create horizontal row of bulbs along the top ---
  const horizRow = document.createElement("div");
  horizRow.className = "fairy-horizontal-row";
  horizRow.id = "fairy-horizontal-row";

  const numHorizBulbs = 40;
  for (let i = 0; i < numHorizBulbs; i++) {
    const bulb = document.createElement("div");
    bulb.className = "fairy-bulb";
    bulb.style.setProperty("--twinkle-delay", `${Math.random() * 3}s`);
    horizRow.appendChild(bulb);
  }
  document.body.appendChild(horizRow);

  // Force reflow so the browser registers the initial bottom positions
  container.offsetHeight;
  topWire.offsetHeight;
  horizRow.offsetHeight;

  // Now animate everything upward to final positions
  // Vertical strings slide up to top: 0
  const allStrings = container.querySelectorAll(".fairy-string");
  allStrings.forEach((s, i) => {
    // Stagger each string slightly for a wave effect
    setTimeout(() => {
      s.style.top = "0";
    }, i * 80);
  });

  // Horizontal wire and row slide up to just below valance
  setTimeout(() => {
    topWire.style.top = "60px";
    horizRow.style.top = "56px";
  }, 200);
}

function turnOnLightsSequentially() {
  // Gather all bulbs: horizontal first, then vertical strings top-to-bottom
  const allBulbs = [];

  // Horizontal row bulbs
  const horizRow = document.getElementById("fairy-horizontal-row");
  if (horizRow) {
    const hBulbs = horizRow.querySelectorAll(".fairy-bulb");
    // Light from center outward
    const mid = Math.floor(hBulbs.length / 2);
    for (let offset = 0; offset <= mid; offset++) {
      if (mid + offset < hBulbs.length) allBulbs.push(hBulbs[mid + offset]);
      if (mid - offset >= 0 && offset !== 0) allBulbs.push(hBulbs[mid - offset]);
    }
  }

  // Vertical strings — collect all bulbs, interleave strings so lights cascade downward
  const strings = document.querySelectorAll(".fairy-string");
  const maxBulbs = 18;
  for (let row = 0; row < maxBulbs; row++) {
    strings.forEach(s => {
      const bulbs = s.querySelectorAll(".fairy-bulb");
      if (row < bulbs.length) {
        allBulbs.push(bulbs[row]);
      }
    });
  }

  // Turn on each bulb with a staggered delay
  const delayPerBulb = 25; // milliseconds between each bulb
  allBulbs.forEach((bulb, index) => {
    setTimeout(() => {
      bulb.classList.add("bulb-on");

      // Play a very subtle tick sound for every 8th bulb
      if (index % 8 === 0) {
        playSynthNote(800 + index * 2, 'sine', 0.04, 0.03);
      }
    }, index * delayPerBulb);
  });

  // After all bulbs are on, add twinkling + light up wires
  const totalTime = allBulbs.length * delayPerBulb;
  setTimeout(() => {
    // Add twinkle to all lit bulbs
    document.querySelectorAll(".fairy-bulb.bulb-on").forEach(b => {
      b.classList.add("twinkle");
    });

    // Light up vertical string wires
    document.querySelectorAll(".fairy-string").forEach(s => {
      s.classList.add("string-on");
    });

    // Light up horizontal wire
    const topWire = document.getElementById("fairy-top-wire");
    if (topWire) topWire.classList.add("wire-lit");

    // Play a success chime
    playSuccessChime();

    // Update description and button
    const lightsDesc = document.getElementById("lights-desc");
    if (lightsDesc) {
      lightsDesc.innerText = "The room is glowing beautifully! ✨💡";
    }
    const turnOnBtn = document.getElementById("turn-on-lights-btn");
    if (turnOnBtn) {
      turnOnBtn.disabled = true;
      turnOnBtn.innerText = "Completed! ✨";
    }

    // Light up preview bulbs too
    document.querySelectorAll(".preview-bulb").forEach(b => b.classList.add("lit"));

    // After a pause, fade out the lights stage card and show Neon Stage
    setTimeout(() => {
      const lightsStage = document.getElementById("lights-stage");
      if (lightsStage) {
        lightsStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        lightsStage.style.opacity = "0";
        lightsStage.style.transform = "translateY(20px)";
        setTimeout(() => {
          lightsStage.classList.add("hidden");

          // Show Neon Stage
          const neonStage = document.getElementById("neon-stage");
          if (neonStage) {
            neonStage.classList.remove("hidden");
            neonStage.style.opacity = "0";
            neonStage.style.transform = "translateY(20px)";
            neonStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
            neonStage.offsetHeight;
            neonStage.style.opacity = "1";
            neonStage.style.transform = "translateY(0)";
          }
        }, 800);
      }
    }, 2500);
  }, totalTime + 300);
}

// ============================================================
//  STAGE 4: NEON BACKGROUND SIGN DECORATOR LOGIC
// ============================================================

const neonBtn = document.getElementById("neon-btn");
if (neonBtn) {
  neonBtn.addEventListener("click", triggerNeonSign);
}

function triggerNeonSign() {
  if (!state.appInitialized) return;

  // Scatter middle balloons to make room for neon sign
  scatterBalloons();

  // Play switch sound
  playUnlockSound();

  // Show the neon sign layer
  const neonLayer = document.getElementById("neon-sign-layer");
  if (neonLayer) {
    neonLayer.classList.remove("hidden");
  }

  // Get all neon lines
  const neonLines = document.querySelectorAll(".neon-line");

  // Turn on each line one by one with a flicker effect
  neonLines.forEach((line, index) => {
    setTimeout(() => {
      // First: flicker on
      line.classList.add("neon-flicker");

      // Then: steady glow
      setTimeout(() => {
        line.classList.remove("neon-flicker");
        line.classList.add("neon-on");

        // Play a buzz/hum sound for each line lighting up
        playSynthNote(180 + index * 40, 'sine', 0.3, 0.08);
        playSynthNote(360 + index * 80, 'sine', 0.15, 0.04);
      }, 1000);
    }, index * 1200); // 1.2 seconds stagger between each line
  });

  // After all lines are on, update UI
  const totalDelay = neonLines.length * 1200 + 1200;
  setTimeout(() => {
    playSuccessChime();

    // Update description and button
    const neonDesc = document.getElementById("neon-desc");
    if (neonDesc) {
      neonDesc.innerText = "The neon sign is glowing beautifully! ✨";
    }
    neonBtn.disabled = true;
    neonBtn.innerText = "Completed! ✨";

    // After a pause, fade out neon stage and show Cake Stage
    setTimeout(() => {
      const neonStage = document.getElementById("neon-stage");
      if (neonStage) {
        neonStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        neonStage.style.opacity = "0";
        neonStage.style.transform = "translateY(20px)";
        setTimeout(() => {
          neonStage.classList.add("hidden");

          // Show Cake Stage
          const cakeStage = document.getElementById("cake-stage");
          if (cakeStage) {
            cakeStage.classList.remove("hidden");
            cakeStage.style.opacity = "0";
            cakeStage.style.transform = "translateY(20px)";
            cakeStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
            cakeStage.offsetHeight;
            cakeStage.style.opacity = "1";
            cakeStage.style.transform = "translateY(0)";
          }
        }, 800);
      }
    }, 2500);
  }, totalDelay);
}

// ============================================================
//  STAGE 5: CAKE DECORATOR LOGIC
// ============================================================

const bringCakeBtn = document.getElementById("bring-cake-btn");
if (bringCakeBtn) {
  bringCakeBtn.addEventListener("click", () => {
    if (!state.cakePlaced) {
      triggerCakeBringer();
    } else if (state.candlesAllLit) {
      triggerFinalCelebration();
    }
  });
}

function triggerCakeBringer() {
  if (!state.appInitialized) return;
  if (state.cakePlaced) return;
  state.cakePlaced = true;

  // Play button click sound
  playUnlockSound();

  // Disable button immediately
  bringCakeBtn.disabled = true;
  bringCakeBtn.innerText = "Bringing Cake... 🎂";

  // Show the cake scene layer
  const sceneLayer = document.getElementById("cake-scene-layer");
  if (sceneLayer) {
    sceneLayer.classList.remove("hidden");
  }

  // Reveal the stand first
  const stand = document.getElementById("cake-stand");
  if (stand) {
    stand.classList.add("reveal");
  }

  // Setup the baby walking in from left
  const baby = document.getElementById("baby-carrier");
  if (baby) {
    // Ensure initial offscreen left state
    baby.style.left = "-150px";
    
    // Add walking animations
    baby.classList.remove("cheering");
    baby.classList.add("walking");

    // Force reflow and set target destination (centered precisely relative to stand)
    baby.offsetHeight;
    baby.style.left = "calc(50% - 107px)";

    // Play walk sounds periodically
    let stepCount = 0;
    const walkSoundInterval = setInterval(() => {
      if (!baby.classList.contains("walking")) {
        clearInterval(walkSoundInterval);
        return;
      }
      // Alternating footsteps frequencies
      const freq = stepCount % 2 === 0 ? 120 : 100;
      playSynthNote(freq, 'triangle', 0.1, 0.05);
      stepCount++;
    }, 300);

    // Stop walking and place cake after the transition finishes (4.5s)
    setTimeout(() => {
      clearInterval(walkSoundInterval);
      baby.classList.remove("walking");

      // Place the cake! (Hide carried cake, show placed cake on the stand)
      const carriedCake = document.getElementById("carried-cake");
      const placedCake = document.getElementById("placed-cake");

      if (carriedCake) carriedCake.classList.add("hidden");
      if (placedCake) placedCake.classList.remove("hidden");

      // Play cake drop sound
      playSynthNote(400, 'sine', 0.2, 0.1);
      setTimeout(() => {
        playSynthNote(600, 'sine', 0.25, 0.1);
      }, 120);

      // Start cheering!
      baby.classList.add("cheering");
      
      const cakeDesc = document.getElementById("cake-desc");
      if (cakeDesc) {
        cakeDesc.innerText = "Yay! The baby placed the cake on the stand! 🎂👶";
      }

      // Success fanfare sound
      playSuccessChime();

      // Cheering for 3 seconds, then walk offscreen to the right
      setTimeout(() => {
        baby.classList.remove("cheering");
        baby.classList.add("walking");
        baby.style.left = "110vw"; // target offscreen right

        // Step sounds again
        let stepCountRight = 0;
        const walkRightInterval = setInterval(() => {
          if (!baby.classList.contains("walking")) {
            clearInterval(walkRightInterval);
            return;
          }
          const freq = stepCountRight % 2 === 0 ? 120 : 100;
          playSynthNote(freq, 'triangle', 0.1, 0.05);
          stepCountRight++;
        }, 300);

        // After baby is offscreen (4.5s)
        setTimeout(() => {
          clearInterval(walkRightInterval);
          baby.classList.remove("walking");
          baby.classList.add("hidden");

          // Update stage UI to instruct user to light the candles
          bringCakeBtn.innerText = "Light the Candles 🕯️";
          const cakeDesc = document.getElementById("cake-desc");
          if (cakeDesc) {
            cakeDesc.innerText = "Click on each of the 3 candles to light them! 🕯️✨";
          }

          // Enable candle clicking interactions
          initCandleInteractions();

        }, 4500);

      }, 3000);

    }, 4500);
  }
}

function initCandleInteractions() {
  const candles = document.querySelectorAll("#placed-cake .candle");
  let litCount = 0;

  candles.forEach((candle, index) => {
    candle.addEventListener("click", function handleCandleClick() {
      if (candle.classList.contains("lit")) return;

      // Mark as lit
      candle.classList.add("lit");
      litCount++;

      // Play match strike sound
      playSynthNote(600 + index * 100, 'triangle', 0.15, 0.1);
      playSynthNote(900 + index * 150, 'sine', 0.2, 0.08);

      // Spawn spark particles
      spawnSparks(candle);

      // Check if all candles are lit
      if (litCount === candles.length) {
        state.candlesAllLit = true;

        // Gather people around the table
        const peopleLayer = document.getElementById("people-layer");
        if (peopleLayer) {
          peopleLayer.classList.remove("hidden");
          peopleLayer.offsetHeight; // Force reflow
          peopleLayer.classList.add("gathered");
        }

        // Update card description to instruct user to play song
        const cakeDesc = document.getElementById("cake-desc");
        if (cakeDesc) {
          cakeDesc.innerText = "All candles are lit and everyone is gathered! Click the button below to sing! 🎵🎂";
        }

        // Enable button to play classic music
        if (bringCakeBtn) {
          bringCakeBtn.disabled = false;
          bringCakeBtn.innerText = "Play Birthday Song 🎵";
        }
      }
    });
  });
}

function spawnSparks(candleElement) {
  const rect = candleElement.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top;

  for (let i = 0; i < 10; i++) {
    const spark = document.createElement("div");
    spark.className = "confetti-piece";

    // Warm fire colors
    const colors = ["#ff5722", "#ff9800", "#ffeb3b", "#ffc107", "#ffffff"];
    spark.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    const size = Math.random() * 6 + 4;
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;
    spark.style.borderRadius = "50%";
    spark.style.left = `${startX}px`;
    spark.style.top = `${startY}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 40 + 20;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 20;
    const rot = Math.random() * 360;
    const dur = Math.random() * 0.4 + 0.3;

    spark.style.setProperty("--tx", `${tx}px`);
    spark.style.setProperty("--ty", `${ty}px`);
    spark.style.setProperty("--rot", `${rot}deg`);
    spark.style.setProperty("--dur", `${dur}s`);

    document.body.appendChild(spark);

    setTimeout(() => {
      spark.remove();
    }, dur * 1000);
  }
}

function triggerFinalCelebration() {
  const cakeDesc = document.getElementById("cake-desc");
  if (cakeDesc) {
    cakeDesc.innerText = "Happy Birthday Neharika! Make a wish! 🎂✨💖";
  }
  const bringCakeBtn = document.getElementById("bring-cake-btn");
  if (bringCakeBtn) {
    bringCakeBtn.disabled = true;
    bringCakeBtn.innerText = "Happy Birthday! 🥳";
  }

  // Trigger continuous corner confetti explosions
  triggerMassiveConfetti();

  // Play the custom user soundtrack
  const birthdaySong = new Audio('Neharika_s_Morning_Light.mp3');
  birthdaySong.volume = 0.5;

  let endedTriggered = false;
  const triggerTransition = () => {
    if (endedTriggered) return;
    endedTriggered = true;
    fadeDecoratorsAndShowWishButton();
  };

  if (!state.isMuted) {
    birthdaySong.play().then(() => {
      // Audio started playing successfully
      birthdaySong.addEventListener("ended", triggerTransition);
    }).catch(err => {
      console.warn("Custom soundtrack failed to play, falling back to synth engine:", err);
      // Fallback: play synthesized happy birthday song
      playHappyBirthdaySong();
      // Since we fall back to the 16s synth song, set transition to happen after 16s
      setTimeout(triggerTransition, 16000);
    });
  } else {
    // If muted, transition after 6 seconds of confetti
    setTimeout(triggerTransition, 6000);
  }

  // General backup timeout (45s) in case audio stays open or gets stuck
  setTimeout(triggerTransition, 45000);
}

function triggerMassiveConfetti() {
  const duration = 12000; // Let it blast for 12 seconds
  const end = Date.now() + duration;
  const colors = ["#ff4081", "#2196f3", "#4caf50", "#ffeb3b", "#ff9800", "#9c27b0", "#00e5ff"];

  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }
    // Blast from bottom-left corner
    spawnConfettiGroup(0, window.innerHeight, 25, colors, -45, 50);
    // Blast from bottom-right corner
    spawnConfettiGroup(window.innerWidth, window.innerHeight, 25, colors, -135, 50);
  }, 800);
}

function spawnConfettiGroup(x, y, count, colors, angleBase, angleSpread) {
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti-piece";
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    const size = Math.random() * 8 + 6;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size * 0.7}px`;
    confetti.style.left = `${x}px`;
    confetti.style.top = `${y}px`;

    const angleRad = (angleBase + (Math.random() * angleSpread - angleSpread / 2)) * Math.PI / 180;
    const force = Math.random() * 180 + 180;
    const tx = Math.cos(angleRad) * force;
    const ty = Math.sin(angleRad) * force;
    const rot = Math.random() * 720 - 360;
    const dur = Math.random() * 1.5 + 1.5;

    confetti.style.setProperty("--tx", `${tx}px`);
    confetti.style.setProperty("--ty", `${ty}px`);
    confetti.style.setProperty("--rot", `${rot}deg`);
    confetti.style.setProperty("--dur", `${dur}s`);

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, dur * 1000);
  }
}

function playHappyBirthdaySong() {
  // Happy Birthday melody notes: { freq, duration(ms), delay(ms) }
  const melody = [
    // Happy Birthday to you
    { freq: 261.63, dur: 300, delay: 0 },
    { freq: 261.63, dur: 300, delay: 350 },
    { freq: 293.66, dur: 600, delay: 700 },
    { freq: 261.63, dur: 600, delay: 1300 },
    { freq: 349.23, dur: 600, delay: 1900 },
    { freq: 329.63, dur: 1200, delay: 2500 },

    // Happy Birthday to you
    { freq: 261.63, dur: 300, delay: 4000 },
    { freq: 261.63, dur: 300, delay: 4350 },
    { freq: 293.66, dur: 600, delay: 4700 },
    { freq: 261.63, dur: 600, delay: 5300 },
    { freq: 392.00, dur: 600, delay: 5900 },
    { freq: 349.23, dur: 1200, delay: 6500 },

    // Happy Birthday dear Neharika
    { freq: 261.63, dur: 300, delay: 8000 },
    { freq: 261.63, dur: 300, delay: 8350 },
    { freq: 523.25, dur: 600, delay: 8700 },
    { freq: 440.00, dur: 600, delay: 9300 },
    { freq: 349.23, dur: 600, delay: 9900 },
    { freq: 329.63, dur: 600, delay: 10500 },
    { freq: 293.66, dur: 1200, delay: 11100 },

    // Happy Birthday to you
    { freq: 466.16, dur: 300, delay: 12600 },
    { freq: 466.16, dur: 300, delay: 12950 },
    { freq: 440.00, dur: 600, delay: 13300 },
    { freq: 349.23, dur: 600, delay: 13900 },
    { freq: 392.00, dur: 600, delay: 14500 },
    { freq: 349.23, dur: 1200, delay: 15100 }
  ];

  melody.forEach(note => {
    setTimeout(() => {
      // Play note on a warm sine voice + soft triangle sub-harmonic
      playSynthNote(note.freq, 'sine', note.dur / 1000, 0.12);
      playSynthNote(note.freq / 2, 'triangle', note.dur / 1000, 0.04);
    }, note.delay);
  });
}

function scatterBalloons() {
  const balloons = document.querySelectorAll(".balloon-wrapper");
  balloons.forEach(wrapper => {
    let currentLeftVal = parseFloat(wrapper.style.left);
    const isVw = wrapper.style.left.includes("vw");
    
    // If it's in px (e.g. initial pump nozzle coordinate), convert to approximate vw
    if (!isVw) {
      currentLeftVal = (currentLeftVal / window.innerWidth) * 100;
    }
    
    // If the balloon is in the center region (33vw to 67vw)
    if (currentLeftVal >= 33 && currentLeftVal <= 67) {
      // Disperse left side balloons to 14vw - 32vw, right to 68vw - 86vw
      let newLeft;
      if (currentLeftVal < 50) {
        newLeft = Math.random() * 18 + 14; // 14vw to 32vw
      } else {
        newLeft = Math.random() * 18 + 68; // 68vw to 86vw
      }
      
      // Apply transition and move it smoothly
      wrapper.style.transition = "left 3s cubic-bezier(0.25, 0.8, 0.25, 1), top 3s ease-out";
      wrapper.style.left = `${newLeft}vw`;
      
      // Shuffle vertical height slightly to spread them out vertically
      const currentTopVal = parseFloat(wrapper.style.top) || 8;
      wrapper.style.top = `${currentTopVal + (Math.random() * 6 - 3)}vh`;
    }
  });
}

// ============================================================
//  GRAND FINALE TRANSITIONS & WISH MODAL CONTROLLER
// ============================================================

let wishButtonShown = false;
function fadeDecoratorsAndShowWishButton() {
  if (wishButtonShown) return;
  wishButtonShown = true;

  // Fade out the cake decorator card
  const cakeStage = document.getElementById("cake-stage");
  if (cakeStage) {
    cakeStage.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    cakeStage.style.opacity = "0";
    cakeStage.style.transform = "translateY(20px)";
    setTimeout(() => {
      cakeStage.classList.add("hidden");

      // Hide the entire app control container
      const appContainer = document.getElementById("app-container");
      if (appContainer) {
        appContainer.style.transition = "opacity 1.5s ease, transform 1.5s ease";
        appContainer.style.opacity = "0";
        appContainer.style.transform = "scale(0.97)";
        setTimeout(() => {
          appContainer.classList.add("hidden");
          // Reveal the "Make a Wish" button at the bottom center
          const writeWishBtn = document.getElementById("write-wish-btn");
          if (writeWishBtn) {
            writeWishBtn.classList.remove("hidden");
            writeWishBtn.offsetHeight; // force reflow
            writeWishBtn.classList.add("reveal");
          }
        }, 1500);
      }
    }, 800);
  }
}

function initWishModal() {
  const writeWishBtn = document.getElementById("write-wish-btn");
  const wishModal = document.getElementById("wish-modal");
  const closeWishModal = document.getElementById("close-wish-modal");
  const submitWishBtn = document.getElementById("submit-wish-btn");
  const wishTextarea = document.getElementById("wish-textarea");
  const modalFormBody = document.getElementById("modal-form-body");
  const wishSuccessMsg = document.getElementById("wish-success-msg");

  if (!writeWishBtn || !wishModal) return;

  // Open modal
  writeWishBtn.addEventListener("click", () => {
    // Reset modal state
    wishTextarea.value = "";
    modalFormBody.classList.remove("hidden");
    wishSuccessMsg.classList.add("hidden");
    
    wishModal.classList.remove("hidden");
    wishModal.offsetHeight; // force reflow
    wishModal.classList.add("show");
    
    // Play warm unlock chime
    playSynthNote(523.25, 'sine', 0.15, 0.1); // C5
    playSynthNote(659.25, 'sine', 0.15, 0.1); // E5
  });

  // Close modal
  const closeModal = () => {
    wishModal.classList.remove("show");
    setTimeout(() => {
      wishModal.classList.add("hidden");
    }, 400);
  };

  closeWishModal.addEventListener("click", closeModal);
  
  // Close if clicking overlay
  wishModal.addEventListener("click", (e) => {
    if (e.target === wishModal) {
      closeModal();
    }
  });

  // Submit wish
  submitWishBtn.addEventListener("click", () => {
    const text = wishTextarea.value.trim();
    if (!text) {
      // Shake textarea to signal empty input
      wishTextarea.style.animation = "wishTextareaShake 0.4s ease";
      setTimeout(() => {
        wishTextarea.style.animation = "";
      }, 400);
      return;
    }

    // Save wish to localStorage
    const savedWishes = JSON.parse(localStorage.getItem("neharika_birthday_wishes") || "[]");
    savedWishes.push({
      text: text,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("neharika_birthday_wishes", JSON.stringify(savedWishes));

    // Send wish to backend function to write to wishes.md in root
    fetch('/.netlify/functions/save-wish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ wish: text })
    }).catch(err => {
      console.warn("Local development API endpoint for saving wish not reachable:", err);
    });

    // Play sparkling chime sound effects
    playSynthNote(659.25, 'sine', 0.2, 0.12); // E5
    playSynthNote(783.99, 'sine', 0.2, 0.12); // G5
    playSynthNote(1046.50, 'sine', 0.4, 0.15); // C6

    // Spawn tiny heart particles on screen
    spawnHeartExplosion();

    // Hide the Make a Wish button so it cannot be clicked again
    const writeWishBtn = document.getElementById("write-wish-btn");
    if (writeWishBtn) {
      writeWishBtn.classList.add("hidden");
    }

    // Show success view
    modalFormBody.classList.add("hidden");
    wishSuccessMsg.classList.remove("hidden");

    // Close modal after 2.5 seconds and trigger microphone blow prompt
    setTimeout(() => {
      closeModal();
      startMicBlowDetection();
    }, 2500);
  });
}

function spawnHeartExplosion() {
  const count = 15;
  const colors = ["#ff4081", "#e91e63", "#ff80ab", "#ff1744"];
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("div");
    heart.innerHTML = "💖";
    heart.style.position = "fixed";
    heart.style.left = "50%";
    heart.style.top = "50%";
    heart.style.fontSize = `${Math.random() * 20 + 15}px`;
    heart.style.zIndex = "3000";
    heart.style.pointerEvents = "none";
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150 + 50;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 80;
    const dur = Math.random() * 0.8 + 0.6;
    
    heart.style.transition = `transform ${dur}s cubic-bezier(0.25, 0.8, 0.25, 1), opacity ${dur}s ease-out`;
    document.body.appendChild(heart);
    
    // Animate
    setTimeout(() => {
      heart.style.transform = `translate(${tx}px, ${ty}px) scale(0.5)`;
      heart.style.opacity = "0";
    }, 20);
    
    setTimeout(() => {
      heart.remove();
    }, dur * 1000);
  }
}

// ============================================================
//  CURSOR SPARKLE TRAIL
// ============================================================
function initCursorSparklers() {
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  const colors = ["#ff4081", "#ffeb3b", "#ff9800", "#00e5ff", "#e91e63", "#ffffff"];

  window.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastTime < 45) return;
    lastTime = now;

    const vx = e.clientX - lastX;
    const vy = e.clientY - lastY;
    const velocity = Math.sqrt(vx * vx + vy * vy);
    
    lastX = e.clientX;
    lastY = e.clientY;

    if (velocity < 3) return;

    const count = Math.min(Math.floor(velocity / 8) + 1, 3);
    for (let i = 0; i < count; i++) {
      createSparkle(e.clientX, e.clientY);
    }
  });

  function createSparkle(x, y) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle-particle";
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.color = colors[Math.floor(Math.random() * colors.length)];
    sparkle.style.backgroundColor = "currentColor";
    
    const size = Math.random() * 6 + 4;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed + 1.2; 
    
    sparkle.style.setProperty("--vx", `${vx}px`);
    sparkle.style.setProperty("--vy", `${vy}px`);
    
    const dur = Math.random() * 0.6 + 0.4;
    sparkle.style.setProperty("--dur", `${dur}s`);

    document.body.appendChild(sparkle);

    setTimeout(() => {
      sparkle.remove();
    }, dur * 1000);
  }
}

// ============================================================
//  INTERACTIVE GUEST CHEERING
// ============================================================
function initGuestCheering() {
  const people = document.querySelectorAll(".person");
  people.forEach((person, index) => {
    person.style.cursor = "pointer";
    person.style.pointerEvents = "auto";
    
    person.addEventListener("click", () => {
      const peopleLayer = document.getElementById("people-layer");
      if (peopleLayer && peopleLayer.classList.contains("hidden")) return;

      person.classList.add("cheering-active");
      playCheerSound(index);
      spawnCheerConfetti(person);

      setTimeout(() => {
        person.classList.remove("cheering-active");
      }, 1200);
    });
  });
}

function playCheerSound(personIndex) {
  initAudio();
  if (!audioCtx || state.isMuted) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const baseFreq = 300 + (personIndex * 60);

  osc.type = "triangle";
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.4);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
  
  setTimeout(() => {
    if (state.isMuted) return;
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(baseFreq * 2.5, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc2.start();
    osc2.stop(audioCtx.currentTime + 0.35);
  }, 50);
}

function spawnCheerConfetti(personEl) {
  const rect = personEl.getBoundingClientRect();
  const colors = ["#ff4081", "#2196f3", "#4caf50", "#ffeb3b", "#ff9800", "#e91e63"];
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.className = "sparkle-particle";
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + 20}px`;
    particle.style.color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.backgroundColor = "currentColor";
    
    const size = Math.random() * 5 + 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    const angle = (Math.random() * Math.PI) + Math.PI; 
    const speed = Math.random() * 3 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 1.5; 
    
    particle.style.setProperty("--vx", `${vx}px`);
    particle.style.setProperty("--vy", `${vy}px`);
    
    const dur = Math.random() * 0.6 + 0.4;
    particle.style.setProperty("--dur", `${dur}s`);
    
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), dur * 1000);
  }
}

// ============================================================
//  SECRET MESSAGE BOX & MEMORIES POLAROID CONTROLLER
// ============================================================
function initMessageBoxAndMemories() {
  const messageBox = document.getElementById("message-box");
  const memoriesModal = document.getElementById("memories-modal");
  const closeMemoriesModal = document.getElementById("close-memories-modal");

  if (!messageBox || !memoriesModal) return;

  messageBox.addEventListener("click", () => {
    const badge = messageBox.querySelector('.notification-badge');
    if (badge) {
      badge.style.display = 'none';
    }

    if (messageBox.classList.contains("opened")) {
      openMemoriesModal();
      return;
    }

    messageBox.classList.add("opened");
    
    playSynthNote(330, 'triangle', 0.2, 0.15); 
    setTimeout(() => playSynthNote(440, 'triangle', 0.2, 0.15), 100); 
    setTimeout(() => playSynthNote(554, 'triangle', 0.35, 0.2), 200); 
    
    spawnEnvelopeConfetti(messageBox);

    setTimeout(() => {
      openMemoriesModal();
    }, 600);
  });

  function openMemoriesModal() {
    memoriesModal.classList.remove("hidden");
    memoriesModal.offsetHeight;
    memoriesModal.classList.add("show");
    playUnlockSound();
  }

  function spawnEnvelopeConfetti(envEl) {
    const rect = envEl.getBoundingClientRect();
    const colors = ["#ffeb3b", "#ff4081", "#ffffff"];
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      particle.className = "sparkle-particle";
      particle.style.left = `${rect.left + 30}px`;
      particle.style.top = `${rect.top + 10}px`;
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.backgroundColor = "currentColor";
      
      const size = Math.random() * 6 + 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 2.5; 
      
      particle.style.setProperty("--vx", `${vx}px`);
      particle.style.setProperty("--vy", `${vy}px`);
      
      const dur = Math.random() * 0.4 + 0.4;
      particle.style.setProperty("--dur", `${dur}s`);
      
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), dur * 1000);
    }
  }

  const closeMemories = () => {
    memoriesModal.classList.remove("show");
    setTimeout(() => {
      memoriesModal.classList.add("hidden");
    }, 450);
  };

  if (closeMemoriesModal) {
    closeMemoriesModal.addEventListener("click", closeMemories);
  }
  memoriesModal.addEventListener("click", (e) => {
    if (e.target === memoriesModal) {
      closeMemories();
    }
  });
}

// ============================================================
//  WISH STARS LOADER & FLOATING ANIMATION
// ============================================================
function initWishStarsLoader() {
  const layer = document.getElementById("wish-stars-layer");
  if (!layer) return;

  const wishes = JSON.parse(localStorage.getItem("neharika_birthday_wishes") || "[]");
  wishes.forEach(item => {
    renderWishStarInSky(item.text);
  });
}

function renderWishStarInSky(wishText) {
  const layer = document.getElementById("wish-stars-layer");
  if (!layer) return;

  const star = document.createElement("div");
  star.className = "wish-star";
  star.innerHTML = "⭐";
  star.setAttribute("data-wish", wishText);

  star.style.left = `${Math.random() * 80 + 10}vw`;
  star.style.top = `${Math.random() * 13 + 2}vh`;
  star.style.animationDelay = `${Math.random() * -4}s`;

  layer.appendChild(star);
}

function animateNewWishStar(wishText) {
  const layer = document.getElementById("wish-stars-layer");
  if (!layer) return;

  const star = document.createElement("div");
  star.className = "wish-star";
  star.innerHTML = "⭐";
  star.setAttribute("data-wish", wishText);

  star.style.left = "50%";
  star.style.top = "58vh";
  star.style.transform = "translate(-50%, -50%) scale(0.1)";
  star.style.opacity = "0.2";
  star.style.transition = "all 3.5s cubic-bezier(0.19, 1, 0.22, 1)";

  layer.appendChild(star);

  setTimeout(() => {
    const finalLeft = Math.random() * 80 + 10; 
    const finalTop = Math.random() * 13 + 2;   
    
    star.style.left = `${finalLeft}vw`;
    star.style.top = `${finalTop}vh`;
    star.style.transform = "translate(0, 0) scale(1)";
    star.style.opacity = "1";
  }, 100);

  setTimeout(() => {
    star.style.transition = "";
    star.style.animation = "floatStar 4s infinite alternate ease-in-out";
  }, 3600);
}

// ============================================================
//  MICROPHONE BLOW DETECTOR & CANDLE EXTINGUISHER
// ============================================================
let micStream = null;
let micAudioCtx = null;
let micSource = null;
let micAnalyser = null;
let isListeningToBlow = false;

function startMicBlowDetection() {
  if (isListeningToBlow) return;
  isListeningToBlow = true;

  const prompt = document.createElement("div");
  prompt.id = "mic-prompt";
  prompt.className = "mic-instruction-overlay";
  prompt.innerHTML = `<span>🎙️ Close your eyes, make a wish, and BLOW to extinguish the candles!</span>`;
  document.body.appendChild(prompt);

  enableCandleClickExtinguish();

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        micStream = stream;
        micAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        micSource = micAudioCtx.createMediaStreamSource(stream);
        micAnalyser = micAudioCtx.createAnalyser();
        micAnalyser.fftSize = 256;
        
        micSource.connect(micAnalyser);
        
        const bufferLength = micAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let blowCount = 0;

        function checkBlow() {
          if (!isListeningToBlow) return;
          
          micAnalyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;

          if (average > 70) {
            blowCount++;
            if (blowCount > 6) { 
              extinguishAllCandles();
              return;
            }
          } else {
            blowCount = Math.max(0, blowCount - 1);
          }
          
          requestAnimationFrame(checkBlow);
        }
        
        checkBlow();
      })
      .catch(err => {
        console.warn("Microphone access denied or not supported, use tap-to-extinguish fallback:", err);
      });
  }
}

function stopMicBlowDetection() {
  isListeningToBlow = false;
  
  const prompt = document.getElementById("mic-prompt");
  if (prompt) prompt.remove();

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (micAudioCtx) {
    micAudioCtx.close();
    micAudioCtx = null;
  }
}

function enableCandleClickExtinguish() {
  const candles = document.querySelectorAll("#placed-cake .candle");
  candles.forEach(candle => {
    candle.style.cursor = "pointer";
    candle.onclick = () => {
      extinguishAllCandles();
    };
  });
}

function extinguishAllCandles() {
  if (!isListeningToBlow) return; 
  stopMicBlowDetection();

  const candles = document.querySelectorAll("#placed-cake .candle");
  candles.forEach((candle, idx) => {
    setTimeout(() => {
      const flame = candle.querySelector(".flame");
      if (flame) {
        flame.style.display = "none";
        spawnSmokeParticles(flame);
      }
    }, idx * 150);
  });

  playSynthNote(120, 'triangle', 0.5, 0.3); 
  playSynthNote(150, 'sine', 0.4, 0.2);

  // Start the background fireworks display!
  startFireworks();

  setTimeout(() => {
    playSuccessChime();
    playSynthNote(1318.51, 'sine', 0.6, 0.15); 
    playSynthNote(1567.98, 'sine', 0.8, 0.2);  
    
    showFinalCelebrationMessage();
  }, 500);
}

function spawnSmokeParticles(flameEl) {
  const rect = flameEl.getBoundingClientRect();
  for (let i = 0; i < 5; i++) {
    const smoke = document.createElement("div");
    smoke.className = "sparkle-particle";
    smoke.style.backgroundColor = "rgba(220, 220, 220, 0.6)"; 
    smoke.style.borderRadius = "50%";
    
    smoke.style.left = `${rect.left + rect.width / 2}px`;
    smoke.style.top = `${rect.top}px`;
    
    const size = Math.random() * 8 + 5;
    smoke.style.width = `${size}px`;
    smoke.style.height = `${size}px`;
    
    const angle = (Math.random() * Math.PI) + Math.PI; 
    const speed = Math.random() * 1.5 + 0.8;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 1.5; 
    
    smoke.style.setProperty("--vx", `${vx}px`);
    smoke.style.setProperty("--vy", `${vy}px`);
    
    const dur = Math.random() * 0.8 + 0.5;
    smoke.style.setProperty("--dur", `${dur}s`);
    
    document.body.appendChild(smoke);
    setTimeout(() => smoke.remove(), dur * 1000);
  }
}

function showFinalCelebrationMessage() {
  const wishesText = document.createElement("div");
  wishesText.style.position = "fixed";
  wishesText.style.top = "20%";
  wishesText.style.left = "50%";
  wishesText.style.transform = "translate(-50%, -50%) scale(0.8)";
  wishesText.style.opacity = "0";
  wishesText.style.transition = "all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  wishesText.style.zIndex = "1000";
  
  wishesText.innerHTML = `
    <div class="final-celebration-card">
      <h2>May all your wishes come true!</h2>
      <p>Happy Birthday, Neharika! 💖🎂🌟</p>
    </div>
  `;
  document.body.appendChild(wishesText);
  wishesText.offsetHeight;
  wishesText.style.transform = "translate(-50%, -50%) scale(1)";
  wishesText.style.opacity = "1";

  // Automatically fade out and remove the message after 4.5 seconds
  setTimeout(() => {
    wishesText.style.transform = "translate(-50%, -50%) scale(0.8)";
    wishesText.style.opacity = "0";
    setTimeout(() => {
      wishesText.remove();
      
      // Reveal the secret message box now as a post-credits surprise!
      const messageBox = document.getElementById("message-box");
      if (messageBox) {
        messageBox.classList.remove("hidden");
        messageBox.offsetHeight; // force reflow
        messageBox.classList.add("reveal");
      }
    }, 1000);
  }, 4500);
}

// ============================================================
//  BACKGROUND FIREWORKS DISPLAY
// ============================================================
let fireworksActive = false;
let fireworksCanvas = null;
let fireworksCtx = null;
let fireworkRockets = [];
let fireworkParticles = [];
let fireworkLaunchTimer = null;

function startFireworks() {
  fireworksCanvas = document.getElementById("fireworks-canvas");
  if (!fireworksCanvas) return;

  fireworksCanvas.classList.remove("hidden");
  fireworksCtx = fireworksCanvas.getContext("2d");
  fireworksActive = true;

  function resizeCanvas() {
    if (!fireworksCanvas) return;
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function loop() {
    if (!fireworksActive) return;
    requestAnimationFrame(loop);
    drawFireworks();
  }
  loop();

  // Launch initial burst and setup loop
  launchMultipleFireworks(3);
  fireworkLaunchTimer = setInterval(() => {
    if (Math.random() < 0.7) {
      launchSingleFirework();
    }
  }, 1000);
}

function stopFireworks() {
  fireworksActive = false;
  if (fireworkLaunchTimer) clearInterval(fireworkLaunchTimer);
  if (fireworksCanvas) fireworksCanvas.classList.add("hidden");
  fireworkRockets = [];
  fireworkParticles = [];
}

function launchSingleFirework() {
  if (!fireworksCanvas) return;
  const startX = Math.random() * (fireworksCanvas.width - 200) + 100;
  const startY = fireworksCanvas.height;
  const targetX = Math.random() * (fireworksCanvas.width - 200) + 100;
  const targetY = Math.random() * (fireworksCanvas.height * 0.4) + fireworksCanvas.height * 0.15;
  const duration = Math.random() * 45 + 35; // frames

  fireworkRockets.push({
    x: startX,
    y: startY,
    tx: targetX,
    ty: targetY,
    step: 0,
    maxSteps: duration,
    color: `hsl(${Math.random() * 360}, 100%, 72%)`,
    isHeart: Math.random() < 0.35 // 35% chance of heart firework!
  });

  // Soft launch whistle
  playSynthNote(150 + Math.random() * 120, 'triangle', 0.05, 0.02);
}

function launchMultipleFireworks(count) {
  for (let i = 0; i < count; i++) {
    setTimeout(launchSingleFirework, i * 300);
  }
}

function drawFireworks() {
  fireworksCtx.globalCompositeOperation = 'destination-out';
  fireworksCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  fireworksCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  fireworksCtx.globalCompositeOperation = 'lighter';

  // Update & Draw Rockets
  for (let i = fireworkRockets.length - 1; i >= 0; i--) {
    const r = fireworkRockets[i];
    r.step++;

    const progress = r.step / r.maxSteps;
    const currentX = r.x + (r.tx - r.x) * progress;
    const currentY = r.y + (r.ty - r.y) * (1 - Math.pow(1 - progress, 2));

    fireworksCtx.beginPath();
    fireworksCtx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
    fireworksCtx.fillStyle = r.color;
    fireworksCtx.fill();

    if (Math.random() < 0.3) {
      fireworkParticles.push({
        x: currentX,
        y: currentY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 1.2 + 0.3,
        alpha: 0.7,
        decay: 0.04,
        color: '#ffeb3b',
        size: 1.2
      });
    }

    if (r.step >= r.maxSteps) {
      explodeFirework(r.tx, r.ty, r.color, r.isHeart);
      fireworkRockets.splice(i, 1);
    }
  }

  // Update & Draw Explosion Particles
  for (let i = fireworkParticles.length - 1; i >= 0; i--) {
    const p = fireworkParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04; // gravity
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      fireworkParticles.splice(i, 1);
      continue;
    }

    fireworksCtx.beginPath();
    fireworksCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fireworksCtx.fillStyle = p.color;
    fireworksCtx.globalAlpha = p.alpha;
    fireworksCtx.fill();
    fireworksCtx.globalAlpha = 1.0;
  }
}

function explodeFirework(x, y, color, isHeart) {
  // Low bass pop
  playSynthNote(80 + Math.random() * 30, 'triangle', 0.15, 0.08);
  // High shimmer crackle
  playSynthNote(750 + Math.random() * 500, 'sine', 0.08, 0.02);

  const particleCount = isHeart ? 38 : 45;

  if (isHeart) {
    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
      
      const speedScale = Math.random() * 0.18 + 0.18;
      const vx = hx * speedScale + (Math.random() - 0.5) * 0.7;
      const vy = hy * speedScale + (Math.random() - 0.5) * 0.7;

      fireworkParticles.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.012,
        color: color,
        size: Math.random() * 1.5 + 1.5
      });
    }
  } else {
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.2 + 1.3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      fireworkParticles.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        alpha: 1.0,
        decay: Math.random() * 0.025 + 0.015,
        color: color,
        size: Math.random() * 2 + 1.2
      });
    }
  }
}

// CSS Animation for textarea shake added dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes wishTextareaShake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
  }
`;
document.head.appendChild(styleSheet);

// Initialize the photo full-resolution lightbox modal
function initPhotoLightbox() {
  const photoContainers = document.querySelectorAll('.birthday-photo-container');
  const lightbox = document.getElementById('photo-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('close-lightbox');
  
  if (!lightbox || !lightboxImg) return;
  
  photoContainers.forEach(container => {
    container.addEventListener('click', () => {
      const img = container.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightbox.classList.remove('hidden');
        lightbox.offsetHeight; // force reflow
        lightbox.classList.add('show');
        if (typeof playUnlockSound === 'function') {
          playUnlockSound();
        }
      }
    });
  });
  
  const closeLightbox = () => {
    lightbox.classList.remove('show');
    setTimeout(() => {
      lightbox.classList.add('hidden');
    }, 300);
  };
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
}

// Initialize all features on startup
initWishModal();
initCursorSparklers();
initGuestCheering();
initMessageBoxAndMemories();
initPhotoLightbox();

