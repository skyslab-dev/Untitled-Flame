"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const intro = document.querySelector("#intro");
const beginButton = document.querySelector("#begin");
const ending = document.querySelector("#ending");
const endingTitle = document.querySelector("#ending-title");
const endingCopy = document.querySelector("#ending-copy");
const againButton = document.querySelector("#again");
const statusText = document.querySelector("#status");
const instruction = document.querySelector("#instruction");

const WIDTH = 960;
const HEIGHT = 540;
const candle = { x: 335, y: 282 };

const possibilities = [
  {
    id: "tower",
    name: "the drowned bells",
    x: 760,
    y: 245,
    radius: 76,
    color: "#b9a6d8",
    title: "The City of Drowned Bells",
    copy: "The colossus rests beneath towers that still ring under an absent sea.",
  },
  {
    id: "forest",
    name: "the watching forest",
    x: 650,
    y: 360,
    radius: 80,
    color: "#82b69d",
    title: "The Forest That Learned to Watch",
    copy: "Every tree opens its eyes, and for once the colossus does not look away.",
  },
  {
    id: "sea",
    name: "the black sea",
    x: 850,
    y: 420,
    radius: 78,
    color: "#79a8c4",
    title: "The Shore Beneath the Last Moon",
    copy: "The road ends in quiet water. Beyond it, no world has yet been chosen.",
  },
];

const state = {
  phase: "intro",
  pointer: { x: 780, y: 270 },
  shining: false,
  keyboardAngle: -0.08,
  focused: null,
  progress: 0,
  chosen: null,
  revealTime: 0,
  walk: 0,
};

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = WIDTH * ratio;
  canvas.height = HEIGHT * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function canvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * WIDTH,
    y: ((event.clientY - bounds.top) / bounds.height) * HEIGHT,
  };
}

function reset() {
  state.phase = "choosing";
  state.pointer = { x: 780, y: 270 };
  state.shining = false;
  state.keyboardAngle = -0.08;
  state.focused = null;
  state.progress = 0;
  state.chosen = null;
  state.revealTime = 0;
  ending.hidden = true;
  statusText.textContent = "Three possibilities wait beyond the light.";
  instruction.textContent = "Move the light. Hold to make something real.";
  canvas.focus();
}

function begin() {
  intro.classList.add("is-gone");
  reset();
}

beginButton.addEventListener("click", begin);
againButton.addEventListener("click", reset);

canvas.addEventListener("pointerdown", (event) => {
  if (state.phase !== "choosing") return;
  canvas.setPointerCapture(event.pointerId);
  state.pointer = canvasPoint(event);
  state.shining = true;
});

canvas.addEventListener("pointermove", (event) => {
  state.pointer = canvasPoint(event);
});

function stopShining(event) {
  state.shining = false;
  if (event?.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener("pointerup", stopShining);
canvas.addEventListener("pointercancel", stopShining);

window.addEventListener("keydown", (event) => {
  if (state.phase !== "choosing") return;
  if (event.key === "ArrowLeft") {
    state.keyboardAngle -= 0.06;
    event.preventDefault();
  }
  if (event.key === "ArrowRight") {
    state.keyboardAngle += 0.06;
    event.preventDefault();
  }
  state.keyboardAngle = Math.max(-0.72, Math.min(0.42, state.keyboardAngle));
  if (event.key === " ") {
    state.shining = true;
    event.preventDefault();
  }
  state.pointer.x = candle.x + Math.cos(state.keyboardAngle) * 500;
  state.pointer.y = candle.y + Math.sin(state.keyboardAngle) * 500;
});

window.addEventListener("keyup", (event) => {
  if (event.key === " ") state.shining = false;
});

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawBackground(time) {
  const chosen = state.chosen;
  const reveal = Math.min(1, state.revealTime / 2.2);
  const top = chosen?.id === "tower" ? "#252039" : chosen?.id === "forest" ? "#142b27" : chosen?.id === "sea" ? "#132736" : "#13111d";
  const bottom = chosen?.id === "tower" ? "#110e1c" : chosen?.id === "forest" ? "#071411" : chosen?.id === "sea" ? "#07121b" : "#07070d";
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const moonAlpha = 0.1 + reveal * 0.55;
  ctx.fillStyle = `rgba(236, 224, 195, ${moonAlpha})`;
  ctx.beginPath();
  ctx.arc(820, 98, 34 + reveal * 10, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 48; i += 1) {
    const x = (i * 191 + state.walk * (0.2 + (i % 3) * 0.08)) % 1040 - 40;
    const y = 34 + ((i * 83) % 225);
    const flicker = 0.08 + Math.sin(time * 0.0015 + i) * 0.05 + reveal * 0.12;
    ctx.fillStyle = `rgba(229, 215, 185, ${flicker})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  if (chosen?.id === "sea") drawSea(reveal, time);
  if (chosen?.id === "forest") drawForest(reveal, time);
  if (chosen?.id === "tower") drawTowers(reveal, time);

  ctx.fillStyle = chosen ? `rgba(8, 8, 13, ${0.55 - reveal * 0.15})` : "#0a0911";
  ctx.beginPath();
  ctx.moveTo(0, 405);
  for (let x = 0; x <= WIDTH; x += 60) {
    ctx.lineTo(x, 402 + Math.sin(x * 0.023 + state.walk * 0.003) * 11);
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function drawSea(reveal, time) {
  const waterY = 365;
  ctx.fillStyle = `rgba(33, 72, 94, ${reveal * 0.62})`;
  ctx.fillRect(0, waterY, WIDTH, HEIGHT - waterY);
  ctx.strokeStyle = `rgba(151, 190, 205, ${reveal * 0.35})`;
  ctx.lineWidth = 1;
  for (let row = 0; row < 7; row += 1) {
    const y = waterY + row * 22;
    ctx.beginPath();
    for (let x = -40; x <= WIDTH + 40; x += 30) {
      const wave = Math.sin(x * 0.026 + time * 0.0018 + row) * 4;
      if (x === -40) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawForest(reveal, time) {
  for (let i = 0; i < 18; i += 1) {
    const x = 480 + i * 34;
    const height = 75 + ((i * 47) % 120);
    ctx.fillStyle = `rgba(8, 25, 22, ${reveal * 0.9})`;
    ctx.fillRect(x, 400 - height, 10, height);
    ctx.beginPath();
    ctx.arc(x + 5, 390 - height, 24 + (i % 3) * 6, 0, Math.PI * 2);
    ctx.fill();
    if (i % 3 === 0) {
      ctx.fillStyle = `rgba(162, 205, 173, ${reveal * (0.32 + Math.sin(time * 0.004 + i) * 0.12)})`;
      ctx.beginPath();
      ctx.ellipse(x + 4, 385 - height, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTowers(reveal, time) {
  for (let i = 0; i < 8; i += 1) {
    const x = 530 + i * 62;
    const height = 70 + ((i * 53) % 170);
    ctx.fillStyle = `rgba(28, 23, 43, ${reveal * 0.95})`;
    ctx.fillRect(x, 405 - height, 35, height);
    ctx.beginPath();
    ctx.moveTo(x - 7, 405 - height);
    ctx.lineTo(x + 17, 378 - height);
    ctx.lineTo(x + 42, 405 - height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(220, 192, 137, ${reveal * (0.2 + Math.sin(time * 0.002 + i) * 0.08)})`;
    ctx.fillRect(x + 14, 420 - height, 7, 12);
  }
}

function drawPossibilities(time) {
  if (state.phase !== "choosing") return;
  possibilities.forEach((option, index) => {
    const focused = state.focused === option;
    const alpha = focused ? 0.35 : 0.12;
    ctx.save();
    ctx.translate(option.x, option.y + Math.sin(time * 0.0018 + index * 2) * 4);
    ctx.strokeStyle = option.color;
    ctx.fillStyle = `rgba(160, 150, 180, ${alpha})`;
    ctx.lineWidth = focused ? 1.8 : 1;

    if (option.id === "tower") {
      ctx.fillRect(-22, -54, 44, 92);
      ctx.beginPath();
      ctx.moveTo(-31, -54);
      ctx.lineTo(0, -86);
      ctx.lineTo(31, -54);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -35, 11, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (option.id === "forest") {
      for (let i = -2; i <= 2; i += 1) {
        const height = 55 + (2 - Math.abs(i)) * 14;
        ctx.fillRect(i * 22 - 4, -height, 8, height + 38);
        ctx.beginPath();
        ctx.arc(i * 22, -height, 19, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(174, 213, 182, ${focused ? 0.68 : 0.2})`;
      ctx.beginPath();
      ctx.ellipse(-19, -53, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(26, -38, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (option.id === "sea") {
      ctx.beginPath();
      for (let x = -58; x <= 58; x += 10) {
        const y = Math.sin(x * 0.12 + time * 0.003) * 5;
        if (x === -58) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(21, -38, 21, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (focused) {
      ctx.fillStyle = option.color;
      ctx.font = "700 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(option.name.toUpperCase(), 0, option.radius + 20);
    }
    ctx.restore();
  });
}

function drawColossus(time) {
  const bob = Math.sin(time * 0.0032) * 3;
  const step = Math.sin(time * 0.006) * 7;
  ctx.save();
  ctx.translate(0, bob);

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(306, 443, 215, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#272331";
  ctx.lineCap = "round";
  ctx.lineWidth = 33;
  ctx.beginPath();
  ctx.moveTo(194, 367);
  ctx.lineTo(181 + step, 451);
  ctx.moveTo(396, 363);
  ctx.lineTo(410 - step, 451);
  ctx.stroke();

  const body = ctx.createLinearGradient(125, 270, 470, 420);
  body.addColorStop(0, "#393340");
  body.addColorStop(1, "#1c1923");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(285, 341, 179, 83, -0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2d2934";
  ctx.beginPath();
  ctx.moveTo(126, 331);
  ctx.quadraticCurveTo(75, 309, 59, 264);
  ctx.quadraticCurveTo(92, 293, 144, 290);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#504657";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(62, 266);
  ctx.quadraticCurveTo(91, 291, 139, 294);
  ctx.stroke();

  ctx.fillStyle = "#ae9f86";
  ctx.beginPath();
  ctx.arc(88, 286, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(127, 112, 132, 0.35)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(250 + i * 29, 328, 38 + i * 5, Math.PI * 1.05, Math.PI * 1.55);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCandle(time) {
  const flicker = Math.sin(time * 0.017) * 2 + Math.sin(time * 0.031) * 1.4;
  const y = candle.y + Math.sin(time * 0.0032) * 3;
  ctx.save();
  ctx.translate(candle.x, y);

  ctx.fillStyle = "#d9c6a1";
  roundedRect(-12, -15, 24, 36, 7);
  ctx.fill();
  ctx.fillStyle = "#f2dfb7";
  ctx.beginPath();
  ctx.ellipse(0, -14, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c4e49";
  ctx.fillRect(-1.5, -22, 3, 9);

  ctx.fillStyle = "#4c3e45";
  ctx.beginPath();
  ctx.arc(-4, -2, 1.4, 0, Math.PI * 2);
  ctx.arc(4, -2, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#efb957";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(-9, -31, -5, -42 - flicker, 2, -49 - flicker);
  ctx.bezierCurveTo(10, -39, 9, -28, 0, -22);
  ctx.fill();
  ctx.fillStyle = "#fff0b2";
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.bezierCurveTo(-3, -31, 0, -36, 2, -39);
  ctx.bezierCurveTo(5, -33, 4, -27, 0, -24);
  ctx.fill();
  ctx.restore();
}

function drawLight(time) {
  const target = state.pointer;
  const angle = Math.atan2(target.y - candle.y, target.x - candle.x);
  const length = 610;
  const spread = state.shining ? 0.17 : 0.08;
  const flicker = Math.sin(time * 0.014) * 0.012;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const beam = ctx.createRadialGradient(candle.x, candle.y - 22, 5, candle.x, candle.y - 22, length);
  beam.addColorStop(0, state.shining ? "rgba(255, 221, 132, 0.54)" : "rgba(255, 215, 115, 0.2)");
  beam.addColorStop(0.45, state.shining ? "rgba(239, 177, 79, 0.18)" : "rgba(239, 177, 79, 0.07)");
  beam.addColorStop(1, "rgba(234, 158, 65, 0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(candle.x, candle.y - 20);
  ctx.arc(candle.x, candle.y - 20, length, angle - spread - flicker, angle + spread + flicker);
  ctx.closePath();
  ctx.fill();

  const glow = ctx.createRadialGradient(candle.x, candle.y - 25, 3, candle.x, candle.y - 25, 95);
  glow.addColorStop(0, "rgba(255, 219, 122, 0.45)");
  glow.addColorStop(1, "rgba(255, 160, 60, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(candle.x, candle.y - 25, 95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProgress() {
  if (!state.focused || !state.shining || state.phase !== "choosing") return;
  const option = state.focused;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(option.x, option.y, option.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = option.color;
  ctx.beginPath();
  ctx.arc(option.x, option.y, option.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.progress);
  ctx.stroke();
}

function update(delta) {
  state.walk += delta * (state.phase === "revealed" ? 8 : 19);
  if (state.phase === "revealed") {
    state.revealTime += delta;
    if (state.revealTime > 3.25 && ending.hidden) {
      endingTitle.textContent = state.chosen.title;
      endingCopy.textContent = state.chosen.copy;
      ending.hidden = false;
    }
    return;
  }

  if (state.phase !== "choosing") return;
  const candidate = possibilities
    .map((option) => ({ option, distance: distance(state.pointer, option) }))
    .sort((a, b) => a.distance - b.distance)[0];
  const nextFocus = candidate.distance < candidate.option.radius * 1.15 ? candidate.option : null;

  if (nextFocus !== state.focused) {
    state.focused = nextFocus;
    state.progress = 0;
    if (nextFocus) statusText.textContent = `Hold the light on ${nextFocus.name}.`;
    else statusText.textContent = "Three possibilities wait beyond the light.";
  }

  if (state.shining && state.focused) {
    state.progress = Math.min(1, state.progress + delta / 2.25);
    if (state.progress >= 1) choose(state.focused);
  } else {
    state.progress = Math.max(0, state.progress - delta * 0.55);
  }
}

function choose(option) {
  state.chosen = option;
  state.phase = "revealed";
  state.shining = false;
  state.progress = 0;
  state.revealTime = 0;
  statusText.textContent = `${option.name} becomes real. The other possibilities are gone.`;
  instruction.textContent = "The world has made its choice.";
}

let previousTime = performance.now();
function frame(time) {
  const delta = Math.min((time - previousTime) / 1000, 0.04);
  previousTime = time;
  update(delta);
  drawBackground(time);
  drawPossibilities(time);
  drawColossus(time);
  drawLight(time);
  drawCandle(time);
  drawProgress();
  requestAnimationFrame(frame);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(frame);
