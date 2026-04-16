/**
 * glitch-bg.js
 * Portfolio background effects with split layers.
 * Background layer: red glitch obstacles + collision band
 * Foreground layer: cursor cluster + trailing lines
 */

(function () {
  function createCanvas(id, zIndex) {
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      `z-index:${zIndex}`,
    ].join(';');
    document.body.appendChild(canvas);
    return canvas;
  }

  const bgCanvas = createCanvas('glitch-bg', 0);
  const fgCanvas = createCanvas('glitch-cursor-layer', 99999);
  const bgCtx = bgCanvas.getContext('2d');
  const fgCtx = fgCanvas.getContext('2d');

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    bgCanvas.width = width;
    bgCanvas.height = height;
    fgCanvas.width = width;
    fgCanvas.height = height;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  const TRAIL_MAX = 20;
  const trail = [];

  let hitTimer = 0;
  let frameCount = 0;

  const OBS_COUNT = 12;
  let obstacles = [];

  function currentObstacleSize() {
    return Math.max(50, window.innerWidth * 0.04);
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist(ax, ay, bx, by) {
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
  }

  function safePos(size) {
    const W = bgCanvas.width;
    const H = bgCanvas.height;
    let x;
    let y;
    let ok = false;

    while (!ok) {
      x = rand(size / 2 + 20, W - size / 2 - 20);
      y = rand(size / 2 + 20, H - size / 2 - 20);
      const inTL = x < 380 && y < 220;
      const inTR = x > W - 450 && y < 450;
      if (!inTL && !inTR) ok = true;
    }

    return { x, y };
  }

  function spawnObstacles() {
    const size = currentObstacleSize();
    obstacles = [];
    for (let i = 0; i < OBS_COUNT; i++) {
      const pos = safePos(size);
      obstacles.push({
        x: pos.x,
        y: pos.y,
        size,
        errMsg: 'ERR_' + Math.floor(10 + Math.random() * 89),
        alpha: 0,
      });
    }
  }

  resize();
  spawnObstacles();

  window.addEventListener('resize', () => {
    resize();
    spawnObstacles();
  });

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function drawCursor() {
    fgCtx.fillStyle = '#000';
    for (let i = 0; i < 5; i++) {
      const r = rand(5, 15);
      fgCtx.beginPath();
      fgCtx.ellipse(
        cursorX + rand(-5, 5),
        cursorY + rand(-5, 5),
        r / 2,
        r / 2,
        0,
        0,
        Math.PI * 2
      );
      fgCtx.fill();
    }
  }

  function drawTrail() {
    fgCtx.strokeStyle = 'rgba(0,0,0,0.4)';
    fgCtx.lineWidth = 1;
    fgCtx.beginPath();

    trail.forEach((p, i) => {
      const jx = rand(-2, 2);
      const jy = rand(-2, 2);
      if (i === 0) fgCtx.moveTo(p.x + jx, p.y + jy);
      else fgCtx.lineTo(p.x + jx, p.y + jy);

      if (i % 5 === 0) {
        fgCtx.stroke();
        fgCtx.beginPath();
        fgCtx.moveTo(p.x, p.y);
        fgCtx.lineTo(cursorX, cursorY);
        fgCtx.stroke();
        fgCtx.beginPath();
        fgCtx.moveTo(p.x + jx, p.y + jy);
      }
    });

    fgCtx.stroke();
  }

  function drawObstacles() {
    obstacles.forEach((obs) => {
      const shakeX = rand(-3, 3);
      const s = obs.size;
      const cx = obs.x + shakeX;
      const cy = obs.y;

      obs.alpha = (Math.sin(frameCount * 0.1) + 1) / 2;
      const fillAlpha = obs.alpha * 0.23 + 0.04;

      bgCtx.save();
      bgCtx.translate(cx, cy);

      bgCtx.fillStyle = `rgba(255,0,0,${fillAlpha})`;
      bgCtx.fillRect(-s / 2, -s / 2, s, s);

      bgCtx.strokeStyle = 'rgb(255,0,0)';
      bgCtx.lineWidth = 1.5;
      bgCtx.strokeRect(-s / 2, -s / 2, s, s);

      bgCtx.beginPath();
      bgCtx.moveTo(-s / 2, -s / 2);
      bgCtx.lineTo(s / 2, s / 2);
      bgCtx.moveTo(s / 2, -s / 2);
      bgCtx.lineTo(-s / 2, s / 2);
      bgCtx.stroke();

      bgCtx.fillStyle = 'rgb(255,0,0)';
      bgCtx.font = '10px "Courier New", monospace';
      bgCtx.textAlign = 'center';
      bgCtx.textBaseline = 'top';
      bgCtx.fillText(obs.errMsg, 0, s / 2 + 4);

      bgCtx.restore();

      if (dist(cursorX, cursorY, obs.x, obs.y) < s / 2 && frameCount % 10 === 0) {
        hitTimer = 10;
        const pos = safePos(s);
        obs.x = pos.x;
        obs.y = pos.y;
        obs.errMsg = 'ERR_' + Math.floor(10 + Math.random() * 89);
      }
    });
  }

  function drawRedBand() {
    const W = bgCanvas.width;
    const H = bgCanvas.height;
    const midY = H / 2;

    bgCtx.fillStyle = 'rgba(255,0,0,0.12)';
    bgCtx.fillRect(0, midY - 60, W, 120);

    bgCtx.fillStyle = 'rgba(255,0,0,0.6)';
    for (let i = 0; i < 100; i++) {
      bgCtx.fillRect(rand(0, W), rand(midY - 60, midY + 60), 1.5, 1.5);
    }

    bgCtx.strokeStyle = 'rgba(255,0,0,0.5)';
    bgCtx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const ly = midY + rand(-50, 50);
      bgCtx.beginPath();
      bgCtx.moveTo(0, ly);
      bgCtx.lineTo(W, ly);
      bgCtx.stroke();
    }

    hitTimer--;
  }

  function loop() {
    frameCount++;

    cursorX = lerp(cursorX, mouseX, 0.3);
    cursorY = lerp(cursorY, mouseY, 0.3);

    trail.push({ x: cursorX, y: cursorY });
    if (trail.length > TRAIL_MAX) trail.shift();

    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);

    drawObstacles();
    if (hitTimer > 0) drawRedBand();
    drawTrail();
    drawCursor();

    requestAnimationFrame(loop);
  }

  loop();
})();
