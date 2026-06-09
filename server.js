const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { execFileSync } = require("child_process");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let hostId = null;

let rounds = 3;
let drawTime = 60;

let currentRound = 1;
let currentDrawerIndex = 0;
let currentWord = "";

let guessedPlayers = [];
let roundActive = false;
let roundEnded = false;
let currentTimeLeft = 0;

function runC(args) {
  try {
    return execFileSync("./logic1", args, {
      encoding: "utf8"
    }).trim();
  } catch (error) {
    console.log("Eroare la apelarea C:", error.message);
    return "";
  }
}

function getWordsFromC() {
  const seed = Date.now() + currentRound + currentDrawerIndex;
  const result = runC(["words", String(seed)]);

  if (!result) {
    return ["pisica", "robot", "telefon"];
  }

  return result.split(",");
}

function checkGuessWithC(guess, answer) {
  return runC(["check", guess, answer]) === "1";
}

function calculatePointsWithC(position, timeLeft) {
  const result = runC(["points", String(position), String(timeLeft)]);
  const points = Number(result);

  if (isNaN(points)) return 20;

  return points;
}

function drawerBonusWithC() {
  const result = runC(["bonus"]);
  const bonus = Number(result);

  if (isNaN(bonus)) return 30;

  return bonus;
}

function getNextDrawerFromC() {
  const result = runC([
    "nextdrawer",
    String(currentDrawerIndex),
    String(players.length)
  ]);

  const next = Number(result);

  if (isNaN(next)) {
    return (currentDrawerIndex + 1) % players.length;
  }

  return next;
}

function shouldEndRoundWithC() {
  return runC([
    "endround",
    String(guessedPlayers.length),
    String(players.length)
  ]) === "1";
}

function sortPlayersWithC() {
  const input = players
    .map(player => `${player.name}:${player.score}`)
    .join(",");

  const result = runC(["sort", input]);

  if (!result) return players;

  const sorted = result.split(",").map(item => {
    const [name, score] = item.split(":");

    const originalPlayer = players.find(player => player.name === name);

    return {
      id: originalPlayer ? originalPlayer.id : "",
      name,
      score: Number(score)
    };
  });

  return sorted;
}

function saveScoresWithC() {
  const input = players
    .map(player => `${player.name}:${player.score}`)
    .join(",");

  runC(["save", input]);
}

function getDrawer() {
  return players[currentDrawerIndex];
}

function resetGame() {
  currentRound = 1;
  currentDrawerIndex = 0;
  currentWord = "";
  guessedPlayers = [];
  roundActive = false;
  roundEnded = false;
  currentTimeLeft = drawTime;

  players = players.map(player => {
    player.score = 0;
    return player;
  });
}

function sendWordsToDrawer() {
  const drawer = getDrawer();

  if (!drawer) return;

  const choices = getWordsFromC();

  console.log("Cuvinte generate de C:", choices);

  io.emit("waitingForWord", {
    drawerName: drawer.name,
    currentRound,
    currentDrawerIndex
  });

  io.to(drawer.id).emit("chooseWords", {
    choices
  });
}

function advanceRound() {
  if (players.length === 0) return;

  const oldDrawer = currentDrawerIndex;

  currentDrawerIndex = getNextDrawerFromC();

  if (currentDrawerIndex <= oldDrawer) {
    currentRound++;
  }

  currentWord = "";
  guessedPlayers = [];
  roundActive = false;
  roundEnded = false;
  currentTimeLeft = drawTime;

  if (currentRound > rounds) {
    const sortedPlayers = sortPlayersWithC();
    players = sortedPlayers;

    saveScoresWithC();

    io.emit("gameFinished", players);
  } else {
    io.emit("nextRound", {
      currentRound,
      currentDrawerIndex,
      players
    });

    setTimeout(() => {
      sendWordsToDrawer();
    }, 500);
  }
}

io.on("connection", socket => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", name => {
    if (!hostId) {
      hostId = socket.id;
    }

    if (players.length >= 8) {
      socket.emit("roomFull");
      return;
    }

    const exists = players.find(player => player.id === socket.id);

    if (!exists) {
      players.push({
        id: socket.id,
        name: name || `Player ${players.length + 1}`,
        score: 0
      });
    }

    io.emit("playersUpdate", {
      players,
      hostId
    });
  });

  socket.on("startGame", settings => {
    if (socket.id !== hostId) return;

    rounds = settings.rounds;
    drawTime = settings.drawTime;
    currentTimeLeft = drawTime;

    resetGame();

    io.emit("playersUpdate", {
      players,
      hostId
    });

    io.emit("gameStarted", {
      players,
      hostId,
      rounds,
      drawTime,
      currentRound,
      currentDrawerIndex
    });

    setTimeout(() => {
      sendWordsToDrawer();
    }, 500);
  });

  socket.on("chooseWord", word => {
    const drawer = getDrawer();

    if (!drawer || socket.id !== drawer.id) return;

    currentWord = word;
    guessedPlayers = [];
    roundActive = true;
    roundEnded = false;
    currentTimeLeft = drawTime;

    socket.emit("drawerWord", {
      word: currentWord
    });

    io.emit("wordChosen", {
      currentRound,
      currentDrawerIndex
    });
  });

  socket.on("timerUpdate", timeLeft => {
    const drawer = getDrawer();

    if (!drawer || socket.id !== drawer.id) return;

    currentTimeLeft = timeLeft;
  });

  socket.on("draw", data => {
    const drawer = getDrawer();

    if (!drawer || socket.id !== drawer.id) return;

    socket.broadcast.emit("draw", data);
  });

  socket.on("clearCanvas", () => {
    const drawer = getDrawer();

    if (!drawer || socket.id !== drawer.id) return;

    io.emit("clearCanvas");
  });

  socket.on("guess", data => {
    if (!roundActive || roundEnded) return;

    const drawer = getDrawer();

    if (!drawer) return;
    if (socket.id === drawer.id) return;
    if (guessedPlayers.includes(socket.id)) return;

    const correct = checkGuessWithC(data.text, currentWord);

    if (!correct) {
      io.emit("guess", {
        name: data.name,
        text: data.text
      });

      return;
    }

    guessedPlayers.push(socket.id);

    const position = guessedPlayers.length;
    const points = calculatePointsWithC(position, currentTimeLeft);
    const drawerBonus = drawerBonusWithC();

    players = players.map(player => {
      if (player.id === socket.id) {
        player.score += points;
      }

      if (player.id === drawer.id) {
        player.score += drawerBonus;
      }

      return player;
    });

    io.emit("playersUpdate", {
      players,
      hostId
    });

    io.emit("correctGuess", {
      guesserId: socket.id,
      guesserName: data.name,
      points
    });

    if (shouldEndRoundWithC()) {
      roundEnded = true;
      roundActive = false;

      io.emit("roundEnded", {
        word: currentWord
      });

      setTimeout(() => {
        advanceRound();
      }, 1800);
    }
  });

  socket.on("timeEnded", () => {
    const drawer = getDrawer();

    if (!drawer || socket.id !== drawer.id) return;
    if (roundEnded) return;

    roundEnded = true;
    roundActive = false;

    io.emit("roundEnded", {
      word: currentWord
    });

    setTimeout(() => {
      advanceRound();
    }, 1800);
  });

  socket.on("disconnect", () => {
    players = players.filter(player => player.id !== socket.id);

    if (socket.id === hostId) {
      hostId = players.length > 0 ? players[0].id : null;
    }

    if (currentDrawerIndex >= players.length) {
      currentDrawerIndex = 0;
    }

    io.emit("playersUpdate", {
      players,
      hostId
    });

    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
