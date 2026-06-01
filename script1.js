const words = [
  "pisica", "caine", "dragon", "robot", "pizza",
  "masina", "castel", "fantoma", "telefon", "astronaut",
  "broasca", "avion", "copac", "soare", "luna",
  "munte", "peste", "coroana", "sarpe", "calculator",
  "floare", "minge", "tren", "carte", "vulcan",
  "urs", "iepure", "ochelari", "microfon", "racheta"
];

let players = 2;
let rounds = 3;
let drawTime = 60;

let playerNames = [];
let scores = [];

let currentRound = 1;
let currentDrawer = 0;
let currentWord = "";

let timer = drawTime;
let timerInterval = null;

let brushSize = 8;
let brushColor = "black";

let drawing = false;
let lastX = 0;
let lastY = 0;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colors = [
  "black", "#444", "gray", "brown",
  "red", "maroon", "orange", "gold", "yellow",
  "lime", "green", "darkgreen", "blue", "darkblue",
  "purple", "violet", "pink", "magenta", "white", "beige"
];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function showScreen(id) {
  document.querySelectorAll(".screen, #gameScreen").forEach(el => {
    el.classList.add("hidden");
  });

  document.getElementById(id).classList.remove("hidden");
}

function goToSetup() {
  showScreen("setupScreen");
}

function changePlayers(value) {
  players += value;

  if (players < 2) players = 2;
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
  showScreen("namesScreen");

  const container = document.getElementById("namesContainer");
  container.innerHTML = "";

  for (let i = 0; i < players; i++) {
    const input = document.createElement("input");
    input.className = "nameInput";
    input.placeholder = `Jucator ${i + 1}`;

    container.appendChild(input);
  }
}

function confirmNames() {
  const inputs = document.querySelectorAll(".nameInput");

  playerNames = [];
  scores = [];

  inputs.forEach((input, index) => {
    const name = input.value.trim() || `Jucator ${index + 1}`;

    playerNames.push(name);
    scores.push(0);
  });

  currentRound = 1;
  currentDrawer = 0;

  goToWordChoice();
}

function getRandomWords(count) {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function goToWordChoice() {
  clearInterval(timerInterval);

  showScreen("wordChoiceScreen");

  document.getElementById("drawerChoiceText").textContent =
    `${playerNames[currentDrawer]} deseneaza. Alege un cuvant:`;

  const choices = getRandomWords(3);

  const container = document.getElementById("wordChoices");
  container.innerHTML = "";

  choices.forEach(word => {
    const btn = document.createElement("button");

    btn.className = "wordButton";
    btn.textContent = word;
    btn.onclick = () => startRound(word);

    container.appendChild(btn);
  });
}

function startRound(word) {
  currentWord = word;

  showScreen("gameScreen");

  clearCanvas();
  createPalette();
  updatePlayersPanel();
  clearChat();

  document.getElementById("drawerText").textContent =
    `${playerNames[currentDrawer]} deseneaza`;

  timer = drawTime;

  document.getElementById("timerText").textContent = timer;
  document.getElementById("timerText").style.color = "#4b35c8";

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timer--;

    document.getElementById("timerText").textContent = timer;

    if (timer <= 10) {
      document.getElementById("timerText").style.color = "red";
    }

    if (timer <= 0) {
      endRound();
    }
  }, 1000);
}

function updatePlayersPanel() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  for (let i = 0; i < players; i++) {
    const item = document.createElement("div");

    item.className = "playerItem";

    if (i === currentDrawer) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <b>${playerNames[i]}</b><br>
      Scor: ${scores[i]}
    `;

    list.appendChild(item);
  }

  document.getElementById("roundText").textContent =
    `Runda ${currentRound} / ${rounds}`;
}

function createPalette() {
  const palette = document.getElementById("palette");
  palette.innerHTML = "";

  colors.forEach((color, index) => {
    const box = document.createElement("div");

    box.className = "colorBox";
    box.style.background = color;

    if (index === 0) {
      box.classList.add("selected");
    }

    box.onclick = () => {
      brushColor = color;

      document.querySelectorAll(".colorBox").forEach(b => {
        b.classList.remove("selected");
      });

      box.classList.add("selected");
    };

    palette.appendChild(box);
  });

  brushColor = "black";
}

function selectEraser() {
  brushColor = "white";

  document.querySelectorAll(".colorBox").forEach(b => {
    b.classList.remove("selected");
  });
}

function clearChat() {
  document.getElementById("chatMessages").innerHTML = "";
  document.getElementById("guessInput").value = "";
}

function addChatMessage(text, correct = false) {
  const chat = document.getElementById("chatMessages");
  const div = document.createElement("div");

  div.className = correct ? "chatMessage correct" : "chatMessage";
  div.textContent = text;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function sendGuess() {
  const input = document.getElementById("guessInput");
  const guess = input.value.trim();

  if (guess === "") return;

  const guessingPlayer = getNextGuessingPlayer();

  if (normalize(guess) === normalize(currentWord)) {
    scores[guessingPlayer] += 100;
    scores[currentDrawer] += 50;

    addChatMessage(`${playerNames[guessingPlayer]} a ghicit corect!`, true);
    updatePlayersPanel();

    input.value = "";
    endRound();

    return;
  }

  addChatMessage(`${playerNames[guessingPlayer]}: ${guess}`);
  input.value = "";
}

function getNextGuessingPlayer() {
  for (let i = 0; i < players; i++) {
    if (i !== currentDrawer) {
      return i;
    }
  }

  return currentDrawer;
}

function endRound() {
  clearInterval(timerInterval);
  drawing = false;

  addChatMessage(`Runda s-a terminat! Cuvantul era: ${currentWord}`, true);

  setTimeout(() => {
    currentDrawer++;

    if (currentDrawer >= players) {
      currentDrawer = 0;
      currentRound++;
    }

    if (currentRound > rounds) {
      showFinalScores();
    } else {
      goToWordChoice();
    }
  }, 1800);
}

function showFinalScores() {
  showScreen("finalScreen");

  const final = document.getElementById("finalScores");
  final.innerHTML = "";

  for (let i = 0; i < players; i++) {
    const p = document.createElement("h2");

    p.textContent = `${playerNames[i]}: ${scores[i]} puncte`;

    final.appendChild(p);
  }
}

canvas.addEventListener("mousedown", event => {
  drawing = true;

  const rect = canvas.getBoundingClientRect();

  lastX = event.clientX - rect.left;
  lastY = event.clientY - rect.top;
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
});

canvas.addEventListener("mousemove", event => {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  ctx.strokeStyle = brushColor;
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

function changeBrush(value) {
  brushSize += value;

  if (brushSize < 2) brushSize = 2;
  if (brushSize > 40) brushSize = 40;

  document.getElementById("brushText").textContent = brushSize;
}

function clearCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
