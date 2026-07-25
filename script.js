/* ============================================================================
   TEACHER CUSTOMIZATION SECTION
   ============================================================================ */
const GAME_CONFIG = {
  spatialTolerance: 80,
  soundEffects: {
    success: [523.25, 659.25, 783.99, 1046.50],
    error: [220, 196],
    click: [400],
    celebration: [440, 554.37, 659.25, 880]
  },
  prepositions: ['on', 'under', 'in', 'next to', 'behind', 'between', 'in front of', 'above', 'below'],
  
  /* EDIT YOUR OBJECTS & PICTURES HERE
     - To use an uploaded picture: set image: 'cat.png'
     - To change the word/label: change label: 'Kitten' or 'Cat'
  */
  objects: [
    { id: 'cat',       label: 'Cat',       image: '', emoji: '🐱', width: 70,  height: 70,  difficulty: 'easy' },
    { id: 'dog',       label: 'Dog',       image: '', emoji: '🐶', width: 75,  height: 75,  difficulty: 'easy' },
    { id: 'sofa',      label: 'Sofa',      image: '', emoji: '🛋️', width: 140, height: 90,  difficulty: 'easy' },
    { id: 'chair',     label: 'Chair',     image: '', emoji: '🪑', width: 80,  height: 90,  difficulty: 'easy' },
    { id: 'toybox',    label: 'Toy Box',   image: '', emoji: '🧸', width: 100, height: 80,  difficulty: 'easy' },
    { id: 'tv',        label: 'TV',        image: '', emoji: '📺', width: 110, height: 90,  difficulty: 'medium' },
    { id: 'table',     label: 'Table',     image: '', emoji: '🪵', width: 130, height: 80,  difficulty: 'medium' },
    { id: 'carpet',    label: 'Carpet',    image: '', emoji: '🟦', width: 160, height: 60,  difficulty: 'medium' },
    { id: 'lamp',      label: 'Lamp',      image: '', emoji: '💡', width: 60,  height: 90,  difficulty: 'medium' },
    { id: 'bookshelf', label: 'Bookshelf', image: '', emoji: '📚', width: 100, height: 130, difficulty: 'medium' },
    { id: 'clock',     label: 'Clock',     image: '', emoji: '⏰', width: 60,  height: 60,  difficulty: 'hard' },
    { id: 'window',    label: 'Window',    image: '', emoji: '🪟', width: 100, height: 100, difficulty: 'hard' },
    { id: 'flowers',   label: 'Flowers',   image: '', emoji: '💐', width: 60,  height: 60,  difficulty: 'hard' },
    { id: 'ball',      label: 'Ball',      image: '', emoji: '⚽', width: 60,  height: 60,  difficulty: 'hard' },
    { id: 'bed',       label: 'Bed',       image: '', emoji: '🛏️', width: 140, height: 100, difficulty: 'hard' },
    { id: 'pillow',    label: 'Pillow',    image: '', emoji: '🪶', width: 60,  height: 50,  difficulty: 'hard' },
    { id: 'bear',      label: 'Teddy Bear',image: '', emoji: '🧸', width: 65,  height: 65,  difficulty: 'hard' }
  ]
};

const state = {
  difficulty: 'medium',
  activeObjects: [],
  currentInstruction: null,
  score: 0,
  questionsCompleted: 0,
  totalAttempts: 0,
  isMuted: false,
  dragState: null
};

let audioCtx = null;

function unlockAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', unlockAudio, { once: true });
  document.body.addEventListener('touchstart', unlockAudio, { once: true });

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

  startNewGame();
});

function startNewGame() {
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

function renderScene() {
  const scene = document.getElementById('scene-container');
  scene.innerHTML = '';

  state.activeObjects.forEach((obj) => {
    const el = document.createElement('div');
    el.className = 'draggable-object';
    el.id = `obj-${obj.id}`;
    el.setAttribute('data-id', obj.id);

    el.style.width = `${obj.width}px`;
    el.style.height = `${obj.height}px`;

    // Render image if uploaded, otherwise use emoji
    const visualContent = obj.image 
      ? `<img src="${obj.image}" class="object-img" alt="${obj.label}">`
      : `<div class="object-avatar">${obj.emoji}</div>`;

    el.innerHTML = `
      ${visualContent}
      <div class="object-label">${obj.label}</div>
    `;

    scene.appendChild(el);
    attachDragListeners(el);
  });

  shuffleObjectPositions();
}

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

function shuffleObjectPositions() {
  const scene = document.getElementById('scene-container');
  const sceneWidth = scene.clientWidth || 800;
  const sceneHeight = scene.clientHeight || 500;

  state.activeObjects.forEach((obj) => {
    const el = document.getElementById(`obj-${obj.id}`);
    if (!el) return;

    const randomX = Math.random() * (sceneWidth - obj.width - 40) + 20;
    const randomY = Math.random() * (sceneHeight - obj.height - 40) + 20;

    el.style.left = `${Math.max(10, randomX)}px`;
    el.style.top = `${Math.max(10, randomY)}px`;
  });
}

function attachDragListeners(element) {
  element.addEventListener('pointerdown', onPointerDown);
}

function onPointerDown(e) {
  unlockAudio();
  e.preventDefault();
  const el = e.currentTarget;
  
  if (el.setPointerCapture) {
    try { el.setPointerCapture(e.pointerId); } catch(err) {}
  }
  
  el.classList.add('is-dragging');

  const rect = el.getBoundingClientRect();
  const parentRect = document.getElementById('scene-container').getBoundingClientRect();

  state.dragState = {
    element: el,
    pointerId: e.pointerId,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    parentRect: parentRect
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(e) {
  if (!state.dragState) return;

  const { element, offsetX, offsetY, parentRect } = state.dragState;

  let newX = e.clientX - parentRect.left - offsetX;
  let newY = e.clientY - parentRect.top - offsetY;

  newX = Math.max(0, Math.min(parentRect.width - element.offsetWidth, newX));
  newY = Math.max(0, Math.min(parentRect.height - element.offsetHeight, newY));

  element.style.left = `${newX}px`;
  element.style.top = `${newY}px`;
}

function onPointerUp(e) {
  if (!state.dragState) return;

  const { element, pointerId } = state.dragState;
  
  if (element.releasePointerCapture) {
    try { element.releasePointerCapture(pointerId); } catch(err) {}
  }

  element.classList.remove('is-dragging');

  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);

  const droppedEl = state.dragState.element;
  state.dragState = null;

  evaluateAnswer(droppedEl);
}

function generateNextInstruction() {
  if (state.activeObjects.length < 2) return;

  const subjectIndex = Math.floor(Math.random() * state.activeObjects.length);
  const subjectObj = state.activeObjects[subjectIndex];

  let targetObj;
  do {
    const targetIndex = Math.floor(Math.random() * state.activeObjects.length);
    targetObj = state.activeObjects[targetIndex];
  } while (targetObj.id === subjectObj.id);

  let availablePrepositions = ['on', 'under', 'in'];
  if (state.difficulty === 'medium') {
    availablePrepositions.push('next to', 'behind');
  } else if (state.difficulty === 'hard') {
    availablePrepositions = [...GAME_CONFIG.prepositions];
  }

  const prep = availablePrepositions[Math.floor(Math.random() * availablePrepositions.length)];

  let targetObj2 = null;
  if (prep === 'between' && state.activeObjects.length >= 3) {
    do {
      const idx = Math.floor(Math.random() * state.activeObjects.length);
      targetObj2 = state.activeObjects[idx];
    } while (targetObj2.id === subjectObj.id || targetObj2.id === targetObj.id);
  }

  state.currentInstruction = { subject: subjectObj, preposition: prep, target: targetObj, target2: targetObj2 };

  let instructionText = `Put the <strong>${subjectObj.label}</strong> ${prep} the <strong>${targetObj.label}</strong>.`;
  if (prep === 'between' && targetObj2) {
    instructionText = `Put the <strong>${subjectObj.label}</strong> ${prep} the <strong>${targetObj.label}</strong> and the <strong>${targetObj2.label}</strong>.`;
  }

  document.getElementById('instruction-text').innerHTML = instructionText;
}

function evaluateAnswer(droppedEl) {
  if (!state.currentInstruction) return;

  const droppedId = droppedEl.getAttribute('data-id');
  const { subject, preposition, target, target2 } = state.currentInstruction;

  if (droppedId !== subject.id) return;

  state.totalAttempts++;

  const targetEl = document.getElementById(`obj-${target.id}`);
  const subjRect = droppedEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  const subjCenter = { x: subjRect.left + subjRect.width / 2, y: subjRect.top + subjRect.height / 2 };
  const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };

  let isCorrect = false;
  const tol = GAME_CONFIG.spatialTolerance;

  switch (preposition) {
    case 'on':
    case 'above':
      isCorrect = (subjCenter.y < targetCenter.y) && Math.abs(subjCenter.x - targetCenter.x) < tol;
      break;

    case 'under':
    case 'below':
      isCorrect = (subjCenter.y > targetCenter.y) && Math.abs(subjCenter.x - targetCenter.x) < tol;
      break;

    case 'in':
    case 'in front of':
      isCorrect = Math.abs(subjCenter.x - targetCenter.x) < tol && Math.abs(subjCenter.y - targetCenter.y) < tol;
      break;

    case 'next to':
      isCorrect = Math.abs(subjCenter.y - targetCenter.y) < tol && Math.abs(subjCenter.x - targetCenter.x) < (tol + 60);
      break;

    case 'behind':
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

function handleSuccess(element) {
  state.score++;
  state.questionsCompleted++;

  playTone('success');
  showFeedback('⭐ Great Job!', 'success');
  spawnStarsAround(element);

  if (state.questionsCompleted % 10 === 0) {
    setTimeout(() => {
      playTone('celebration');
      showFeedback('🎉 10 Completed! Awesome!', 'success');
    }, 500);
  }

  setTimeout(() => {
    generateNextInstruction();
  }, 1200);
}

function handleWrongAttempt() {
  playTone('error');
  showFeedback('❌ Try Again!', 'error');
}

function showFeedback(text, type) {
  const banner = document.getElementById('feedback-banner');
  banner.textContent = text;
  banner.className = `feedback-banner ${type}`;

  setTimeout(() => {
    banner.classList.add('hidden');
  }, 1000);
}

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

function spawnStarsAround(element) {
  const rect = element.getBoundingClientRect();
  const scene = document.getElementById('scene-container');

  for (let i = 0; i < 5; i++) {
    const star = document.createElement('div');
    star.className = 'star-particle';
    star.textContent = '⭐';
    star.style.left = `${rect.left + Math.random() * rect.width}px`;
    star.style.top = `${rect.top + Math.random() * rect.height}px`;
    scene.appendChild(star);
    setTimeout(() => star.remove(), 1000);
  }
}

function updateScoreboard() {
  document.getElementById('score-val').textContent = state.score;
  document.getElementById('completed-val').textContent = state.questionsCompleted;

  const accuracy = state.totalAttempts > 0 
    ? Math.round((state.score / state.totalAttempts) * 100) 
    : 100;

  document.getElementById('accuracy-val').textContent = `${accuracy}%`;
}

function playTone(type) {
  if (state.isMuted) return;
  unlockAudio();
  if (!audioCtx) return;

  const freqs = GAME_CONFIG.soundEffects[type] || [440];
  let startTime = audioCtx.currentTime;

  freqs.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type === 'error' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, startTime + idx * 0.1);

    gain.gain.setValueAtTime(0.15, startTime + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + (idx + 1) * 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime + idx * 0.1);
    osc.stop(startTime + (idx + 1) * 0.1);
  });
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  document.getElementById('btn-mute').textContent = state.isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
