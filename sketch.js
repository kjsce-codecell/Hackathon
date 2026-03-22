let osn;

// Total numbers to be collected
let goal = 500;

// Tracking the numbers
var refined = [];
var numbers = [];
var cellSize, baseSize;
var buffer; // set dynamically in setup based on screen size
var cols, rows;

// Info for refining
let refining = false;
let refineTX, refinteTY, refineBX, refineBY;

// Logo text replaces lumon image
const logoTextWidth = 180;

let startTime = 0;
let secondsSpentRefining = 0;
let lastRefiningTimeStored = 0;

const emojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

// Info for "nope" state
let nope = false;
let nopeImg;
let nopeTime = 0;

// Info for 100% state
let completed = false;
let completedImg;
let completedTime = 0;

// Info for sharing
let shared = false;
let sharedImg;
let sharedTime = 0;

let shareDiv;

// Hack X states
let booting = false;
let gameEnterAnim = 1; // skip boot — game ready immediately
let gameEnterStart = 0;
let bootFrameCounter = 0;
let bootGlitching = false;
let bootGlitchStart = 0;
let bootFadeAlpha = 255;
let bootSpriteFrame = 0;
let bootSpriteImg;
let bootSpriteLoops = 0;

let revealing = false;
let revealText = "";
let revealCharIndex = 0;
let revealFrameCounter = 0;
let revealPhase = "shake";
let revealPhaseStart = 0;
let revealsDone = [];

let terminalOpen = false;
var rainbowMode = false;
let rainbowModeStart = 0;
let logoFlash = false;
let logoFlashStart = 0;

// Visual effects
let shakeAmount = 0;
let particles = [];
let glitchTimer = 0;
let glitchSlices = [];
let glitchFramesLeft = 0;

// Mouse trail particles
let mouseTrail = [];

// Floating dust particles (background ambiance)
let dustParticles = [];

// Input buffers
let keyBuffer = [];
let exitBuffer = [];
let konamiBuffer = [];
const konamiCode = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

// for CRT Shader
var shaderLayer, crtShader;
var g; //p5 graphics instance
var useShader;

// Background and foreground colours — single-accent cyan theme.
const mobilePalette = {
  BG: "#0A1628",
  FG: "#4fd1d9",
  SELECT: "#e0f4f4",
  LEVELS: {
    WO: "#4fd1d9",
    FC: "#4fd1d9",
    DR: "#4fd1d9",
    MA: "#4fd1d9",
  },
};

const shaderPalette = {
  BG: "#0A1628",
  FG: "#3ab8c0",
  SELECT: "#d0eef0",
  LEVELS: {
    WO: "#3ab8c0",
    FC: "#3ab8c0",
    DR: "#3ab8c0",
    MA: "#3ab8c0",
  },
};

var palette = mobilePalette;

// holds filename, initial bin levels, coordinates
let macrodataFile;

// Add image svg
let logoImg;

function preload() {
  // Only load the CRT shader — everything else lazy-loads after setup
  crtShader = loadShader("shaders/crt.vert.glsl", "shaders/crt.frag.glsl");
}

function startOver(resetFile = false) {
  // Track the amount of time
  startTime = millis();

  // Create the space
  levelH = buffer * 1.7;
  cellSize = (smaller - buffer * 2) / 10;
  baseSize = cellSize * 0.33;
  osn = new OpenSimplexNoise();
  cols = floor(g.width / cellSize);
  rows = floor((g.height - buffer * 2) / cellSize);

  let wBuffer = g.width - cols * cellSize;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let x = i * cellSize + cellSize * 0.5 + wBuffer * 0.5;
      let y = j * cellSize + cellSize * 0.5 + buffer;
      // Initialize the number objects
      numbers[i + j * cols] = new Data(x, y);
    }
  }

  if (resetFile) {
    macrodataFile.resetFile();
    storeItem("secondsSpentRefining", 0);
    secondsSpentRefining = 0;
    lastRefiningTimeStored = 0;
  }

  // Refinement bins
  for (let i = 0; i < 5; i++) {
    const w = g.width / 5;
    const binLevels = macrodataFile.storedBins
      ? macrodataFile.storedBins[i]
      : undefined;
    refined[i] = new Bin(w, i, goal / 5, binLevels);
  }

  nopeTime = 0;
  nope = false;
  completed = false;
  shared = false;
  revealing = false;
  revealsDone = [];
  terminalOpen = false;
  rainbowMode = false;
  logoFlash = false;
  particles = [];
  mouseTrail = [];
  shareDiv.hide();
}

var zoff = 0;
var smaller;

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("game-container");
  frameRate(30);

  g = createGraphics(windowWidth, windowHeight);

  smaller = min(g.width, g.height);
  buffer = max(100, min(130, smaller * 0.16));

  useShader = !isTouchScreenDevice();
  if (typeof window !== "undefined" && window.__HACKX_GLOBAL_CRT__ === true) {
    useShader = false;
  }
  if (useShader) {
    palette = shaderPalette;
  }

  pixelDensity(1);

  shaderLayer = createGraphics(g.width, g.height, WEBGL);
  shaderLayer.noStroke();
  crtShader.setUniform("u_resolution", [g.width, g.height]);

  smaller = min(g.width, g.height);

  // Enable scroll immediately (no boot gate)
  document.body.style.overflowY = "auto";
  var hint = document.getElementById("scroll-hint");
  if (hint) hint.style.opacity = "1";

  // Populate bottom bar text
  var bottomBar = document.getElementById("game-bottom-bar");
  if (bottomBar) {
    if (smaller < 500) {
      bottomBar.textContent = HACKX_CONFIG.eventName + " // " + HACKX_CONFIG.date;
    } else {
      bottomBar.textContent = HACKX_CONFIG.orgName + " // " + HACKX_CONFIG.eventName + " // " + HACKX_CONFIG.date + " // " + HACKX_CONFIG.shareUrl;
    }
  }

  // Hide the boot loader
  var bl = document.getElementById("boot-loader");
  if (bl) bl.classList.add("hide");
  setTimeout(function() { if (bl) bl.remove(); }, 400);

  // Always start fresh on page load
  localStorage.removeItem("hackx-data");
  localStorage.removeItem("secondsSpentRefining");
  macrodataFile = new MacrodataFile();
  secondsSpentRefining = 0;

  // Lazy-load non-critical images (not needed until gameplay events)
  nopeImg = loadImage("images/nope.png", function(img) { img.resize(smaller * 0.5, 0); });
  completedImg = loadImage("images/100.png", function(img) {
    img.resize(smaller * 0.5, 0);
    if (shareDiv) {
      shareDiv.position(g.width * 0.5 - img.width * 0.5, g.height * 0.5 - img.height * 0.5);
      shareDiv.style("width", img.width + "px");
      shareDiv.style("height", img.height + "px");
    }
  });
  sharedImg = loadImage("images/clipboard.png", function(img) { img.resize(smaller * 0.5, 0); });
  logoImg = loadImage("images/logo.svg");
  bootSpriteImg = loadImage("images/blue_spritesheet.png");

  shareDiv = createDiv("");
  shareDiv.hide();
  shareDiv.position(g.width * 0.5 - 100, g.height * 0.5 - 100);
  shareDiv.style("width", "200px");
  shareDiv.style("height", "200px");
  shareDiv.mousePressed(function () {
    let thenumbers = "";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        thenumbers += random(emojis);
      }
      thenumbers += "\n";
    }
    const timeStr = createTimeString(secondsSpentRefining);
    const msg = `Refined ${macrodataFile.fileName} in ${timeStr} for ${HACKX_CONFIG.orgName}.
${HACKX_CONFIG.eventName} // ${HACKX_CONFIG.tagline}
${thenumbers}${HACKX_CONFIG.shareHashtags}
${HACKX_CONFIG.shareUrl}`;

    console.log("copy to clipboard!");
    navigator.clipboard.writeText(msg);
    shared = true;
  });

  // Initialize dust particles
  for (let i = 0; i < 50; i++) {
    dustParticles.push({
      x: random(g.width),
      y: random(g.height),
      vx: random(-0.3, 0.3),
      vy: random(-0.2, -0.05),
      alpha: random(20, 60),
      size: random(1, 3),
    });
  }

  startOver();
}

function mousePressed() {
  initAudio();
  playClick();

  // Logo click detection — progress bar left area where "CODECELL" label is
  if (mouseX < g.width * 0.3 && mouseY < 55) {
    logoFlash = true;
    logoFlashStart = millis();
  }

  if (booting) {
    booting = false;
    gameEnterStart = millis();
    document.body.style.overflowY = "auto";
    const hint = document.getElementById("scroll-hint");
    if (hint) hint.style.opacity = "1";
    return;
  }

  if (
    !refining &&
    !completed &&
    !shared &&
    !booting &&
    !revealing &&
    !terminalOpen
  ) {
    refineTX = mouseX;
    refineTY = mouseY;
    refineBX = mouseX;
    refineBY = mouseY;
    refining = true;
    nope = false;
  }
}

function mouseDragged() {
  refineBX = mouseX;
  refineBY = mouseY;
}

function mouseReleased() {
  refining = false;
  let countRed = 0;
  let total = 0;
  let refinery = [];
  for (let num of numbers) {
    if (num.inside(refineTX, refineTY, refineBX, refineBY)) {
      if (num.refined) {
        refinery.push(num);
        countRed++;
      }
      total++;
    }
    num.turn(palette.FG);
    num.refined = false;
  }
  // half of numbers must be refinable
  if (countRed > 0.5 * total) {
    const options = [];
    for (let bin of refined) {
      if (bin.count < bin.goal) {
        options.push(bin);
      }
    }
    const bin = random(options);
    for (let num of refinery) {
      num.refine(bin);
    }
    shakeAmount = 3;
    playRefine();
  } else {
    refinery = [];
    if (!completed && !shared) {
      nope = true;
      playNope();
    }
    nopeTime = millis();
  }
}

let prevPercent;

function draw() {
  g.colorMode(RGB);
  const globalCrtActive =
    typeof window !== "undefined" && window.__HACKX_GLOBAL_CRT__ === true;

  // Boot sequence gate
  if (booting) {
    drawBootSequence();
    if (useShader && !globalCrtActive) {
      shaderLayer.rect(0, 0, g.width, g.height);
      shaderLayer.shader(crtShader);
      crtShader.setUniform("u_tex", g);
      background(palette.BG);
      imageMode(CORNER);
      image(shaderLayer, 0, 0, g.width, g.height);
    } else {
      image(g, 0, 0, g.width, g.height);
    }
    return;
  }

  // Game enter animation (numbers fade/scale in after boot)
  if (gameEnterAnim < 1) {
    gameEnterAnim = constrain((millis() - gameEnterStart) / 800, 0, 1);
  }

  // Rainbow mode timer (10 seconds)
  if (rainbowMode && millis() - rainbowModeStart > 10000) {
    rainbowMode = false;
  }

  let sum = 0;
  for (let bin of refined) {
    sum += bin.count;
  }
  let percent = sum / goal;

  if (percent !== prevPercent) {
    const bins = refined.map((bin) => bin.levels);
    macrodataFile.updateProgress(bins);
    prevPercent = percent;
  }

  // Milestone reveals
  if (percent >= 0.25) triggerReveal(25);
  if (percent >= 0.5) triggerReveal(50);
  if (percent >= 0.75) triggerReveal(75);
  if (percent >= 1.0) triggerReveal(100);

  if (completed && shared) {
    completed = false;
    sharedTime = millis();
  }

  g.background(palette.BG);
  g.textFont("Courier");

  // Screen shake
  if (shakeAmount > 0) {
    g.push();
    g.translate(
      random(-shakeAmount, shakeAmount),
      random(-shakeAmount, shakeAmount),
    );
  }

  // Draw floating dust particles behind everything
  drawDustParticles();

  // Mouse trail particles
  if (mouseX > 0 && mouseY > 0 && !booting) {
    mouseTrail.push({ x: mouseX, y: mouseY, alpha: 150, size: random(2, 5) });
    if (mouseTrail.length > 30) mouseTrail.shift();
  }
  drawMouseTrail();

  drawTop(percent);
  drawNumbers();
  drawBottom();

  drawBinned();
  drawParticles();

  // No top-right text — branding is in the progress bar now

  // Logo flash — "CODECELL INDUSTRIES"
  if (logoFlash) {
    g.textFont("Courier");
    g.textSize(smaller * 0.05);
    g.textAlign(CENTER, CENTER);
    g.fill(palette.FG);
    g.noStroke();
    g.text(HACKX_CONFIG.orgName, g.width * 0.5, g.height * 0.5);
    if (millis() - logoFlashStart > 1000) {
      logoFlash = false;
    }
  }

  if (nope && nopeImg && nopeImg.width) {
    g.imageMode(CENTER);
    if (!useShader) g.tint(mobilePalette.FG);
    g.image(nopeImg, g.width * 0.5, g.height * 0.5);
    if (millis() - nopeTime > 1000) {
      nope = false;
    }
  }

  if (completed && completedImg && completedImg.width) {
    g.imageMode(CENTER);
    if (!useShader) g.tint(mobilePalette.FG);
    g.image(completedImg, g.width * 0.5, g.height * 0.5);
  }

  if (shared && sharedImg && sharedImg.width) {
    g.imageMode(CENTER);
    if (!useShader) g.tint(mobilePalette.FG);
    g.image(sharedImg, g.width * 0.5, g.height * 0.5);
    if (millis() - sharedTime > 10000) {
      startOver(true);
    }
  }

  drawCursor(mouseX, mouseY);

  if (shakeAmount > 0) {
    g.pop();
    shakeAmount = max(0, shakeAmount - 0.3);
  }

  if (revealing) {
    drawReveal();
  }

  // Terminal overlay
  if (terminalOpen) {
    g.fill(0, 0, 0, 220);
    g.noStroke();
    g.rectMode(CORNER);
    g.rect(g.width * 0.05, g.height * 0.1, g.width * 0.9, g.height * 0.8);

    g.stroke(palette.FG);
    g.strokeWeight(2);
    g.noFill();
    g.rect(g.width * 0.05, g.height * 0.1, g.width * 0.9, g.height * 0.8);

    g.fill(palette.FG);
    g.noStroke();
    g.textFont("Courier");
    g.textSize(smaller * 0.028);
    g.textAlign(LEFT, TOP);

    const tLines = HACKX_CONFIG.terminalLines;
    const tLineH = smaller * 0.05;
    const tx = g.width * 0.1;
    const ty = g.height * 0.15;
    for (let i = 0; i < tLines.length; i++) {
      g.text(tLines[i], tx, ty + i * tLineH);
    }

    // Blinking cursor at bottom
    if (frameCount % 20 < 10) {
      g.fill(palette.FG);
      g.rect(
        tx,
        ty + tLines.length * tLineH + 10,
        smaller * 0.02,
        smaller * 0.003,
      );
    }
  }

  // Idle glitch (desktop only)
  if (!isTouchScreenDevice() && !booting && !revealing && !terminalOpen) {
    glitchTimer++;
    if (glitchTimer >= 350 && glitchFramesLeft <= 0) {
      glitchFramesLeft = floor(random(2, 4));
      glitchSlices = [];
      for (let i = 0; i < 3; i++) {
        glitchSlices.push({
          y: random(g.height),
          h: random(10, 40),
          offset: random(-15, 15),
        });
      }
      glitchTimer = floor(random(-100, 0)); // randomize next interval
    }

    if (glitchFramesLeft > 0) {
      for (const s of glitchSlices) {
        const slice = g.get(0, s.y, g.width, s.h);
        g.image(slice, s.offset, s.y);
      }
      glitchFramesLeft--;
    }
  }

  // Chromatic aberration during reveals (desktop only)
  if (revealing && !isTouchScreenDevice()) {
    const snap = g.get();
    g.blendMode(ADD);
    g.tint(255, 0, 0, 80);
    g.image(snap, -3, 0);
    g.tint(0, 0, 255, 80);
    g.image(snap, 3, 0);
    g.noTint();
    g.blendMode(BLEND);
  }

  if (useShader && !globalCrtActive) {
    shaderLayer.rect(0, 0, g.width, g.height);
    shaderLayer.shader(crtShader);
    crtShader.setUniform("u_tex", g);
    background(palette.BG);
    imageMode(CORNER);
    image(shaderLayer, 0, 0, g.width, g.height);
  } else {
    image(g, 0, 0, g.width, g.height);
  }

  if (focused) {
    secondsSpentRefining += deltaTime / 1000;
    const roundedTime = round(secondsSpentRefining);
    if (roundedTime % 5 == 0 && roundedTime != lastRefiningTimeStored) {
      storeItem("secondsSpentRefining", secondsSpentRefining);
      lastRefiningTimeStored = roundedTime;
    }
  }
}

function drawTop(percent) {
  const y = 30;
  const textSz = max(11, smaller * 0.02);

  g.textFont("Courier");
  g.noStroke();

  // Left: Logo
  if (logoImg) {
    g.imageMode(CENTER);
    if (!useShader) g.tint(palette.FG);

    let logoWidth = g.width < 500 ? 50 : 100;
    let logoHeight = g.width < 500 ? 50 : 100;
    // Align the center of the image with the center of the text vertically
    g.image(logoImg, g.width * 0.04 + logoWidth / 2, y + textSz / 2, logoWidth, logoHeight);
  }

  // Right: event info
  g.textAlign(RIGHT, TOP);
  g.textSize(max(14, smaller * 0.022));
  g.textStyle(BOLD);
  g.fill(palette.FG);
  if (g.width < 500) {
    g.stroke(palette.FG);
    g.strokeWeight(1);
  }
  const headerText = g.width < 500
    ? HACKX_CONFIG.date
    : HACKX_CONFIG.date + "  //  " + HACKX_CONFIG.location;
  g.text(
    headerText,
    g.width - 14,
    y,
  );
  g.textStyle(NORMAL);
}

function drawNumbers() {
  g.rectMode(CENTER);
  g.noFill();
  g.strokeWeight(1);
  g.line(0, buffer, g.width, buffer);
  g.line(0, g.height - buffer, g.width, g.height - buffer);

  let yoff = 0;

  const inc = 0.2;
  for (let i = 0; i < cols; i++) {
    let xoff = 0;
    for (let j = 0; j < rows; j++) {
      let num = numbers[i + j * cols];
      if (!num) return;

      if (num.binIt) {
        num.goBin();
        num.show();
        continue;
      }

      let n = osn.noise3D(xoff, yoff, zoff) - 0.4;
      if (n < 0) {
        n = 0;
        num.goHome();
      } else {
        num.x += random(-1, 1);
        num.y += random(-1, 1);
      }

      let sz = n * baseSize * 4 + baseSize;

      let d = dist(mouseX, mouseY, num.x, num.y);

      // Numbers flee from cursor more dramatically
      if (d < g.width * 0.15) {
        let angle = atan2(num.y - mouseY, num.x - mouseX);
        let force = map(d, 0, g.width * 0.15, 3, 0);
        num.x += cos(angle) * force;
        num.y += sin(angle) * force;
      } else {
        num.goHome();
      }

      num.size(sz);
      num.show();
      xoff += inc;
    }
    yoff += inc;
  }
  zoff += 0.005;
}

function drawBottom() {
  for (let i = 0; i < refined.length; i++) {
    refined[i].show();
  }

  if (refining) {
    g.push();
    g.rectMode(CORNERS);
    g.stroke(palette.FG);
    g.noFill();
    g.rect(refineTX, refineTY, refineBX, refineBY);

    for (let num of numbers) {
      if (
        num.inside(refineTX, refineTY, refineBX, refineBY) &&
        num.sz > baseSize
      ) {
        num.turn(palette.SELECT);
        num.refined = true;
      } else {
        num.turn(palette.FG);
        num.refined = false;
      }
    }
    g.pop();
  }

  // Bottom bar is rendered as HTML overlay (#game-bottom-bar)
}

function drawBinned() {
  for (let num of numbers) {
    if (num.binIt) {
      // Emit particle trail
      if (num.binPause <= 0 && frameCount % 2 === 0) {
        particles.push({
          x: num.x + random(-2, 2),
          y: num.y + random(-2, 2),
          alpha: 200,
          color: palette.FG,
        });
      }
      num.show();
    }
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.alpha -= 13;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    g.noStroke();
    const col = color(p.color);
    col.setAlpha(p.alpha);
    g.fill(col);
    g.circle(p.x, p.y, 3);
  }
}

function drawMouseTrail() {
  for (let i = mouseTrail.length - 1; i >= 0; i--) {
    const p = mouseTrail[i];
    p.alpha -= 8;
    if (p.alpha <= 0) {
      mouseTrail.splice(i, 1);
      continue;
    }
    g.noStroke();
    const col = color(palette.FG);
    col.setAlpha(p.alpha);
    g.fill(col);
    g.circle(p.x, p.y, p.size);
  }
}

function drawDustParticles() {
  for (let i = 0; i < dustParticles.length; i++) {
    const d = dustParticles[i];
    d.x += d.vx;
    d.y += d.vy;

    // Wrap around edges
    if (d.x < 0) d.x = g.width;
    if (d.x > g.width) d.x = 0;
    if (d.y < 0) d.y = g.height;
    if (d.y > g.height) d.y = 0;

    // Subtle flickering alpha
    let flickerAlpha = d.alpha + sin(millis() * 0.001 + i) * 10;
    flickerAlpha = constrain(flickerAlpha, 5, 80);

    g.noStroke();
    const col = color(palette.FG);
    col.setAlpha(flickerAlpha);
    g.fill(col);
    g.circle(d.x, d.y, d.size);
  }
}

function drawFPS() {
  textSize(24);
  fill(palette.FG);
  noStroke();
  text(frameRate().toFixed(2), 50, 25);
}

function toggleShader() {
  if (useShader) {
    palette = mobilePalette;
  } else {
    palette = shaderPalette;
  }
  useShader = !useShader;
}

function drawCursor(xPos, yPos) {
  // prevents the cursor appearing in top left corner on page load
  if (xPos == 0 && yPos == 0) return;
  g.push();
  // this offset makes the box draw from point of cursor
  g.translate(xPos + 10, yPos + 10);
  g.scale(1.2);
  g.fill(palette.BG);
  g.stroke(palette.FG);
  g.strokeWeight(3);
  g.beginShape();
  g.rotate(-PI / 5);
  g.vertex(0, -10);
  g.vertex(7.5, 10);
  g.vertex(0, 5);
  g.vertex(-7.5, 10);
  g.endShape(CLOSE);
  g.pop();
}

function drawBootSequence() {
  g.background(palette.BG);

  // Spritesheet: 10 columns, 9 rows, 1080x1080 per frame, 89 usable frames
  const spriteCols = 10;
  const spriteRows = 9;
  const frameW = 1080;
  const frameH = 1080;
  const totalFrames = 89;

  // Advance frame every other draw call (~15fps at 30fps)
  bootFrameCounter++;
  if (bootFrameCounter >= 2) {
    bootFrameCounter = 0;
    bootSpriteFrame++;
    if (bootSpriteFrame >= totalFrames) {
      bootSpriteFrame = 0;
      bootSpriteLoops++;
    }
  }

  // Source rectangle in spritesheet
  const col = bootSpriteFrame % spriteCols;
  const row = floor(bootSpriteFrame / spriteCols);
  const sx = col * frameW;
  const sy = row * frameH;

  // Draw centred, fitting within screen
  const displaySize = min(g.width, g.height) * 0.35;
  const dx = (g.width - displaySize) / 2;
  const dy = (g.height - displaySize) / 2;

  g.imageMode(CORNER);
  g.image(bootSpriteImg, dx, dy, displaySize, displaySize, sx, sy, frameW, frameH);

  // "INITIALIZING HACK X..." text below sprite
  g.fill(palette.FG);
  g.noStroke();
  g.textFont("Courier");
  g.textSize(smaller * 0.03);
  g.textAlign(CENTER, TOP);
  g.text("INITIALIZING HACK X...", g.width / 2, dy + displaySize + 20);

  // After 2 full loops, start glitch + fade out
  if (bootSpriteLoops >= 2) {
    if (!bootGlitching) {
      bootGlitching = true;
      bootGlitchStart = millis();
    }

    const elapsed = millis() - bootGlitchStart;

    // Glitch effect: random horizontal slices
    if (elapsed > 200 && elapsed < 600) {
      for (let i = 0; i < 5; i++) {
        const sliceY = random(g.height);
        const sliceH = random(10, 40);
        const offsetX = random(-30, 30);
        const slice = g.get(0, sliceY, g.width, sliceH);
        g.image(slice, offsetX, sliceY);
      }
    }

    // Brightness flicker
    if (elapsed > 200 && elapsed < 600 && frameCount % 3 === 0) {
      g.fill(255, 255, 255, random(20, 80));
      g.rectMode(CORNER);
      g.rect(0, 0, g.width, g.height);
    }

    // Fade out
    if (elapsed > 500) {
      bootFadeAlpha = map(elapsed, 500, 800, 255, 0);
      bootFadeAlpha = constrain(bootFadeAlpha, 0, 255);
    }

    // End boot
    if (elapsed > 800) {
      booting = false;
      gameEnterStart = millis();
      document.body.style.overflowY = "auto";
      const hint = document.getElementById("scroll-hint");
      if (hint) hint.style.opacity = "1";
    }
  }
}

function drawReveal() {
  const elapsed = millis() - revealPhaseStart;

  switch (revealPhase) {
    case "shake":
      shakeAmount = 5;
      if (elapsed > 300) {
        revealPhase = "glitch";
        revealPhaseStart = millis();
        revealCharIndex = 0;
        revealFrameCounter = 0;
      }
      break;

    case "glitch":
      for (let i = 0; i < 4; i++) {
        const sliceY = random(g.height);
        const sliceH = random(10, 50);
        const offsetX = random(-20, 20);
        const slice = g.get(0, sliceY, g.width, sliceH);
        g.image(slice, offsetX, sliceY);
      }
      if (elapsed > 500) {
        revealPhase = "typing";
        revealPhaseStart = millis();
      }
      break;

    case "typing": {
      g.fill(0, 0, 0, 200);
      g.noStroke();
      g.rectMode(CORNER);
      g.rect(0, 0, g.width, g.height);

      g.fill(palette.FG);
      g.textFont("Courier");
      g.textSize(smaller * 0.035);
      g.textAlign(CENTER, CENTER);
      g.stroke(palette.FG);
      g.strokeWeight(smaller < 500 ? 2.5 : 1.5);

      revealFrameCounter++;
      if (revealFrameCounter >= 3) {
        revealFrameCounter = 0;
        revealCharIndex++;
      }

      const displayText = revealText.substring(
        0,
        min(revealCharIndex, revealText.length),
      );

      // Word wrap
      const maxWidth = g.width * 0.8;
      const words = displayText.split(" ");
      let lines = [""];
      let lineIdx = 0;
      for (const word of words) {
        const testLine = lines[lineIdx] + (lines[lineIdx] ? " " : "") + word;
        if (g.textWidth(testLine) > maxWidth && lines[lineIdx]) {
          lineIdx++;
          lines[lineIdx] = word;
        } else {
          lines[lineIdx] = testLine;
        }
      }

      const lineH = smaller * 0.06;
      const totalH = lines.length * lineH;
      for (let i = 0; i < lines.length; i++) {
        g.text(
          lines[i],
          g.width * 0.5,
          g.height * 0.5 - totalH / 2 + i * lineH,
        );
      }

      if (revealCharIndex >= revealText.length) {
        if (millis() - revealPhaseStart > 500) {
          revealPhase = "hold";
          revealPhaseStart = millis();
        }
      }
      break;
    }

    case "hold": {
      g.fill(0, 0, 0, 200);
      g.noStroke();
      g.rectMode(CORNER);
      g.rect(0, 0, g.width, g.height);

      g.fill(palette.FG);
      g.textFont("Courier");
      g.textSize(smaller * 0.035);
      g.textAlign(CENTER, CENTER);
      g.stroke(palette.FG);
      g.strokeWeight(smaller < 500 ? 2.5 : 1.5);

      const holdWords = revealText.split(" ");
      let holdLines = [""];
      let hLineIdx = 0;
      const hMaxW = g.width * 0.8;
      for (const word of holdWords) {
        const testLine =
          holdLines[hLineIdx] + (holdLines[hLineIdx] ? " " : "") + word;
        if (g.textWidth(testLine) > hMaxW && holdLines[hLineIdx]) {
          hLineIdx++;
          holdLines[hLineIdx] = word;
        } else {
          holdLines[hLineIdx] = testLine;
        }
      }
      const hLineH = smaller * 0.06;
      const hTotalH = holdLines.length * hLineH;
      for (let i = 0; i < holdLines.length; i++) {
        g.text(
          holdLines[i],
          g.width * 0.5,
          g.height * 0.5 - hTotalH / 2 + i * hLineH,
        );
      }

      if (elapsed > 3000) {
        revealPhase = "glitchout";
        revealPhaseStart = millis();
      }
      break;
    }

    case "glitchout":
      for (let i = 0; i < 4; i++) {
        const sliceY = random(g.height);
        const sliceH = random(10, 50);
        const offsetX = random(-20, 20);
        const slice = g.get(0, sliceY, g.width, sliceH);
        g.image(slice, offsetX, sliceY);
      }
      if (elapsed > 500) {
        revealPhase = "done";
        revealing = false;
        // If 100% reveal just ended, trigger completed state
        if (revealsDone.includes(100)) {
          completed = true;
          completedTime = millis() - startTime;
          // shareDiv.show();
        }
      }
      break;
  }
}

function triggerReveal(percent) {
  if (revealsDone.includes(percent)) return;
  if (revealing || booting || terminalOpen) return;

  // Mid-drag edge case
  if (refining) {
    refining = false;
    for (let num of numbers) {
      num.turn(palette.FG);
      num.refined = false;
    }
  }

  revealsDone.push(percent);
  revealing = true;
  revealText = HACKX_CONFIG.reveals[percent].text;
  revealCharIndex = 0;
  revealFrameCounter = 0;
  revealPhase = "shake";
  revealPhaseStart = millis();
  shakeAmount = 5;
  playMilestone();
}

function keyPressed() {
  // Letter keys for hackx/exit buffers
  if (key.length === 1 && key.match(/[a-z]/i)) {
    const k = key.toLowerCase();

    if (terminalOpen) {
      exitBuffer.push(k);
      if (exitBuffer.length > 4) exitBuffer.shift();
      if (exitBuffer.join("") === "exit") {
        terminalOpen = false;
        keyBuffer = [];
      }
    } else if (!booting && !revealing) {
      keyBuffer.push(k);
      if (keyBuffer.length > 5) keyBuffer.shift();
      if (keyBuffer.join("") === "hackx") {
        terminalOpen = true;
        exitBuffer = [];
      }
    }
  }

  // Konami code tracking
  const konamiKey = key.length > 1 ? key : key.toLowerCase();
  konamiBuffer.push(konamiKey);
  if (konamiBuffer.length > 10) konamiBuffer.shift();
  if (
    konamiBuffer.length === 10 &&
    konamiBuffer.every((k, i) => k === konamiCode[i])
  ) {
    rainbowMode = true;
    rainbowModeStart = millis();
    konamiBuffer = [];
  }
}

function windowResized(ev) {
  resizeCanvas(windowWidth, windowHeight);
  g.resizeCanvas(windowWidth, windowHeight);
  shaderLayer.resizeCanvas(windowWidth, windowHeight);
  crtShader.setUniform("u_resolution", [g.width, g.height]);

  smaller = min(g.width, g.height);
  buffer = max(100, min(130, smaller * 0.16));

  if (sharedImg && sharedImg.width) sharedImg.resize(smaller * 0.5, 0);
  if (nopeImg && nopeImg.width) nopeImg.resize(smaller * 0.5, 0);
  if (completedImg && completedImg.width) completedImg.resize(smaller * 0.5, 0);

  refined.forEach((bin) => bin.resize(g.width / refined.length));

  cellSize = (smaller - buffer * 2) / 10;
  baseSize = cellSize * 0.33;

  cols = floor(g.width / cellSize);
  rows = floor((g.height - buffer * 2) / cellSize);
  let wBuffer = g.width - cols * cellSize;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let x = i * cellSize + cellSize * 0.5 + wBuffer * 0.5;
      let y = j * cellSize + cellSize * 0.5 + buffer;
      const numToUpdate = numbers[i + j * cols];
      if (numToUpdate) numToUpdate.resize(x, y);
    }
  }

  // Re-scatter dust particles across new dimensions
  for (let i = 0; i < dustParticles.length; i++) {
    dustParticles[i].x = random(g.width);
    dustParticles[i].y = random(g.height);
  }

  // Update bottom bar text on resize
  var bottomBar = document.getElementById("game-bottom-bar");
  if (bottomBar) {
    if (smaller < 500) {
      bottomBar.textContent = HACKX_CONFIG.eventName + " // " + HACKX_CONFIG.date;
    } else {
      bottomBar.textContent = HACKX_CONFIG.orgName + " // " + HACKX_CONFIG.eventName + " // " + HACKX_CONFIG.date + " // " + HACKX_CONFIG.shareUrl;
    }
  }
}
