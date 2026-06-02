const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

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

function getDrawer() {
  return players[currentDrawerIndex];
}

function resetGame() {
  currentRound = 1;
  currentDrawerIndex = 0;
  guessedPlayers = [];
  roundActive = false;
  roundEnded = false;

  players = players.map(player => {
    player.score = 0;
    return player;
  });
}

function nextRound() {
  currentDrawerIndex++;

  if (currentDrawerIndex >= players.length) {
    currentDrawerIndex = 0;
    currentRound++;
  }

  guessedPlayers = [];
  roundActive = false;
  roundEnded = false;
  currentWord = "";

  if (currentRound > rounds) {
    io.emit("gameFinished", players);
  } else {
    io.emit("nextRound", {
      currentRound,
      currentDrawerIndex,
      players
    });
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

    resetGame();

    io.emit("gameStarted", {
      players,
      hostId,
      rounds,
      drawTime,
      currentRound,
      currentDrawerIndex
    });
  });

  socket.on("chooseWord", word => {
    const drawer = getDrawer();

    if (!drawer || socket.id !== drawer.id) return;

    currentWord = word;
    guessedPlayers = [];
    roundActive = true;
    roundEnded = false;

    io.emit("wordChosen", {
      word,
      currentRound,
      currentDrawerIndex
    });
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
    io.emit("guess", data);
  });

  socket.on("correctGuess", data => {
    if (!roundActive || roundEnded) return;

    const drawer = getDrawer();
    if (!drawer) return;

    if (socket.id === drawer.id) return;

    if (guessedPlayers.includes(socket.id)) return;

    guessedPlayers.push(socket.id);

    const position = guessedPlayers.length;

    let points = 100 - (position - 1) * 20;
    if (points < 20) points = 20;

    players = players.map(player => {
      if (player.id === socket.id) {
        player.score += points;
      }

      if (player.id === drawer.id) {
        player.score += 30;
      }

      return player;
    });

    io.emit("playersUpdate", {
      players,
      hostId
    });

    io.emit("correctGuess", {
      guesserId: socket.id,
      guesserName: data.guesserName,
      points
    });

    const totalGuessers = players.length - 1;

    if (guessedPlayers.length >= totalGuessers) {
      roundEnded = true;
      roundActive = false;

      io.emit("roundEnded", {
        word: currentWord
      });

      setTimeout(() => {
        nextRound();
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
      nextRound();
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
