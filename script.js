/**
 * ============================================================================
 * ESL PREPOSITION DRAG & DROP GAME ENGINE
 * Dedicated for Young ESL Learners
 * Fully commented and highly modular for easy teacher customization.
 * ============================================================================
 */

/* ============================================================================
   1. TEACHER CONFIGURATION & QUESTION BANK
   Teachers can edit object names, emojis, target positions, and instruction templates here.
   ============================================================================ */
const GAME_CONFIG = {
  // Preposition Spatial Distance Tolerance (In pixels)
  spatialTolerance: 75,

  // Success Sounds (Frequency sequences using native Web Audio API)
  soundEffects: {
    success: [523.25, 659.25, 783.99, 1046.50], // C Major Arpeggio
    error: [220, 196],                          // Low error buzz
    click: [400],                               // Quick tap tone
    celebration: [440, 554.37, 659.25, 880]     // Win tune
  },

  // Available Prepositions for logic evaluation
  prepositions: ['on', 'under', 'in', 'next to', 'behind', 'between', 'in front of', 'above', 'below'],

  // Master Object Library (Includes visuals, default positions in %, and physical dimensions)
  objects: [
    { id: 'cat',       label: 'Cat',       emoji: '🐱', width: 70,  height: 70,  difficulty: 'easy' },
    { id: 'dog',       label: 'Dog',       emoji: '🐶', width: 75,  height: 75,  difficulty: 'easy' },
    { id: 'sofa',      label: 'Sofa',      emoji: '🛋️', width: 140, height: 90,  difficulty: 'easy' },
    { id: 'chair',     label: 'Chair',     emoji: '🪑', width: 80,  height: 90,  difficulty: 'easy' },
    { id: 'toybox',    label: 'Toy Box',   emoji: '🧸', width: 100, height: 80,  difficulty: 'easy' },
    { id: 'tv',        label: 'TV',        emoji: '📺', width: 110, height: 90,  difficulty: 'medium' },
    { id: 'table',     label: 'Table',     emoji: '🪵', width: 130, height: 80,  difficulty: 'medium' },
    { id: 'carpet',    label: 'Carpet',    emoji: '🟦', width: 160, height: 60,  difficulty: 'medium' },
    { id: 'lamp',      label: 'Lamp',      emoji: '💡', width: 60,  height: 90,  difficulty: 'medium' },
    { id: 'bookshelf', label: 'Bookshelf', emoji: '📚', width: 100, height: 130, difficulty: 'medium' },
    { id: 'clock',     label: 'Clock',     emoji: '⏰', width: 60,  height: 60,  difficulty: 'hard' },
    { id: 'window',    label: 'Window',    emoji: '🪟', width: 100, height: 100, difficulty: 'hard' },
    { id: 'flowers',   label: 'Flowers',   emoji: '💐', width: 60,  height: 60,  difficulty: 'hard' },
    { id: 'ball',      label: 'Ball',      emoji: '⚽', width: 60,  height: 60,  difficulty: 'hard' },
    { id: 'bed',       label: 'Bed',       emoji: '🛏️', width: 140, height: 100, difficulty: 'hard' },
    { id: 'pillow',    label: 'Pillow',    emoji: '🪶', width: 60,  height: 50,  difficulty: 'hard' },
    { id: 'bear',      label: 'Teddy Bear',emoji: '🧸', width: 65,  height: 65,  difficulty: 'hard' }
  ]
};

/* ============================================================================
   2. GAME STATE MANAGEMENT
   ============================================================================ */
const state = {
  difficulty: 'medium',     // 'easy', 'medium', or 'hard'
  activeObjects: [],        // Objects active in the current scene
  currentInstruction: null, // Holds subject, preposition, target Object(s)
  score: 0,
  questionsCompleted: 0,
  totalAttempts: 0,
  isMuted: false,
  dragState: null           // Stores active PointerEvent metadata
};

/* Web Audio Context Synthesizer (Zero External Files Required) */
let audioCtx = null;

/* ============================================================================
   3. INITIALIZATION & SETUP
   ============================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Bind Audio Context start trigger on first user interaction
  document.getElementById('btn-start').addEventListener('click', () => {
    initAudioContext();
    document.getElementById('start-overlay').classList.add('hidden');
    startNewGame();
  });

  // Bind Control Buttons
  document.getElementById('difficulty-select').addEventListener('change', (e) => {
    state.difficulty = e.target.value;
    startNewGame();
  });

  document.getElementById('btn-new-game').addEventListener('click', () => { playTone('click'); startNewGame(); });
  document.getElementById('btn-reset').addEventListener('click', () => { playTone('click'); resetObjectPositions(); });
  document.getElementById('btn-shuffle').addEventListener('click', () => { playTone('click'); shuffleObjectPositions(); });
  document.getElementById('btn-hint').addEventListener('click', () => { playTone('click'); showHint(); });
  document.getElementById('btn-mute').addEventListener('click', toggleMute);
  document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
});

/** Initializes Web Audio API Context */
function initAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
}

/* ============================================================================
   4. CORE GAME LOOP & SCENE GENERATION
   ============================================================================ */

/** Starts a completely new game session based on selected difficulty */
function startNewGame() {
  // Filter objects based on difficulty setting
  if (state.difficulty === 'easy') {
    state.activeObjects = GAME_CONFIG.objects.slice(0, 5);
  } else if (state.difficulty === 'medium') {
    state.activeObjects = GAME_CONFIG.objects.slice(0, 10);
  } else {
    state.activeObjects = [...GAME_CONFIG.objects];
  }

  renderScene();
  generateNextInstruction();
}

/** Renders objects dynamically onto the room scene */
function renderScene() {
  const scene = document.getElementById('scene-container');
  scene.innerHTML = ''; // Clear previous objects

  const sceneRect = scene.getBoundingClientRect();
  const cols = Math.ceil(Math.sqrt(state.activeObjects.length));
  const rows = Math.ceil(state.activeObjects.length / cols);

  state.activeObjects.forEach((obj, index) => {
    const el = document.createElement('div');
    el.className = 'draggable-object';
    el.id = `obj-${obj.id}`;
    el.setAttribute('data-id', obj.id);

    // Dynamic scale/size
    el.style.width = `${obj.width}px`;
    el.style.height = `${obj.height}px`;

    // Visual Avatar and Text Label
    el.innerHTML = `
      <div class="object-avatar">${obj.emoji}</div>
      <div class="object-label">${obj.label}</div>
    `;

    scene.appendChild(el);

    // Attach Unified Pointer Event Listeners for Touch/Mouse
    attachDragListeners(el);
  });

  // Spread out objects nicely across the room
  shuffleObjectPositions();
}

/** Resets objects to grid layout */
function resetObjectPositions() {
  const scene = document.getElementById('scene-container');
  const sceneWidth = scene.clientWidth;
  const sceneHeight = scene.clientHeight;

  const cols = 4;
  const cellWidth = sceneWidth / cols;
  const cellHeight = sceneHeight / Math.ceil(state.activeObjects.length / cols);

  state.activeObjects.forEach((obj, index) => {
    const el = document.getElementById(`obj-${obj.id}`);
    if (!el) return;

    const col = index % cols;
    const row = Math.floor(index / cols);

    const x = col * cellWidth + (cellWidth - obj.width) / 2;
    const y = row * cellHeight + (cellHeight - obj.height) / 2;

    el.style.left = `${Math.max(10, Math.min(sceneWidth - obj.width - 10, x))}px`;
    el.style.top = `${Math.max(10, Math.min(sceneHeight - obj.height - 10, y))}px`;
  });
}

/** Shuffles objects randomly across the scene */
function shuffleObjectPositions() {
  const scene = document.getElementById('scene-container');
  const sceneWidth = scene.clientWidth;
  const sceneHeight = scene.clientHeight;

  state.activeObjects.forEach((obj) => {
    const el = document.getElementById(`obj-${obj.id}`);
    if (!el) return;

    // Generate random positions keeping padding from edges
    const randomX = Math.random() * (sceneWidth - obj.width - 40) + 20;
    const randomY = Math.random() * (sceneHeight - obj.height - 40) + 20;

    el.style.left = `${randomX}px`;
    el.style.top = `${randomY}px`;
  });
}

/* ============================================================================
   5. POINTER DRAG ENGINE (TOUCH & MOUSE COMPATIBLE)
   ============================================================================ */

/** Attaches Pointer events to support iPad Touch, Windows Touch, and Mouse */
function attachDragListeners(element) {
  element.addEventListener('pointerdown', onPointerDown);
}

function onPointerDown(e) {
  e.preventDefault();
  const el = e.currentTarget;
  
  // Capture pointer focus to ensure smooth dragging even if finger/mouse slips
  el.setPointerCapture(e.pointerId);
  el.classList.add('is-dragging');

  const rect = el.getBoundingClientRect();
  const parentRect = document.getElementById('scene-container').getBoundingClientRect();

  // Store drag offset relative to the object's top-left corner
  state.dragState = {
    element: el,
    pointerId: e.pointerId,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    parentRect: parentRect
  };

  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
}

function onPointerMove(e) {
  if (!state.dragState || state.dragState.pointerId !== e.pointerId) return;

  const { element, offsetX, offsetY, parentRect } = state.dragState;

  // Calculate new absolute positions inside room
  let newX = e.clientX - parentRect.left - offsetX;
  let newY = e.clientY - parentRect.top - offsetY;

  // Keep object inside room boundaries
  newX = Math.max(0, Math.min(parentRect.width - element.offsetWidth, newX));
  newY = Math.max(0, Math.min(parentRect.height - element.offsetHeight, newY));

  element.style.left = `${newX}px`;
  element.style.top = `${newY}px`;
}

function onPointerUp(e) {
  if (!state.dragState || state.dragState.pointerId !== e.pointerId) return;

  const { element, pointerId } = state.dragState;
  element.releasePointerCapture(pointerId);
  element.classList.remove('is-dragging');

  element.removeEventListener('pointermove', onPointerMove);
  element.removeEventListener('pointerup', onPointerUp);
  element.removeEventListener('pointercancel', onPointerUp);

  state.dragState = null;

  // Evaluate if the drop fulfills current instruction requirements
  evaluateAnswer(element);
}

/* ============================================================================
   6. INSTRUCTION & PREPOSITION EVALUATION ENGINE
   ============================================================================ */

/** Generates a new random preposition question based on active objects */
function generateNextInstruction() {
  if (state.activeObjects.length < 2) return;

  // Select random subject object
  const subjectIndex = Math.floor(Math.random() * state.activeObjects.length);
  const subjectObj = state.activeObjects[subjectIndex];

  // Select distinct target object
  let targetObj;
  do {
    const targetIndex = Math.floor(Math.random() * state.activeObjects.length);
    targetObj = state.activeObjects[targetIndex];
  } while (targetObj.id === subjectObj.id);

  // Filter available prepositions by difficulty
  let availablePrepositions = ['on', 'under', 'in'];
  if (state.difficulty === 'medium') {
    availablePrepositions.push('next to', 'behind');
  } else if (state.difficulty === 'hard') {
    availablePrepositions = [...GAME_CONFIG.prepositions];
  }

  const prep = availablePrepositions[Math.floor(Math.random() * availablePrepositions.length)];

  // For "between", select a second target object if hard mode
  let targetObj2 = null;
  if (prep === 'between' && state.activeObjects.length >= 3) {
    do {
      const idx = Math.floor(Math.random() * state.activeObjects.length);
      targetObj2 = state.activeObjects[idx];
    } while (targetObj2.id === subjectObj.id || targetObj2.id === targetObj.id);
  }

  state.currentInstruction = {
    subject: subjectObj,
    preposition: prep,
    target: targetObj,
    target2: targetObj2
  };

  // Build English Instruction Phrase
  let instructionText = `Put the <strong>${subjectObj.label}</strong> ${prep} the <strong>${targetObj.label}</strong>.`;
  if (prep === 'between' && targetObj2) {
    instructionText = `Put the <strong>${subjectObj.label}</strong> ${prep} the <strong>${targetObj.label}</strong> and the <strong>${targetObj2.label}</strong>.`;
  }

  document.getElementById('instruction-text').innerHTML = instructionText;
}

/** Evaluates whether dropped object satisfies spatial preposition constraints */
function evaluateAnswer(droppedEl) {
  if (!state.currentInstruction) return;

  const droppedId = droppedEl.getAttribute('data-id');
  const { subject, preposition, target, target2 } = state.currentInstruction;

  // If wrong object was dragged, ignore check
  if (droppedId !== subject.id) return;

  state.totalAttempts++;

  const targetEl = document.getElementById(`obj-${target.id}`);
  const subjRect = droppedEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  // Geometric center points
  const subjCenter = { x: subjRect.left + subjRect.width / 2, y: subjRect.top + subjRect.height / 2 };
  const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };

  let isCorrect = false;
  const tol = GAME_CONFIG.spatialTolerance;

  // Spatial Logic Definitions
  switch (preposition) {
    case 'on':
    case 'above':
      // Subject should be higher (smaller Y) and horizontally aligned
      isCorrect = (subjCenter.y < targetCenter.y) && Math.abs(subjCenter.x - targetCenter.x) < tol;
      break;

    case 'under':
    case 'below':
      // Subject should be lower (larger Y) and horizontally aligned
      isCorrect = (subjCenter.y > targetCenter.y) && Math.abs(subjCenter.x - targetCenter.x) < tol;
      break;

    case 'in':
    case 'in front of':
      // Overlapping bounding boxes
      isCorrect = Math.abs(subjCenter.x - targetCenter.x) < tol && Math.abs(subjCenter.y - targetCenter.y) < tol;
      break;

    case 'next to':
      // Horizontally adjacent on either left or right
      isCorrect = Math.abs(subjCenter.y - targetCenter.y) < tol && Math.abs(subjCenter.x - targetCenter.x) < (tol + 60);
      break;

    case 'behind':
      // Slightly higher and near center (simulating depth)
      isCorrect = (subjCenter.y <= targetCenter.y + 20) && Math.abs(subjCenter.x - targetCenter.x) < tol;
      break;

    case 'between':
      if (target2) {
        const target2El = document.getElementById(`obj-${target2.id}`);
        const t2Rect = target2El.getBoundingClientRect();
        const t2Center = { x: t2Rect.left + t2Rect.width / 2, y: t2Rect.top + t2Rect.height / 2 };
        
        const minX = Math.min(targetCenter.x, t2Center.x);
        const maxX = Math.max(targetCenter.x, t2Center.x);
        isCorrect = (subjCenter.x >= minX - 20 && subjCenter.x <= maxX + 20);
      }
      break;
  }

  if (isCorrect) {
    handleSuccess(droppedEl);
  } else {
    handleWrongAttempt();
  }

  updateScoreboard();
}

/** Triggered when student answers correctly */
function handleSuccess(element) {
  state.score++;
  state.questionsCompleted++;

  playTone('success');
  showFeedback('⭐ Great Job!', 'success');
  spawnStarsAround(element);

  // Check for 10-question milestone celebration
  if (state.questionsCompleted % 10 === 0) {
    setTimeout(() => {
      playTone('celebration');
      showFeedback('🎉 10 Completed! Awesome!', 'success');
    }, 600);
  }

  // Auto-generate next instruction after short pause
  setTimeout(() => {
    generateNextInstruction();
  }, 1200);
}

/** Triggered on incorrect drop placement */
function handleWrongAttempt() {
  playTone('error');
  showFeedback('❌ Try Again!', 'error');
}

/* ============================================================================
   7. FEEDBACK, ANIMATIONS & TEACHER HINTS
   ============================================================================ */

/** Displays temporary visual banner message */
function showFeedback(text, type) {
  const banner = document.getElementById('feedback-banner');
  banner.textContent = text;
  banner.className = `feedback-banner ${type}`;

  setTimeout(() => {
    banner.classList.add('hidden');
  }, 1000);
}

/** Highlights subject and target objects for assistance */
function showHint() {
  if (!state.currentInstruction) return;

  const subjEl = document.getElementById(`obj-${state.currentInstruction.subject.id}`);
  const targetEl = document.getElementById(`obj-${state.currentInstruction.target.id}`);

  subjEl.classList.add('highlight-hint');
  targetEl.classList.add('highlight-hint');

  setTimeout(() => {
    subjEl.classList.remove('highlight-hint');
    targetEl.classList.remove('highlight-hint');
  }, 2000);
}

/** Spawns cute floating stars particle effect on success */
function spawnStarsAround(element) {
  const rect = element.getBoundingClientRect();
  const scene = document.getElementById('scene-container');

  for (let i = 0; i < 6; i++) {
    const star = document.createElement('div');
    star.className = 'star-particle';
    star.textContent = '⭐';
    star.style.left = `${rect.left + Math.random() * rect.width - 10}px`;
    star.style.top = `${rect.top + Math.random() * rect.height - 10}px`;
    
    scene.appendChild(star);

    setTimeout(() => star.remove(), 1000);
  }
}

/** Updates Scoreboard Stats */
function updateScoreboard() {
  document.getElementById('score-val').textContent = state.score;
  document.getElementById('completed-val').textContent = state.questionsCompleted;

  const accuracy = state.totalAttempts > 0 
    ? Math.round((state.score / state.totalAttempts) * 100) 
    : 100;

  document.getElementById('accuracy-val').textContent = `${accuracy}%`;
}

/* ============================================================================
   8. AUDIO SYNTHESIZER & SYSTEM CONTROLS (FULL OFFLINE WORK)
   ============================================================================ */

/** Synthesizes audio tones using standard browser Web Audio API */
function playTone(type) {
  if (state.isMuted || !audioCtx) return;

  const freqs = GAME_CONFIG.soundEffects[type] || [440];
  let startTime = audioCtx.currentTime;

  freqs.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type === 'error' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

    gain.gain.setValueAtTime(0.2, startTime + idx * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + (idx + 1) * 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime + idx * 0.12);
    osc.stop(startTime + (idx + 1) * 0.12);
  });
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  const btn = document.getElementById('btn-mute');
  btn.textContent = state.isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
