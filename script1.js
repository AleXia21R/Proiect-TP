const startScreen = document.getElementById("startScreen");
const setupScreen = document.getElementById("setupScreen");
const namesScreen = document.getElementById("namesScreen");
const drawScreen = document.getElementById("drawScreen");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let players = 1;
let rounds = 3;
let drawTime = 60;

let playerNames = [];
let currentRound = 1;

let timer = drawTime;
let timerInterval = null;

let drawing = false;
let lastX = 0;
let lastY = 0;

let brushSize = 8;

function hideAllScreens() {
  startScreen.classList.add("hidden");
  setupScreen.classList.add("hidden");
  namesScreen.classList.add("hidden");
  drawScreen.classList.add("hidden");
}

function goToSetup() {
  hideAllScreens();
  setupScreen.classList.remove("hidden");
}

function changePlayers(value) {
  players += value;

  if (players < 1) players = 1;
  if (players > 6) players = 6;

  document.getElementById("playersText").textContent = players;
}

function changeRounds(value) {
  rounds += value;

  if (rounds < 3) rounds = 3;
  if (rounds > 8) rounds = 8;

  document.getElementById("roundsText").textContent = rounds;
}

function setDrawTime(value) {
  drawTime = value;
  document.getElementById("timeText").textContent = `${value}s`;
}

function goToNames() {
  hideAllScreens();
  namesScreen.classList.remove("hidden");

  const container = document.getElementById("namesContainer");
  container.innerHTML = "";

  for (let i = 0; i < players; i++) {
    const input = document.createElement("input");
    input.placeholder = `Jucator ${i + 1}`;
    input.className = "nameInput";
    container.appendChild(input);
    container.appendChild(document.createElement("br"));
  }
}

function startGame() {
  const inputs = document.querySelectorAll(".nameInput");
  playerNames = [];

  inputs.forEach((input, index) => {
    let name = input.value.trim();

    if (name === "") {
      name = `Jucator ${index + 1}`;
    }

    playerNames.push(name);
  });

  currentRound = 1;

  if (window.cReady) {
    Module._set_game_config(players, rounds, drawTime);
    players = Module._get_players();
    rounds = Module._get_rounds();
    drawTime = Module._get_draw_time();

    Module._set_brush_size(8);
    brushSize = Module._get_brush_size();
  }

  hideAllScreens();
  drawScreen.classList.remove("hidden");

  updateGameInfo();
  updatePlayersList();
  clearCanvas();
  startTimer();
}

function updateGameInfo() {
  document.getElementById("roundInfo").textContent = `${currentRound} / ${rounds}`;
  document.getElementById("brushText").textContent = brushSize;
}

function updatePlayersList() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  playerNames.forEach((name, index) => {
    const div = document.createElement("div");
    div.className = "playerItem";
    div.textContent = name;
    list.appendChild(div);
  });
}

function startTimer() {
  clearInterval(timerInterval);

  timer = drawTime;
  document.getElementById("timerText").textContent = timer;

  timerInterval = setInterval(() => {
    timer--;
    document.getElementById("timerText").textContent = timer;

    if (timer <= 0) {
      clearInterval(timerInterval);
      drawing = false;
      alert("Timpul de desen s-a terminat!");
    }
  }, 1000);
}

function changeBrush(value) {
  if (window.cReady) {
    Module._change_brush_size(value);
    brushSize = Module._get_brush_size();
  } else {
    brushSize += value;

    if (brushSize < 2) brushSize = 2;
    if (brushSize > 40) brushSize = 40;
  }

  document.getElementById("brushText").textContent = brushSize;
}

function clearCanvas() {
  if (window.cReady) {
    if (Module._should_clear_canvas() !== 1) {
      return;
    }
  }

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener("mousedown", function(event) {
  drawing = true;

  const rect = canvas.getBoundingClientRect();
  lastX = event.clientX - rect.left;
  lastY = event.clientY - rect.top;
});

canvas.addEventListener("mouseup", function() {
  drawing = false;
});

canvas.addEventListener("mouseleave", function() {
  drawing = false;
});

canvas.addEventListener("mousemove", function(event) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  ctx.strokeStyle = "black";
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  lastX = x;
  lastY = y;
});
