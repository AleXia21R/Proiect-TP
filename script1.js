const socket = io();

const words = [
  "pisica", "caine", "dragon", "robot", "pizza",
  "masina", "castel", "fantoma", "telefon", "astronaut",
  "broasca", "avion", "copac", "soare", "luna",
  "munte", "peste", "coroana", "sarpe", "calculator",
  "floare", "minge", "tren", "carte", "vulcan",
  "urs", "iepure", "ochelari", "microfon", "racheta"
];

let allPlayers = [];
let hostId = null;
let myName = "";
let myId = "";

let rounds = 3;
let drawTime = 60;

let currentRound = 1;
let currentDrawerIndex = 0;
let currentWord = "";

let timer = drawTime;
let timerInterval = null;

let brushSize = 8;
let brushColor = "black";

let drawing = false;
let lastX = 0;
let lastY = 0;

let hasGuessedCorrectly = false;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colors = [
  "black", "#444", "gray", "brown",
  "red", "maroon", "orange", "gold", "yellow",
  "lime", "green", "darkgreen", "blue", "darkblue",
  "purple", "violet", "pink", "magenta", "white", "beige"
];

socket.on("connect", () => {
  myId = socket.id;
});

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

function isHost() {
  return myId === hostId;
}

function isDrawer() {
  return allPlayers[currentDrawerIndex] &&
         allPlayers[currentDrawerIndex].id === myId;
}

function joinGame() {
  myName = document.getElementById("playerNameInput").value.trim();

  if (myName === "") {
    myName = "Player";
  }

  socket.emit("joinGame", myName);
  showScreen("lobbyScreen");
}

socket.on("roomFull", () => {
  alert("Camera este plina. Maxim 8 jucatori.");
});

socket.on("playersUpdate", data => {
  allPlayers = data.players;
  hostId = data.hostId;

  updateLobby();
  updatePlayersPanel();
});

function updateLobby() {
  const lobby = document.getElementById("lobbyPlayers");
  if (!lobby) return;

  lobby.innerHTML = "";

  allPlayers.forEach(player => {
    const div = document.createElement("div");
    div.className = "playerItem";
    div.innerHTML = `<b>${player.name}</b><br>Scor: ${player.score}`;
    lobby.appendChild(div);
  });

  const host = allPlayers.find(player => player.id === hostId);

  document.getElementById("hostInfo").textContent =
    host ? `Host: ${host.name}` : "Host: -";

  if (isHost()) {
    document.getElementById("hostSettings").classList.remove("hidden");
    document.getElementById("waitingText").classList.add("hidden");
  } else {
    document.getElementById("hostSettings").classList.add("hidden");
    document.getElementById("waitingText").classList.remove("hidden");
  }
}

function changeRounds(value) {
  if (!isHost()) return;

  rounds += value;

  if (rounds < 3) rounds = 3;
  if (rounds > 8) rounds = 8;

  document.getElementById("roundsText").textContent = rounds;
}

function setDrawTime(value) {
  if (!isHost()) return;

  drawTime = value;
  document.getElementById("timeText").textContent = `${value}s`;
}

function hostStartGame() {
  if (!isHost()) return;

  if (allPlayers.length < 2) {
    alert("Ai nevoie de cel putin 2 jucatori.");
    return;
  }

  socket.emit("startGame", {
    rounds,
    drawTime
  });
}

socket.on("gameStarted", settings => {
  allPlayers = settings.players;
  hostId = settings.hostId;
  rounds = settings.rounds;
  drawTime = settings.drawTime;
  currentRound = settings.currentRound;
  currentDrawerIndex = settings.currentDrawerIndex;

  goToWordChoice();
});

function getRandomWords(count) {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function goToWordChoice() {
  clearInterval(timerInterval);
  hasGuessedCorrectly = false;

  showScreen("wordChoiceScreen");

  const drawer = allPlayers[currentDrawerIndex];

  if (!drawer) return;

  if (isDrawer()) {
    document.getElementById("drawerChoiceText").textContent =
      `${myName}, alege un cuvant:`;

    const choices = getRandomWords(3);
    const container = document.getElementById("wordChoices");
    container.innerHTML = "";

    choices.forEach(word => {
      const btn = document.createElement("button");
      btn.className = "wordButton";
      btn.textContent = word;

      btn.onclick = () => {
        socket.emit("chooseWord", word);
      };

      container.appendChild(btn);
    });
  } else {
    document.getElementById("drawerChoiceText").textContent =
      `Asteapta ca ${drawer.name} sa aleaga un cuvant...`;

    document.getElementById("wordChoices").innerHTML = "";
  }
}

socket.on("wordChosen", data => {
  currentWord = data.word;
  currentRound = data.currentRound;
  currentDrawerIndex = data.currentDrawerIndex;

  startRound();
});

function startRound() {
  showScreen("gameScreen");

  hasGuessedCorrectly = false;

  clearCanvasLocal();
  createPalette();
  updatePlayersPanel();
  clearChat();

  const drawer = allPlayers[currentDrawerIndex];

  if (isDrawer()) {
    document.getElementById("drawerText").textContent =
      `Tu desenezi: ${currentWord}`;
  } else {
    document.getElementById("drawerText").textContent =
      `${drawer.name} deseneaza`;
  }

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
      if (isDrawer()) {
        socket.emit("timeEnded");
      }

      clearInterval(timerInterval);
    }
  }, 1000);
}

function updatePlayersPanel() {
  const list = document.getElementById("playersList");

  if (!list) return;

  list.innerHTML = "";

  allPlayers.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "playerItem";

    if (index === currentDrawerIndex) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <b>${player.name}</b><br>
      Scor: ${player.score}
    `;

    list.appendChild(item);
  });

  const roundText = document.getElementById("roundText");

  if (roundText) {
    roundText.textContent = `Runda ${currentRound} / ${rounds}`;
  }
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
      if (!isDrawer()) return;

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
  if (!isDrawer()) return;

  brushColor = "white";

  document.querySelectorAll(".colorBox").forEach(b => {
    b.classList.remove("selected");
  });
}

function clearCanvas() {
  if (!isDrawer()) return;

  clearCanvasLocal();
  socket.emit("clearCanvas");
}

function clearCanvasLocal() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

socket.on("clearCanvas", () => {
  clearCanvasLocal();
});

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
  if (isDrawer()) return;
  if (hasGuessedCorrectly) return;

  const input = document.getElementById("guessInput");
  const guess = input.value.trim();

  if (guess === "") return;

  if (normalize(guess) === normalize(currentWord)) {
    hasGuessedCorrectly = true;

    socket.emit("correctGuess", {
      guesserName: myName
    });

    input.value = "";
    return;
  }

  socket.emit("guess", {
    name: myName,
    text: guess
  });

  input.value = "";
}

socket.on("guess", data => {
  addChatMessage(`${data.name}: ${data.text}`);
});

socket.on("correctGuess", data => {
  addChatMessage(
    `${data.guesserName} a ghicit corect! +${data.points} puncte`,
    true
  );
});

socket.on("roundEnded", data => {
  clearInterval(timerInterval);
  drawing = false;

  addChatMessage(`Runda s-a terminat! Cuvantul era: ${data.word}`, true);
});

socket.on("nextRound", data => {
  currentRound = data.currentRound;
  currentDrawerIndex = data.currentDrawerIndex;

  goToWordChoice();
});

socket.on("gameFinished", players => {
  allPlayers = players;
  showFinalScores();
});

function showFinalScores() {
  showScreen("finalScreen");

  const final = document.getElementById("finalScores");
  final.innerHTML = "";

  allPlayers.forEach(player => {
    const p = document.createElement("h2");
    p.textContent = `${player.name}: ${player.score} puncte`;
    final.appendChild(p);
  });
}

canvas.addEventListener("mousedown", event => {
  if (!isDrawer()) return;

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
  if (!drawing || !isDrawer()) return;

  const rect = canvas.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  drawLine(lastX, lastY, x, y, brushColor, brushSize);

  socket.emit("draw", {
    x1: lastX,
    y1: lastY,
    x2: x,
    y2: y,
    color: brushColor,
    size: brushSize
  });

  lastX = x;
  lastY = y;
});

function drawLine(x1, y1, x2, y2, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

socket.on("draw", data => {
  drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.size);
});

function changeBrush(value) {
  if (!isDrawer()) return;

  brushSize += value;

  if (brushSize < 2) brushSize = 2;
  if (brushSize > 40) brushSize = 40;

  document.getElementById("brushText").textContent = brushSize;
}
