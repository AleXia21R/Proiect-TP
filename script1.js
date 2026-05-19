const startScreen = document.getElementById("startScreen");
const drawScreen = document.getElementById("drawScreen");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastX = 0;
let lastY = 0;

let brushSize = 8;

function startGame() {
  startScreen.classList.add("hidden");
  drawScreen.classList.remove("hidden");

  if (window.cReady) {
    Module._set_brush_size(8);
    brushSize = Module._get_brush_size();
  }

  document.getElementById("brushText").textContent = brushSize;

  clearCanvas();
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
