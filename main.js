// ===== Flappy Bird - 纯前端可部署版 =====
// 操作：点击/触摸/按空格 = 起飞；游戏结束后再次点击/按空格重开
// 适配：DPR 高清缩放、自适应画布、移动端提示

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const BASE_W = 360;   // 逻辑宽度
const BASE_H = 640;   // 逻辑高度
let DPR = 1;

// 缩放到高清
function fitCanvas() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const cssW = Math.min(420, window.innerWidth * 0.94);
  const cssH = cssW * (BASE_H / BASE_W);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.floor(BASE_W * DPR);
  canvas.height = Math.floor(BASE_H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
fitCanvas();
window.addEventListener("resize", fitCanvas);

// 游戏状态
const State = { Ready: 0, Playing: 1, GameOver: 2 };
let state = State.Ready;

// 小鸟参数
const bird = {
  x: 80, y: BASE_H/2, r: 14,
  vy: 0, gravity: 0.45, flap: -7.6,
};

// 管道
let pipes = [];
const pipeGap = 140;           // 缝隙大小
const pipeWidth = 60;
let pipeSpeed = 2.2;           // 横向速度
let pipeInterval = 110;        // 生成间隔（帧）
let frame = 0;

// 计分
let score = 0;
let best = Number(localStorage.getItem("flappy_best") || 0);

// 背景滚动
let groundX = 0;
const groundH = 80;

// 声音（可选：简单“扑翼”与“得分”）
const SFX = {
  flap: new Audio(),
  score: new Audio(),
  hit: new Audio(),
};
try {
  // 生成短音频（WebAudio 更灵活；此处用 dataURI 简单占位，静音也不影响）
  SFX.flap.src  = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAA==";
  SFX.score.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAA==";
  SFX.hit.src   = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAA==";
} catch(e) { /* 安静处理 */ }

function resetGame() {
  state = State.Ready;
  bird.x = 80;
  bird.y = BASE_H/2;
  bird.vy = 0;
  pipes = [];
  score = 0;
  frame = 0;
  groundX = 0;
  pipeSpeed = 2.2;
}

// 工具
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// 生成一组上下管道
function spawnPipe() {
  const topHeight = randInt(60, BASE_H - groundH - pipeGap - 60);
  const bottomY = topHeight + pipeGap;
  pipes.push({
    x: BASE_W + 10,
    topHeight,
    bottomY,
    passed: false, // 是否已经计分
  });
}

// 碰撞检测（鸟与矩形）
function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  const testX = Math.max(rx, Math.min(cx, rx + rw));
  const testY = Math.max(ry, Math.min(cy, ry + rh));
  const distX = cx - testX;
  const distY = cy - testY;
  return (distX * distX + distY * distY) <= cr * cr;
}

// 绘制UI
function drawText(text, x, y, size=28, align="center", color="#fff", shadow=true) {
  ctx.save();
  ctx.font = `700 ${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawButton(text) {
  const w = 220, h = 48;
  const x = (BASE_W - w)/2, y = BASE_H*0.62;
  ctx.save();
  ctx.fillStyle = "#ffe082";
  ctx.strokeStyle = "#caa24a";
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 12, true, true);
  ctx.fillStyle = "#3a2a08";
  ctx.font = "700 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, x + w/2, y + h/2 + 6);
  ctx.restore();
  return { x, y, w, h };
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (w < 2*r) r = w/2;
  if (h < 2*r) r = h/2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// 输入
function flap() {
  if (state === State.Ready) {
    state = State.Playing;
    bird.vy = bird.flap;
    try { SFX.flap.currentTime = 0; SFX.flap.play(); } catch(e) {}
    return;
  }
  if (state === State.Playing) {
    bird.vy = bird.flap;
    try { SFX.flap.currentTime = 0; SFX.flap.play(); } catch(e) {}
    return;
  }
  if (state === State.GameOver) {
    resetGame();
    return;
  }
}

canvas.addEventListener("pointerdown", flap);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
  }
});

// 主循环
function loop() {
  requestAnimationFrame(loop);

  // 背景（天空）
  const grad = ctx.createLinearGradient(0, 0, 0, BASE_H);
  grad.addColorStop(0, "#6bd7ff");
  grad.addColorStop(0.5, "#5cc8f0");
  grad.addColorStop(1, "#36a8c0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  // 地面滚动
  groundX -= pipeSpeed;
  if (groundX <= -48) groundX += 48; // 砖块宽度 48
  for (let x = groundX; x < BASE_W + 48; x += 48) {
    ctx.fillStyle = "#2d6f73";
    ctx.fillRect(x, BASE_H - groundH, 48, groundH);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(x, BASE_H - groundH, 48, 8);
  }

  // 管道 & 物理更新
  if (state === State.Playing) {
    frame++;
    if (frame % pipeInterval === 0) spawnPipe();

    // 难度微调（逐渐加速）
    if (frame % 600 === 0) {
      pipeSpeed = Math.min(pipeSpeed + 0.2, 4.2);
    }

    // 小鸟物理
    bird.vy += bird.gravity;
    bird.y += bird.vy;

    // 管道移动 & 碰撞
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed;

      // 绘制管道
      ctx.fillStyle = "#2b9348";
      // 上管
      ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
      // 下管
      ctx.fillRect(p.x, p.bottomY, pipeWidth, BASE_H - groundH - p.bottomY);

      // 计分（鸟通过中心线）
      const centerX = p.x + pipeWidth / 2;
      if (!p.passed && centerX < bird.x - bird.r) {
        p.passed = true;
        score++;
        best = Math.max(best, score);
        localStorage.setItem("flappy_best", String(best));
        try { SFX.score.currentTime = 0; SFX.score.play(); } catch(e) {}
      }

      // 碰撞判定
      const collideTop = circleRectCollide(bird.x, bird.y, bird.r, p.x, 0, pipeWidth, p.topHeight);
      const collideBottom = circleRectCollide(bird.x, bird.y, bird.r, p.x, p.bottomY, pipeWidth, BASE_H - groundH - p.bottomY);
      if (collideTop || collideBottom) {
        try { SFX.hit.currentTime = 0; SFX.hit.play(); } catch(e) {}
        state = State.GameOver;
      }

      // 移除离开屏幕的管道
      if (p.x + pipeWidth < -40) pipes.splice(i, 1);
    }

    // 撞地/飞出判定
    if (bird.y + bird.r >= BASE_H - groundH || bird.y - bird.r <= 0) {
      try { SFX.hit.currentTime = 0; SFX.hit.play(); } catch(e) {}
      state = State.GameOver;
    }
  }

  // 绘制鸟
  ctx.save();
  ctx.translate(bird.x, bird.y);
  const rot = Math.max(-0.6, Math.min(0.8, bird.vy * 0.03));
  ctx.rotate(rot);
  // 身体
  ctx.fillStyle = "#ffd54a";
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // 翅膀
  ctx.fillStyle = "#ffe082";
  ctx.beginPath();
  ctx.ellipse(-6, 0, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // 嘴
  ctx.fillStyle = "#ff8f00";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(22, -4);
  ctx.lineTo(10, -2);
  ctx.closePath();
  ctx.fill();
  // 眼睛
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(6, -5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 分数
  drawText(`${score}`, BASE_W / 2, 70, 44);

  // 状态提示
  if (state === State.Ready) {
    drawText("点击/空格开始", BASE_W / 2, BASE_H * 0.42, 22);
    drawText("穿越管道得分", BASE_W / 2, BASE_H * 0.48, 18);
    drawButton("开始起飞");
  } else if (state === State.GameOver) {
    drawText("游戏结束", BASE_W / 2, BASE_H * 0.38, 30);
    drawText(`得分：${score}`, BASE_W / 2, BASE_H * 0.46, 22);
    drawText(`最佳：${best}`, BASE_W / 2, BASE_H * 0.52, 18);
    drawButton("点击/空格重开");
  }
}
resetGame();
loop();
