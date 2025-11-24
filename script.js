// Copyright (c) 2025 Sai
// All rights reserved. Unauthorized copying, modification, or distribution of this project,
// via any medium, is strictly prohibited without the author’s permission.

// ===== Elements =====
// Copyright 2024 
// Created By: Ali Haider  
// All Rights Reserved

const videoEl = document.getElementById("videoEl");
const overlay = document.getElementById("overlay");
const handOutline = document.getElementById("handOutline");
const playBtn = document.getElementById("playBtn");
const galaxyCanvas = document.getElementById("galaxyCanvas");
const reveal = document.getElementById("reveal");

const ctx = overlay.getContext("2d");
const gctx = galaxyCanvas.getContext("2d");

let handPresent = false;

// Make canvas match video at all times
function resizeCanvases() {
  const rect = videoEl.getBoundingClientRect();
  overlay.width = rect.width;
  overlay.height = rect.height;
  galaxyCanvas.width = rect.width;
  galaxyCanvas.height = rect.height;
}

window.addEventListener("resize", resizeCanvases);

// Start camera with mobile-friendly high resolution
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    videoEl.srcObject = stream;
    videoEl.onloadedmetadata = () => resizeCanvases();
  } catch (e) {
    alert("Camera access failed: " + e);
  }
}

// Mediapipe hands
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.65,
  minTrackingConfidence: 0.5,
});

hands.onResults((results) => {
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (!results.multiHandLandmarks.length) {
    handPresent = false;
    return;
  }

  handPresent = true;

  for (let landmarks of results.multiHandLandmarks) {
    drawingUtils.drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS,
      {color: "aqua", lineWidth: 4});
    drawingUtils.drawLandmarks(ctx, landmarks, {color: "white", radius: 3});
  }
});

// Animate galaxy canvas when hand detected
function animateGalaxy(timestamp) {
  gctx.clearRect(0,0,galaxyCanvas.width, galaxyCanvas.height);

  if (handPresent) {
    galaxyCanvas.style.opacity = 0.8;

    let t = timestamp * 0.002;
    let w = galaxyCanvas.width;
    let h = galaxyCanvas.height;

    for (let i = 0; i < 150; i++) {
      let x = (Math.sin(i + t) * 0.5 + 0.5) * w;
      let y = (Math.cos(i * 0.7 + t) * 0.5 + 0.5) * h;

      gctx.beginPath();
      gctx.arc(x, y, 2, 0, Math.PI * 2);
      gctx.fillStyle = "rgba(0,180,255,0.8)";
      gctx.fill();
    }
  } else {
    galaxyCanvas.style.opacity = 0;
  }

  requestAnimationFrame(animateGalaxy);
}

// Reveal video after scan
playBtn.addEventListener("click", () => {
  playBtn.style.display = "none";

  setTimeout(() => {
    reveal.src = "final.mp4";
    reveal.style.display = "block";
    reveal.play();
  }, 3000);
});

// Start camera + animations
startCamera();
requestAnimationFrame(animateGalaxy);

// Feed frames to Mediapipe
const camera = new Camera(videoEl, {
  onFrame: async () => {
    await hands.send({ image: videoEl });
  },
});
camera.start();
