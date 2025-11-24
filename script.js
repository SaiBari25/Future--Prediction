// Copyright (c) 2025 Sai
// All rights reserved. Unauthorized copying, modification, or distribution of this project,
// via any medium, is strictly prohibited without the author’s permission.


// Elements
const videoEl = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const scanner = document.getElementById('scanner');
const holo = document.getElementById('holoSequence');
const line1 = document.getElementById('line1');
const line2 = document.getElementById('line2');
const line3 = document.getElementById('line3');
const finalVideo = document.getElementById('finalVideo');
const reveal = document.getElementById('reveal');
const playBtn = document.getElementById('playBtn');

const galaxyCanvas = document.getElementById('galaxy');
const gctx = galaxyCanvas.getContext('2d');

// Resize canvases
function resizeCanvases() {
  overlay.width = videoEl.clientWidth;
  overlay.height = videoEl.clientHeight;
  galaxyCanvas.width = window.innerWidth;
  galaxyCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvases);

// Galaxy background animation
function drawGalaxy() {
  gctx.clearRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);
  const grd = gctx.createRadialGradient(
    galaxyCanvas.width * 0.5, galaxyCanvas.height * 0.6, 80,
    galaxyCanvas.width * 0.5, galaxyCanvas.height * 0.6, galaxyCanvas.width * 0.7
  );
  grd.addColorStop(0, 'rgba(20,30,70,0.3)');
  grd.addColorStop(1, 'rgba(0,0,0,0.1)');
  gctx.fillStyle = grd;
  gctx.fillRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * galaxyCanvas.width;
    const y = Math.random() * galaxyCanvas.height;
    const r = Math.random() * 1.2;
    gctx.fillStyle = `rgba(120,180,255,${Math.random() * 0.6})`;
    gctx.beginPath();
    gctx.arc(x, y, r, 0, Math.PI * 2);
    gctx.fill();
  }
  requestAnimationFrame(drawGalaxy);
}

// MediaPipe Hands
let hands;
let cam;
let stableStart = null;
let lastLandmarks = null;

function setupHands() {
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });
  hands.onResults(onResults);
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
  videoEl.srcObject = stream;
  await videoEl.play();
  resizeCanvases();
  cam = new Camera(videoEl, {
    onFrame: async () => {
      await hands.send({ image: videoEl });
    },
    width: 1280,
    height: 720,
  });
  cam.start();
}

// Draw neon hand overlay
function drawNeonHand(landmarks) {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  const W = overlay.width;
  const H = overlay.height;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#36d2ff';
  ctx.shadowColor = '#36d2ff';
  ctx.shadowBlur = 14;
  const t = performance.now() / 500;
  ctx.globalAlpha = 0.85 + Math.sin(t) * 0.1;

  const connections = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,9],[9,13],[13,17],[17,0],
    [5,6],[6,7],[7,8],
    [9,10],[10,11],[11,12],
    [13,14],[14,15],[15,16],
    [17,18],[18,19],[19,20],
  ];

  ctx.beginPath();
  for (const [a, b] of connections) {
    const ax = landmarks[a].x * W;
    const ay = landmarks[a].y * H;
    const bx = landmarks[b].x * W;
    const by = landmarks[b].y * H;
    ctx.moveTo(W - ax, ay);
    ctx.lineTo(W - bx, by);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(54,210,255,0.85)';
  for (const lm of landmarks) {
    const x = W - lm.x * W;
    const y = lm.y * H;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Stability check
function isStable(current, previous) {
  if (!current || !previous) return false;
  const idxs = [0, 5, 9, 13, 17];
  let drift = 0;
  for (const i of idxs) {
    const dx = current[i].x - previous[i].x;
    const dy = current[i].y - previous[i].y;
    drift += Math.sqrt(dx*dx + dy*dy);
  }
  const avgDrift = drift / idxs.length;
  return avgDrift < 0.01;
}

function onResults(results) {
  const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
  if (hasHand) {
    const lm = results.multiHandLandmarks[0];
    drawNeonHand(lm);
    if (lastLandmarks && isStable(lm, lastLandmarks)) {
      if (!stableStart) stableStart = performance.now();
      const elapsed = (performance.now() - stableStart) / 1000;
      if (elapsed >= 5) completeScan(); // 5 seconds
    } else {
      stableStart = null;
    }
    lastLandmarks = lm;
  } else {
    stableStart = null;
    lastLandmarks = null;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }
}

// Transition
function completeScan() {
  hands.onResults(() => {});
  scanner.classList.add('hidden');
  setTimeout(() => startHologram(), 600);
}

function startHologram() {
  holo.classList.add('active');
  playLine(line1, 0);
  playLine(line2, 1200);
  playLine(line3, 2400);
  setTimeout(() => {
    holo.classList.remove('active');
    showFinalVideo();
  }, 3600 + 600);
}

function playLine(el, delay) {
  setTimeout(() => {
    el.style.animation = 'neonIn 800ms ease';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, delay);
}

// Final video
async function showFinalVideo() {
  finalVideo.classList.add('active');
  reveal.muted = true;
  reveal.preload = "none";
  reveal.poster = "assets/black.png";
  try {
    await reveal.play();
    reveal.pause();
    reveal.muted = false;
    playBtn.classList.remove('hidden');
    playBtn.textContent = "▶ Tap to Reveal Future";
  } catch {
    playBtn.classList.remove('hidden');
  }
}

playBtn.addEventListener('click', async () => {
  reveal.muted = false;
  await reveal.play();
  playBtn.classList.add('hidden');
});

// Init
(async function init() {
  drawGalaxy();
  setupHands();
  try {
    await startCamera();
  } catch (err) {
    alert('Camera permission is required for the experience.');
    console.error(err);
  }
})();
