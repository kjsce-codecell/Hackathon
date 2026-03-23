// sections.js — Canvas animations and interactivity for Hack X sections
(function () {
  "use strict";

  // Visibility-aware rAF: pauses canvas animations when their section is off-screen
  var _visMap = new Map();
  var _visObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { _visMap.set(e.target, e.isIntersecting); });
  }, { rootMargin: '100px' });

  function visibleRAF(sectionEl, drawFn) {
    if (!_visMap.has(sectionEl)) {
      _visMap.set(sectionEl, false);
      _visObs.observe(sectionEl);
    }
    function loop() {
      if (_visMap.get(sectionEl)) {
        drawFn();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  const RED = "#4fd1d9";
  const DARK = "#0a1628";
  const RED_RGB = [79, 209, 217];
  const CRT_CURVATURE = 4.5; // lower = curvier
  const CURSOR_BG = DARK;
  const CURSOR_FG = RED;
  const CURSOR_STROKE_PX = 3;
  const CURSOR_SCALE = 1.2;
  const CURSOR_ROT = -Math.PI / 5;
  const CURSOR_OFFSET = 10;

  function shouldUseCrtCurvature() {
    // Reuse the project's canonical detector from `utils.js` when available.
    if (typeof window.isTouchScreenDevice === "function") {
      return !window.isTouchScreenDevice();
    }

    // Fallback: avoid disabling on desktops that expose touch APIs.
    const coarsePointer =
      window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
    return !coarsePointer;
  }

  function shouldUseCustomCursor() {
    // Skip on touch/coarse pointer devices.
    if (typeof window.isTouchScreenDevice === "function") {
      return !window.isTouchScreenDevice();
    }
    const coarsePointer =
      window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
    return !coarsePointer;
  }

  function initGlobalCustomCursor() {
    if (!shouldUseCustomCursor()) return;

    const cursorCanvas = document.createElement("canvas");
    cursorCanvas.id = "global-custom-cursor";
    cursorCanvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 9998;
      pointer-events: none;
    `;
    document.body.appendChild(cursorCanvas);

    const ctx = cursorCanvas.getContext("2d");
    if (!ctx) {
      cursorCanvas.remove();
      return;
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      cursorCanvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      cursorCanvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let mouseX = -9999;
    let mouseY = -9999;
    let hide = false;
    let dirty = true;

    function isInsideHero(x, y) {
      const hero = document.getElementById("hero-section");
      if (!hero) return false;
      const r = hero.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    window.addEventListener(
      "mousemove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        hide = isInsideHero(mouseX, mouseY);
        dirty = true;
      },
      { passive: true },
    );

    window.addEventListener(
      "mouseleave",
      () => {
        mouseX = -9999;
        mouseY = -9999;
        dirty = true;
      },
      { passive: true },
    );

    function draw() {
      if (!dirty) { requestAnimationFrame(draw); return; }
      dirty = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (!hide && mouseX >= 0 && mouseY >= 0) {
        ctx.save();
        ctx.translate(mouseX + CURSOR_OFFSET, mouseY + CURSOR_OFFSET);
        ctx.scale(CURSOR_SCALE, CURSOR_SCALE);
        ctx.rotate(CURSOR_ROT);

        ctx.fillStyle = CURSOR_BG;
        ctx.strokeStyle = CURSOR_FG;
        ctx.lineWidth = CURSOR_STROKE_PX;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(7.5, 10);
        ctx.lineTo(0, 5);
        ctx.lineTo(-7.5, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  function initGlobalCrtCurvatureForSectionCanvases() {
    if (!shouldUseCrtCurvature()) return;

    // Signal to the p5 layer that global CRT is active (so it can skip its own CRT pass).
    window.__HACKX_GLOBAL_CRT__ = true;

    let sourceCanvases = [];
    function collectSourceCanvases() {
      // Include the p5 hero canvas too so the curvature feels like one continuous screen.
      const all = Array.from(
        document.querySelectorAll(".section canvas, #footer-section canvas"),
      ).filter((c) => !(c instanceof HTMLCanvasElement ? c.classList.contains("crt-global-canvas") : false));
      sourceCanvases = all;
      sourceCanvases.forEach((c) => {
        // Hide all source canvases; the global CRT canvas will draw them instead.
        if (!c.classList.contains("crt-global-canvas")) c.style.opacity = "0";
      });
    }

    collectSourceCanvases();

    const glCanvas = document.createElement("canvas");
    glCanvas.className = "crt-global-canvas";
    glCanvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 0;
      pointer-events: none;
    `;
    document.body.appendChild(glCanvas);

    const gl =
      glCanvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
      }) || glCanvas.getContext("experimental-webgl");
    if (!gl) {
      glCanvas.remove();
      return;
    }

    // If canvases are created after DOMContentLoaded (p5 does this), observe and collect.
    const observer = new MutationObserver(() => collectSourceCanvases());
    observer.observe(document.body, { childList: true, subtree: true });

    const composeCanvas = document.createElement("canvas");
    const composeCtx = composeCanvas.getContext("2d", { alpha: true });
    // Keep UI (game text/boxes) crisp when compositing/scaling.
    composeCtx.imageSmoothingEnabled = false;

    const vertSrc = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fragSrc = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform vec2 u_curvature;

      vec2 curveRemapUV(vec2 uv) {
        uv = uv * 2.0 - 1.0;
        vec2 offset = abs(uv.yx) / u_curvature;
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
        return uv;
      }

      void main() {
        vec2 uv = v_uv;
        vec2 remappedUV = curveRemapUV(uv);
        if (remappedUV.x < 0.0 || remappedUV.y < 0.0 || remappedUV.x > 1.0 || remappedUV.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }
        gl_FragColor = texture2D(u_tex, remappedUV);
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    function createProgram(vsSrc, fsSrc) {
      const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        gl.deleteProgram(p);
        return null;
      }
      return p;
    }

    const program = createProgram(vertSrc, fragSrc);
    if (!program) {
      glCanvas.remove();
      sourceCanvases.forEach((c) => (c.style.opacity = ""));
      return;
    }

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, "a_pos");
    const uTex = gl.getUniformLocation(program, "u_tex");
    const uCurv = gl.getUniformLocation(program, "u_curvature");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Nearest-neighbor to avoid blurring pixel-ish UI.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      glCanvas.width = w;
      glCanvas.height = h;
      composeCanvas.width = w;
      composeCanvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    resize();
    window.addEventListener("resize", resize);

    let lastFrame = 0;
    const minFrameMs = 1000 / 30; // cap at ~30fps for perf
    const FLAT_CURVATURE = 10000.0;

    function draw(now) {
      if (now - lastFrame < minFrameMs) {
        requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      // Fade curvature to flat as the footer enters the viewport.
      // t = 0 -> full curvature, t = 1 -> flat.
      let t = 0;
      const footer = document.getElementById("footer-section");
      if (footer) {
        const r = footer.getBoundingClientRect();
        const fadeStart = window.innerHeight * 0.65;
        const fadeEnd = window.innerHeight * 0.15;
        if (r.top < fadeStart) {
          t = Math.min(1, Math.max(0, (fadeStart - r.top) / (fadeStart - fadeEnd)));
        }
      }
      const curv = CRT_CURVATURE + (FLAT_CURVATURE - CRT_CURVATURE) * t;

      // Composite all section canvases into one viewport-sized canvas in screen space.
      composeCtx.clearRect(0, 0, composeCanvas.width, composeCanvas.height);
      composeCtx.fillStyle = DARK;
      composeCtx.fillRect(0, 0, composeCanvas.width, composeCanvas.height);
      const dpr = window.devicePixelRatio || 1;
      for (const c of sourceCanvases) {
        if (!c || c === glCanvas) continue;
        const rect = c.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) continue;
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        const dx = rect.left * dpr;
        const dy = rect.top * dpr;
        const dw = rect.width * dpr;
        const dh = rect.height * dpr;
        try {
          composeCtx.drawImage(c, dx, dy, dw, dh);
        } catch {
          // Ignore transient drawImage failures (e.g., zero-sized during layout).
        }
      }

      // Upload composed viewport to WebGL texture and curve it once.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        composeCanvas,
      );

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uTex, 0);
      gl.uniform2f(uCurv, curv, curv);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // Canvas backgrounds (performant, GPU-accelerated)
    initAboutCanvas();
    initNexusCanvas();
    initSpectraCanvas();
    initPrizesCanvas();
    initFooterCanvas();
    // Core (one-time CSS transitions, no jank)
    initScrollFadeIn();
    initTimelineLineDraw();
    initPrizeCounters();
    // initScrollProgressBar(); // removed — was showing blue line at top
    initAnnouncements();
    // Clean interactions (pure CSS, no rAF loops)
    initHoverLineTrace();
    initRevealOnScroll();
    initFaqAccessibility();
    initTeamGrid();
    initPerksBgCanvas();
    // Easter eggs (hidden, zero perf cost until triggered)
    initTripleClick();
    initFooterCopyrightHover();
    initCodecellMatrix();
    initBottomMessage();
    initTenFireworks();
    initTrackTagFlash();
    initIdleMessage();
    initMusicDanceExperience();
    initGlobalCrtCurvatureForSectionCanvases();
    initGlobalCustomCursor();

    // Lock model-viewer orbit target so clicks/taps can't shift the origin,
    // and add a point light at the top-right of the model.
    const mv = document.querySelector("model-viewer.about-model");
    if (mv) {
      // On touch devices, disable camera-controls so vertical scroll isn't captured
      const isTouch = (typeof window.isTouchScreenDevice === "function")
        ? window.isTouchScreenDevice()
        : (window.matchMedia && window.matchMedia("(pointer:coarse)").matches);
      if (isTouch) {
        mv.removeAttribute("camera-controls");
      }

      mv.addEventListener("load", () => {
        const locked = mv.getCameraTarget();
        const lockedStr = `${locked.x}m ${locked.y}m ${locked.z}m`;
        mv.addEventListener("camera-change", () => {
          const cur = mv.getCameraTarget();
          if (cur.x !== locked.x || cur.y !== locked.y || cur.z !== locked.z) {
            mv.cameraTarget = lockedStr;
          }
        });
      });
    }
  }

  // ===== LENIS SMOOTH SCROLL =====
  function initLenis() {
    if (typeof Lenis === "undefined") return;
    const lenis = new Lenis({
      duration: 2.2,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.7,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) lenis.scrollTo(target);
      });
    });
  }

  // ===== ABOUT: FaultyTerminal (CRT scanline squares + flicker) =====
  function initAboutCanvas() {
    const canvas = document.getElementById("about-canvas");
    if (!canvas) return;

    const fallback2D = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const chars =
        "01アカサタナハマヤラワ{}[]<>/\\|=+-*&^%$#@!HACKXCODECEL";
      let drops = [];
      let columns = 0;

      function resize2D() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        columns = Math.floor(canvas.width / 14);
        drops = new Array(columns).fill(1);
      }

      function draw2D() {
        ctx.fillStyle = "rgba(10, 22, 40, 0.04)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(79, 209, 217, 0.12)";
        ctx.font = "12px Courier New";

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(char, i * 14, drops[i] * 14);
          if (drops[i] * 14 > canvas.height && Math.random() > 0.985)
            drops[i] = 0;
          if (Math.random() > 0.3) drops[i]++;
        }
      }

      resize2D();
      window.addEventListener("resize", resize2D);
      visibleRAF(canvas.closest('.section') || canvas.parentElement, draw2D);
    };

    // WebGL renderer (no React/ogl dependency): port of FaultyTerminal shaders.
    const gl =
      canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
      }) || canvas.getContext("experimental-webgl");
    if (!gl) return fallback2D();

    const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

    const fragmentShader = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;
  
  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;
  
  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;
  
  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);
  
  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);
  
  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;
    
    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;
        
        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }
    
    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        
        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }
    
    p = fract(p);
    p *= uDigitSize;
    
    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);
    
    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;
    
    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
    
    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){
    
    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;
    
    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);
    
    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));
    
    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }
    
    vec2 p = uv * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    // Output transparency so this canvas doesn't become an opaque black overlay
    // when multiple section canvases overlap during scroll.
    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    gl_FragColor = vec4(col, a);
}
`;

    function compileShader(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh);
        gl.deleteShader(sh);
        throw new Error(log || "Shader compile failed");
      }
      return sh;
    }

    function createProgram(vsSrc, fsSrc) {
      const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p);
        gl.deleteProgram(p);
        throw new Error(log || "Program link failed");
      }
      return p;
    }

    function hexToRgb01(hex) {
      let h = String(hex || "").trim().replace("#", "");
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const num = parseInt(h, 16);
      return [(num >> 16 & 255) / 255, (num >> 8 & 255) / 255, (num & 255) / 255];
    }

    let program;
    try {
      program = createProgram(vertexShader, fragmentShader);
    } catch {
      return fallback2D();
    }

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    // Interleaved: position(x,y), uv(u,v)
    const data = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      -1, 1, 0, 1,
      1, -1, 1, 0,
      1, 1, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "position");
    const aUv = gl.getAttribLocation(program, "uv");

    const u = {
      iTime: gl.getUniformLocation(program, "iTime"),
      iResolution: gl.getUniformLocation(program, "iResolution"),
      uScale: gl.getUniformLocation(program, "uScale"),
      uGridMul: gl.getUniformLocation(program, "uGridMul"),
      uDigitSize: gl.getUniformLocation(program, "uDigitSize"),
      uScanlineIntensity: gl.getUniformLocation(program, "uScanlineIntensity"),
      uGlitchAmount: gl.getUniformLocation(program, "uGlitchAmount"),
      uFlickerAmount: gl.getUniformLocation(program, "uFlickerAmount"),
      uNoiseAmp: gl.getUniformLocation(program, "uNoiseAmp"),
      uChromaticAberration: gl.getUniformLocation(program, "uChromaticAberration"),
      uDither: gl.getUniformLocation(program, "uDither"),
      uCurvature: gl.getUniformLocation(program, "uCurvature"),
      uTint: gl.getUniformLocation(program, "uTint"),
      uMouse: gl.getUniformLocation(program, "uMouse"),
      uMouseStrength: gl.getUniformLocation(program, "uMouseStrength"),
      uUseMouse: gl.getUniformLocation(program, "uUseMouse"),
      uPageLoadProgress: gl.getUniformLocation(program, "uPageLoadProgress"),
      uUsePageLoadAnimation: gl.getUniformLocation(program, "uUsePageLoadAnimation"),
      uBrightness: gl.getUniformLocation(program, "uBrightness"),
    };

    const dprCap = 2;
    let dpr = Math.min(window.devicePixelRatio || 1, dprCap);

    // Match the snippet defaults used in your pasted code.
    const params = {
      scale: 1.5,
      gridMul: [2, 1],
      digitSize: 1.2,
      timeScale: 0.5,
      pause: false,
      scanlineIntensity: 0.5,
      glitchAmount: 1,
      flickerAmount: 1,
      noiseAmp: 1,
      chromaticAberration: 0,
      dither: 0,
      curvature: 0, // avoid double-curving (global CRT pass handles it)
      tint: "#4fd1d9",
      mouseReact: false,
      mouseStrength: 0.5,
      pageLoadAnimation: true,
      brightness: 0.15,
    };

    let mouse = { x: 0.5, y: 0.5 };
    let useMouse = 0;
    if (typeof window !== "undefined" && typeof window.isTouchScreenDevice === "function") {
      useMouse = window.isTouchScreenDevice() ? 0 : 1;
    } else {
      const coarsePointer =
        window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
      useMouse = coarsePointer ? 0 : 1;
    }
    useMouse = useMouse && params.mouseReact ? 1 : 0;

    let loadStart = 0;
    let timeOffset = Math.random() * 100;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.max(1, Math.floor(canvas.parentElement.offsetWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.parentElement.offsetHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);

      gl.useProgram(program);
      gl.uniform3f(u.iResolution, canvas.width, canvas.height, canvas.width / canvas.height);
      gl.uniform1f(u.uScale, params.scale);
      gl.uniform2f(u.uGridMul, params.gridMul[0], params.gridMul[1]);
      gl.uniform1f(u.uDigitSize, params.digitSize);
      gl.uniform1f(u.uScanlineIntensity, params.scanlineIntensity);
      gl.uniform1f(u.uGlitchAmount, params.glitchAmount);
      gl.uniform1f(u.uFlickerAmount, params.flickerAmount);
      gl.uniform1f(u.uNoiseAmp, params.noiseAmp);
      gl.uniform1f(u.uChromaticAberration, params.chromaticAberration);
      gl.uniform1f(u.uDither, params.dither);
      gl.uniform1f(u.uCurvature, params.curvature);
      const tintRGB = hexToRgb01(params.tint);
      gl.uniform3f(u.uTint, tintRGB[0], tintRGB[1], tintRGB[2]);
      gl.uniform1f(u.uMouseStrength, params.mouseStrength);
      gl.uniform1f(u.uUseMouse, useMouse);
      gl.uniform1f(u.uUsePageLoadAnimation, params.pageLoadAnimation ? 1 : 0);
      gl.uniform1f(u.uBrightness, params.brightness);
    }

    function draw(now) {
      if (!loadStart && params.pageLoadAnimation) loadStart = now;
      const t = (now * 0.001 + timeOffset) * params.timeScale;

      gl.useProgram(program);

      gl.uniform1f(u.iTime, params.pause ? t : t);
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);

      if (params.pageLoadAnimation) {
        const progress = Math.min((now - loadStart) / 2000, 1);
        gl.uniform1f(u.uPageLoadProgress, progress);
      } else {
        gl.uniform1f(u.uPageLoadProgress, 1);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      const stride = 16; // 4 floats * 4 bytes
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, stride, 8);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouse.x = x;
      mouse.y = y;
    }

    canvas.addEventListener("mousemove", onMove, { passive: true });
    resize();
    window.addEventListener("resize", resize);
    visibleRAF(canvas.closest('.section') || canvas.parentElement, draw);
  }

  // ===== NEXUS: Neural Network Nodes =====
  function initNexusCanvas() {
    const canvas = document.getElementById("nexus-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let nodes = [];
    const NODE_COUNT = 25;

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 3 + 1,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw() {
      ctx.fillStyle = "rgba(10, 22, 40, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.3;
            ctx.strokeStyle = `rgba(${RED_RGB.join(",")}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.03;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        const glow = Math.sin(n.pulse) * 0.3 + 0.4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + Math.sin(n.pulse) * 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${RED_RGB.join(",")}, ${glow})`;
        ctx.fill();
      });
    }

    resize();
    window.addEventListener("resize", resize);
    visibleRAF(canvas.closest('.section') || canvas.parentElement, draw);
  }

  // ===== SPECTRA: Orbiting Blockchain Nodes =====
  function initSpectraCanvas() {
    const canvas = document.getElementById("spectra-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let rings = [];
    let time = 0;

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.min(canvas.width, canvas.height) * 0.4;
      rings = [];
      for (let i = 0; i < 4; i++) {
        const r = maxR * (0.3 + i * 0.2);
        const nodeCount = 3 + i * 2;
        const ringNodes = [];
        for (let j = 0; j < nodeCount; j++) {
          ringNodes.push({
            angle: (j / nodeCount) * Math.PI * 2,
            speed: (0.005 + i * 0.002) * (i % 2 === 0 ? 1 : -1),
          });
        }
        rings.push({ radius: r, nodes: ringNodes, cx, cy });
      }
    }

    function draw() {
      ctx.fillStyle = "rgba(10, 22, 40, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      rings.forEach((ring, ri) => {
        ctx.strokeStyle = `rgba(${RED_RGB.join(",")}, 0.08)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ring.cx, ring.cy, ring.radius, 0, Math.PI * 2);
        ctx.stroke();

        ring.nodes.forEach((n) => {
          n.angle += n.speed;
          const x = ring.cx + Math.cos(n.angle) * ring.radius;
          const y = ring.cy + Math.sin(n.angle) * ring.radius;

          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${RED_RGB.join(",")}, 0.6)`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${RED_RGB.join(",")}, 0.1)`;
          ctx.fill();
        });

        if (ri < rings.length - 1) {
          const nextRing = rings[ri + 1];
          ring.nodes.forEach((n1) => {
            const x1 = ring.cx + Math.cos(n1.angle) * ring.radius;
            const y1 = ring.cy + Math.sin(n1.angle) * ring.radius;
            nextRing.nodes.forEach((n2) => {
              const x2 = nextRing.cx + Math.cos(n2.angle) * nextRing.radius;
              const y2 = nextRing.cy + Math.sin(n2.angle) * nextRing.radius;
              const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
              if (dist < 100) {
                ctx.strokeStyle = `rgba(${RED_RGB.join(",")}, ${(1 - dist / 100) * 0.15})`;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
              }
            });
          });
        }
      });
    }

    resize();
    window.addEventListener("resize", resize);
    visibleRAF(canvas.closest('.section') || canvas.parentElement, draw);
  }

  // ===== PRIZES: Floating ASCII =====
  function initPrizesCanvas() {
    const canvas = document.getElementById("prizes-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const symbols = ["$", "★", "◆", "▲", "●", "✦", "⬡", "0", "1"];
    let floaters = [];

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      floaters = [];
      for (let i = 0; i < 40; i++) {
        floaters.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vy: -(Math.random() * 0.3 + 0.1),
          char: symbols[Math.floor(Math.random() * symbols.length)],
          alpha: Math.random() * 0.15 + 0.05,
          size: Math.random() * 14 + 8,
          drift: (Math.random() - 0.5) * 0.3,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      floaters.forEach((f) => {
        f.y += f.vy;
        f.x += f.drift;
        if (f.y < -20) {
          f.y = canvas.height + 20;
          f.x = Math.random() * canvas.width;
        }
        if (f.x < -20) f.x = canvas.width + 20;
        if (f.x > canvas.width + 20) f.x = -20;

        ctx.font = `${f.size}px Courier New`;
        ctx.fillStyle = `rgba(${RED_RGB.join(",")}, ${f.alpha})`;
        ctx.fillText(f.char, f.x, f.y);
      });
    }

    resize();
    window.addEventListener("resize", resize);
    visibleRAF(canvas.closest('.section') || canvas.parentElement, draw);
  }

  // ===== FOOTER: Particle Field =====
  function initFooterCanvas() {
    const canvas = document.getElementById("footer-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      particles = [];
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.2 + 0.05,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${RED_RGB.join(",")}, ${p.alpha})`;
        ctx.fill();
      });
    }

    resize();
    window.addEventListener("resize", resize);
    visibleRAF(canvas.closest('section') || canvas.parentElement, draw);
  }

  // ===== SCROLL REVEAL (timeline toggles in/out on viewport entry/exit) =====
  function initScrollFadeIn() {
    const timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("visible", entry.isIntersecting);
        });
      },
      { threshold: 0.2 },
    );

    document
      .querySelectorAll(".timeline-item")
      .forEach((item) => timelineObserver.observe(item));

    const statObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    document
      .querySelectorAll(".about-stat")
      .forEach((item) => statObserver.observe(item));

    document.querySelectorAll(".section-content").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
    });

    const contentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 },
    );

    document
      .querySelectorAll(".section-content")
      .forEach((el) => contentObserver.observe(el));

    const scrollHint = document.getElementById("scroll-hint");
    if (scrollHint) {
      window.addEventListener(
        "scroll",
        () => {
          scrollHint.style.opacity = Math.max(0, 1 - window.scrollY / 200);
        },
        { passive: true },
      );
    }
  }

  // ===== PRIZE COUNTERS (easeOutExpo for satisfying deceleration) =====
  function initPrizeCounters() {
    const amounts = document.querySelectorAll(".prize-amount, .pool-amount");
    let counted = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !counted) {
            counted = true;
            amounts.forEach((el) => {
              const target = parseInt(el.dataset.target);
              if (target) animateCounter(el, target);
            });
          }
        });
      },
      { threshold: 0.3 },
    );

    const prizesSection = document.getElementById("prizes-section");
    if (prizesSection) observer.observe(prizesSection);
  }

  function animateCounter(el, target) {
    const duration = 1500;
    const start = performance.now();

    function easeOutExpo(t) {
      return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.floor(easedProgress * target);
      const prefix = el.dataset.prefix || "$";
      el.textContent = prefix + current.toLocaleString("en-IN");
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        const prefix = el.dataset.prefix || "$";
        el.textContent = prefix + target.toLocaleString("en-IN");
      }
    }

    requestAnimationFrame(step);
  }

  // ===== SCROLL PROGRESS BAR =====
  function initScrollProgressBar() {
    const bar = document.createElement("div");
    bar.style.cssText = `
      position: fixed; top: 0; left: 0; height: 3px; width: 0%;
      background: ${RED};
      z-index: 10000; transition: width 0.1s linear; pointer-events: none;
    `;
    document.body.appendChild(bar);

    window.addEventListener(
      "scroll",
      () => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + "%";
      },
      { passive: true },
    );
  }

  // ===== ANNOUNCEMENTS =====
  function initAnnouncements() {
    if (typeof HACKX_CONFIG === "undefined") return;
    const bar = document.getElementById("announcement-bar");
    if (!bar) return;

    function show() {
      const msgs = HACKX_CONFIG.announcements;
      bar.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      bar.classList.add("visible");
      setTimeout(() => bar.classList.remove("visible"), 5000);
    }

    // Show normal announcements as before
    setTimeout(show, 30000);
    setInterval(show, 30000 + Math.random() * 15000);

    // Show periodic hint every 2 minutes
    function showHint() {
      bar.textContent = 'Hint: Try dragging over certain numbers to progress in the game!';
      bar.classList.add('visible');
      setTimeout(() => bar.classList.remove('visible'), 7000);
    }
    setInterval(showHint, 2 * 60 * 1000); // every 2 minutes
  }

  // ===== CURSOR GLOW =====
  function initCursorGlow() {
    const glow = document.createElement("div");
    glow.id = "cursor-glow";
    glow.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9998;
      width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,23,68,0.06) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      transition: opacity 0.3s;
    `;
    document.body.appendChild(glow);

    document.addEventListener("mousemove", (e) => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    });

    const hero = document.getElementById("hero-section");
    if (hero) {
      hero.addEventListener("mouseenter", () => {
        glow.style.opacity = "0";
      });
      hero.addEventListener("mouseleave", () => {
        glow.style.opacity = "1";
      });
    }
  }

  // ===== SUBTLE-BUT-WILD: Section Breathing =====
  // Sections very slightly scale on a slow sine wave — barely perceptible life
  function initSectionBreathing() {
    const sections = document.querySelectorAll(".section-content");
    if (!sections.length) return;
    let time = 0;

    function breathe() {
      time += 0.008;
      sections.forEach((section, i) => {
        const phase = time + i * 0.7;
        const scale = 1 + Math.sin(phase) * 0.002;
        section.style.transform =
          section.style.opacity === "0"
            ? section.style.transform
            : `scale(${scale})`;
      });
      requestAnimationFrame(breathe);
    }

    // Delay start so scroll fade-in finishes first
    setTimeout(() => requestAnimationFrame(breathe), 2000);
  }

  // ===== SUBTLE-BUT-WILD: Border Glow on Scroll Proximity =====
  // Section borders glow brighter as they approach the viewport center
  function initBorderGlow() {
    const sections = document.querySelectorAll(
      ".info-card, .prize-card, .track-card, .track-block, .readout-row, .prize-entry, .timeline-item, .faq-item",
    );
    if (!sections.length) return;

    sections.forEach((el) => {
      el.style.transition =
        "box-shadow 0.4s ease-out, border-color 0.4s ease-out";
    });

    function update() {
      const viewportCenter = window.innerHeight / 2;
      sections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elCenter - viewportCenter);
        const maxDist = window.innerHeight * 0.6;
        const proximity = Math.max(0, 1 - distance / maxDist);
        const glowAlpha = proximity * 0.25;
        const borderAlpha = 0.08 + proximity * 0.2;
        el.style.boxShadow = `0 0 ${proximity * 20}px rgba(79, 209, 217, ${glowAlpha})`;
        el.style.borderColor = `rgba(79, 209, 217, ${borderAlpha})`;
      });
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // ===== SUBTLE-BUT-WILD: Subtle Depth on Mouse =====
  // Content shifts very slightly (max 3px) opposite to mouse, creating depth illusion
  function initSubtleDepth() {
    const elements = document.querySelectorAll(
      ".section-content, .info-card, .prize-card, .track-block",
    );
    if (!elements.length) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Normalize to -1..1 from center
      const nx = (mouseX / window.innerWidth - 0.5) * 2;
      const ny = (mouseY / window.innerHeight - 0.5) * 2;
      // Opposite direction, max 3px
      targetX = -nx * 3;
      targetY = -ny * 3;
    });

    function animate() {
      // Smooth interpolation
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Only apply to elements in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.style.translate = `${currentX}px ${currentY}px`;
        }
      });
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // ===== SUBTLE-BUT-WILD: Hover Warmth =====
  // Subtle warm glow behind interactive elements on hover — box-shadow only, no transforms
  function initHoverWarmth() {
    const style = document.createElement("style");
    style.textContent = `
      .hover-warmth {
        transition: box-shadow 0.35s ease-out;
      }
      .hover-warmth:hover {
        box-shadow: 0 0 30px rgba(79, 209, 217, 0.12), 0 0 60px rgba(79, 209, 217, 0.06);
      }
    `;
    document.head.appendChild(style);

    document
      .querySelectorAll(
        ".readout-row, .prize-entry, .timeline-item, .faq-item, .track-block, .info-card, .prize-card",
      )
      .forEach((el) => {
        el.classList.add("hover-warmth");
      });
  }

  // ===== TIMELINE: Bottom Thread + Pinch Nodes =====
  function initTimelineLineDraw() {
    const timelineSection = document.getElementById("timeline-section");
    if (!timelineSection) return;

    const threadWrap = timelineSection.querySelector("#timeline-thread-wrap");
    const threadSvg = timelineSection.querySelector(".timeline-thread-svg");
    const nodeTrack = timelineSection.querySelector("#timeline-node-track");
    const threadPath = timelineSection.querySelector("#timeline-thread-path");
    const timelinePanels = timelineSection.querySelector(".timeline-panels");
    const nodes = Array.from(timelineSection.querySelectorAll(".timeline-node"));
    const panelDate = timelineSection.querySelector("#timeline-panel-date");
    const panelDay = timelineSection.querySelector("#timeline-panel-day");
    const panelTitle = timelineSection.querySelector("#timeline-panel-title");
    const panelBody = timelineSection.querySelector("#timeline-panel-body");

    if (
      !threadWrap ||
      !threadSvg ||
      !nodeTrack ||
      !threadPath ||
      !nodes.length ||
      !panelDate ||
      !panelDay ||
      !panelTitle ||
      !panelBody
    ) {
      return;
    }

    nodeTrack.style.setProperty("--node-count", String(nodes.length));

    let activeIndex = nodes.findIndex((node) => node.classList.contains("active"));
    if (activeIndex < 0) activeIndex = 0;
    let panelAnimationTimeout = null;

    function setPanelContent(node) {
      panelDate.textContent = node.dataset.date || "";
      panelDay.textContent = node.dataset.day || "";
      panelTitle.textContent = node.dataset.title || "";
      panelBody.textContent = String(node.dataset.detail || "").replace(/\r\n?/g, "\n");
      panelBody.scrollTop = 0;
    }

    function animatePanels(direction) {
      if (!timelinePanels || direction === 0) return;

      const animationClass = direction > 0 ? "panel-in-right" : "panel-in-left";

      timelinePanels.classList.remove("panel-in-left", "panel-in-right");
      void timelinePanels.offsetWidth;
      timelinePanels.classList.add(animationClass);

      if (panelAnimationTimeout) {
        window.clearTimeout(panelAnimationTimeout);
      }

      panelAnimationTimeout = window.setTimeout(() => {
        timelinePanels.classList.remove("panel-in-left", "panel-in-right");
        panelAnimationTimeout = null;
      }, 360);
    }

    function applyPinch(index) {
      nodes.forEach((node, nodeIndex) => {
        const distance = Math.abs(nodeIndex - index);
        const liftPx = distance === 0 ? 64 : distance === 1 ? 28 : distance === 2 ? 10 : 0;
        node.style.setProperty("--lift", `${liftPx}px`);
        const isActive = nodeIndex === index;
        node.classList.toggle("active", isActive);
        node.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function pointFromNode(node) {
      const dot = node.querySelector(".timeline-node-dot") || node;
      const wrapRect = threadWrap.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      return {
        x: dotRect.left + dotRect.width / 2 - wrapRect.left,
        y: dotRect.top + dotRect.height / 2 - wrapRect.top,
      };
    }

    function buildThreadPath(points) {
      if (!points.length) return "";
      if (points.length === 1) {
        const point = points[0];
        return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }

      const tension = 0.25;
      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

      for (let index = 0; index < points.length - 1; index += 1) {
        const p0 = points[index - 1] || points[index];
        const p1 = points[index];
        const p2 = points[index + 1];
        const p3 = points[index + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;

        d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      }

      return d;
    }

    function drawThread() {
      const width = Math.max(1, threadWrap.clientWidth);
      const height = Math.max(1, threadWrap.clientHeight);
      threadSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const points = nodes.map((node) => pointFromNode(node));
      if (!points.length) {
        threadPath.setAttribute("d", "");
        return;
      }

      const extendedPoints = [
        { x: 0, y: points[0].y },
        ...points,
        { x: width, y: points[points.length - 1].y },
      ];

      threadPath.setAttribute("d", buildThreadPath(extendedPoints));
    }

    function setActive(index, shouldAnimatePanels = true) {
      const direction = index === activeIndex ? 0 : index > activeIndex ? 1 : -1;
      activeIndex = index;
      applyPinch(index);
      setPanelContent(nodes[index]);
      if (shouldAnimatePanels && direction !== 0) {
        animatePanels(direction);
      }
      drawThread();
    }

    nodes.forEach((node, index) => {
      node.addEventListener("mouseenter", () => setActive(index));
      node.addEventListener("focus", () => setActive(index));
      node.addEventListener("click", () => setActive(index));
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setActive(index);
      });
    });

    window.addEventListener("resize", drawThread, { passive: true });

    function animateThread() {
      drawThread();
      requestAnimationFrame(animateThread);
    }

    setActive(activeIndex, false);
    requestAnimationFrame(animateThread);
  }

  // ===== PERKS BG — Rising particles =====
  function initPerksBgCanvas() {
    const canvas = document.getElementById("perks-bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dots = [];

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      dots = [];
      for (let i = 0; i < 30; i++) {
        dots.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vy: -(Math.random() * 0.3 + 0.1),
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.08 + 0.02,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.y += d.vy;
        if (d.y < -10) {
          d.y = canvas.height + 10;
          d.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 209, 217, ${d.alpha})`;
        ctx.fill();
      });
    }

    resize();
    window.addEventListener("resize", resize);
    visibleRAF(canvas.closest('.section') || canvas.parentElement, draw);
  }

  // ===== (unused) PERKS INTERACTIVE =====
  function initPerksInteractive() {
    const canvas = document.getElementById("perks-interactive");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const tooltip = document.getElementById("perk-tooltip");

    const perks = [
      {
        label: "₹3L+",
        title: "PRIZES",
        desc: "Cash prizes across both tracks — first and second place winners",
        color: [79, 209, 217],
      },
      {
        label: "24H",
        title: "FOOD & CAFFEINE",
        desc: "Meals, snacks, and unlimited coffee for the entire hackathon",
        color: [0, 229, 255],
      },
      {
        label: "1:1",
        title: "MENTORSHIP",
        desc: "Industry engineers and founders who've built at scale",
        color: [124, 77, 255],
      },
      {
        label: "200+",
        title: "NETWORK",
        desc: "Builders, designers, and dreamers from across the city",
        color: [255, 214, 0],
      },
      {
        label: "SWAG",
        title: "MERCH & STICKERS",
        desc: "Exclusive Hack X merch for all participants",
        color: [79, 209, 217],
      },
      {
        label: "CERT",
        title: "CERTIFICATES",
        desc: "Official CodeCell participation and winner certificates",
        color: [0, 229, 255],
      },
    ];

    let nodes = [];
    let mouseX = -1000,
      mouseY = -1000;
    let hoveredNode = null;
    let time = 0;

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.28;

      nodes = perks.map((p, i) => {
        const angle = (i / perks.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...p,
          baseX: cx + Math.cos(angle) * radius,
          baseY: cy + Math.sin(angle) * radius,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          r: 30,
          angleOffset: angle,
          orbitSpeed: 0.0003 + i * 0.00008,
          floatOffset: Math.random() * Math.PI * 2,
        };
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.28;

      hoveredNode = null;

      // Update positions with gentle orbit + float
      nodes.forEach((n, i) => {
        const angle = n.angleOffset + time * n.orbitSpeed;
        const float = Math.sin(time * 0.02 + n.floatOffset) * 8;
        n.x = cx + Math.cos(angle) * radius + float;
        n.y =
          cy +
          Math.sin(angle) * radius +
          Math.cos(time * 0.015 + n.floatOffset) * 6;

        // Check hover
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) < n.r + 15) {
          hoveredNode = n;
        }
      });

      // Draw connections between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          const maxDist = radius * 2.2;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(79, 209, 217, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw connection from mouse to nearby nodes
      nodes.forEach((n) => {
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const alpha = (1 - dist / 200) * 0.2;
          ctx.strokeStyle = `rgba(${n.color.join(",")}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(mouseX, mouseY);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((n) => {
        const isHovered = n === hoveredNode;
        const r = isHovered ? n.r + 8 : n.r;
        const glowAlpha = isHovered ? 0.3 : 0.08;

        // Outer glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color.join(",")}, ${glowAlpha})`;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(10, 22, 40, ${isHovered ? 0.95 : 0.8})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${n.color.join(",")}, ${isHovered ? 0.8 : 0.3})`;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Label text
        ctx.fillStyle = `rgba(${n.color.join(",")}, ${isHovered ? 1 : 0.7})`;
        ctx.font = `bold ${isHovered ? 14 : 11}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x, n.y);
      });

      // Tooltip
      if (hoveredNode && tooltip) {
        tooltip.innerHTML = `
          <div class="perk-tooltip-num">${hoveredNode.label}</div>
          <div class="perk-tooltip-title">${hoveredNode.title}</div>
          <div class="perk-tooltip-desc">${hoveredNode.desc}</div>
        `;
        tooltip.classList.add("visible");
        let tx = mouseX + 20;
        let ty = mouseY - 20;
        // Keep tooltip on screen
        const rect = canvas.getBoundingClientRect();
        if (tx + 260 > rect.width) tx = mouseX - 280;
        tooltip.style.left = rect.left + tx + "px";
        tooltip.style.top = rect.top + ty + "px";
      } else if (tooltip) {
        tooltip.classList.remove("visible");
      }

      requestAnimationFrame(draw);
    }

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener("mouseleave", () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    resize();
    window.addEventListener("resize", resize);
    draw();
  }

  // ===== EASTER EGG: Triple-Click Secret Message =====
  function initTripleClick() {
    let clickCount = 0;
    let clickTimer = null;

    document.addEventListener("click", () => {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 400);

      if (clickCount >= 3) {
        clickCount = 0;
        // Don't show during music dance experience
        if (document.documentElement.classList.contains('theme-oscillating')) return;
        showFlashMessage("YOU FOUND A SECRET. THE CODE REMEMBERS.", RED);
      }
    });
  }

  function showFlashMessage(text, color) {
    const msg = document.createElement("div");
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: ${color}; font-family: 'Courier New', monospace; font-size: 18px;
      z-index: 99999; pointer-events: none; text-align: center;
      text-shadow: 0 0 20px ${color}; opacity: 0;
      transition: opacity 0.3s ease; padding: 20px;
      background: rgba(10, 22, 40, 0.85); border: 1px solid ${color};
    `;
    document.body.appendChild(msg);
    requestAnimationFrame(() => {
      msg.style.opacity = "1";
    });
    setTimeout(() => {
      msg.style.opacity = "0";
      setTimeout(() => msg.remove(), 300);
    }, 2000);
  }

  // ===== EASTER EGG: Footer Copyright Hover (3s) =====
  function initFooterCopyrightHover() {
    const copy = document.querySelector(".footer-copy");
    if (!copy) return;
    let hoverTimer = null;
    const original = copy.textContent;

    copy.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(() => {
        copy.textContent =
          "BUILT WITH SLEEPLESS NIGHTS AND TOO MUCH COFFEE \u2615";
        copy.style.color = RED;
        setTimeout(() => {
          copy.textContent = original;
          copy.style.color = "";
        }, 3000);
      }, 3000);
    });

    copy.addEventListener("mouseleave", () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });
  }

  // ===== EASTER EGG: CODECELL Matrix Cascade =====
  function initCodecellMatrix() {
    const logo = document.querySelector(".footer-logo");
    if (!logo) return;

    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      const overlay = document.createElement("canvas");
      overlay.width = window.innerWidth;
      overlay.height = window.innerHeight;
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; z-index: 99998;
        pointer-events: none;
      `;
      document.body.appendChild(overlay);
      const ctx = overlay.getContext("2d");
      const word = "CODECELL";
      const columns = Math.floor(overlay.width / 20);
      const drops = new Array(columns).fill(0);
      let frame = 0;

      function draw() {
        ctx.fillStyle = "rgba(10, 22, 40, 0.12)";
        ctx.fillRect(0, 0, overlay.width, overlay.height);
        ctx.font = "16px Courier New";

        for (let i = 0; i < drops.length; i++) {
          const ch = word[Math.floor(Math.random() * word.length)];
          const alpha = Math.random() * 0.5 + 0.5;
          ctx.fillStyle = `rgba(79, 209, 217, ${alpha})`;
          ctx.fillText(ch, i * 20, drops[i] * 20);
          if (drops[i] * 20 > overlay.height && Math.random() > 0.95)
            drops[i] = 0;
          drops[i]++;
        }

        frame++;
        if (frame < 120) {
          requestAnimationFrame(draw);
        } else {
          overlay.style.transition = "opacity 0.5s";
          overlay.style.opacity = "0";
          setTimeout(() => overlay.remove(), 500);
        }
      }
      draw();
    });
  }

  // ===== EASTER EGG: Bottom of Page Message =====
  function initBottomMessage() {
    const msg = document.createElement("div");
    msg.innerHTML =
      "&gt; YOU'VE REACHED THE END OF THE DATA STREAM. SEE YOU AT HACK X.";
    msg.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      color: ${RED}; font-family: 'Courier New', monospace; font-size: 14px;
      z-index: 99999; pointer-events: none; opacity: 0;
      transition: opacity 0.8s ease; text-shadow: 0 0 10px ${RED};
      white-space: nowrap;
    `;
    document.body.appendChild(msg);

    window.addEventListener(
      "scroll",
      () => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && scrollTop >= docHeight - 5) {
          msg.style.opacity = "1";
        } else {
          msg.style.opacity = "0";
        }
      },
      { passive: true },
    );
  }

  // ===== EASTER EGG: Type "10" Fireworks =====
  function initTenFireworks() {
    let buffer = "";
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener("keydown", (e) => {
      buffer += e.key;
      if (buffer.length > 10) buffer = buffer.slice(-10);
      if (buffer.endsWith("10")) {
        buffer = "";
        spawnFireworks(mouseX, mouseY);
      }
    });
  }

  function spawnFireworks(cx, cy) {
    const colors = [RED];
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText =
      "position:fixed;top:0;left:0;z-index:99997;pointer-events:none;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let particles = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        size: Math.random() * 4 + 2,
      });
    }

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= 0.015;
        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
      particles = particles.filter((p) => p.life > 0);
      frame++;
      if (particles.length > 0 && frame < 180) {
        requestAnimationFrame(draw);
      } else {
        canvas.remove();
      }
    }
    draw();
  }

  // ===== EASTER EGG: Music Dance Experience =====
  function initMusicDanceExperience() {
    const audio = document.getElementById("secretMusic");
    if (!audio.src || !audio.src.endsWith('.mp3')) audio.src = 'audio-assets/shakey-jake.mp3';
    audio.volume = 0.3;
    const stopBtn = document.getElementById("stopMusicBtn");
    if (!audio || !stopBtn) return;

    let typed = '';
    let isPlaying = false;
    let colorOscillationInterval = null;

    function startColorOscillation() {
      // Ensure we start on red (no class)
      document.documentElement.classList.remove('theme-blue');
      document.documentElement.classList.add('theme-oscillating');
      let isBlue = false;
      colorOscillationInterval = setInterval(() => {
        isBlue = !isBlue;
        if (isBlue) {
          document.documentElement.classList.add('theme-blue');
        } else {
          document.documentElement.classList.remove('theme-blue');
        }
      }, 400);
    }

    function stopColorOscillation() {
      if (colorOscillationInterval) {
        clearInterval(colorOscillationInterval);
        colorOscillationInterval = null;
      }
      // Reset back to red
      document.documentElement.classList.remove('theme-blue');
      document.documentElement.classList.remove('theme-oscillating');
    }

    // Container for music UI (title + stop button)
    let musicUIContainer = null;
    let lockOverlay = null;

    function startMusic() {
      if (isPlaying) return;
      audio.play().catch(() => {
        // Autoplay may block if user hasn't interacted yet.
      });
      isPlaying = true;

      // Smooth scroll to top with JS animation, then lock
      const scrollStart = window.scrollY || document.documentElement.scrollTop;
      if (scrollStart > 0) {
        const scrollDuration = 800;
        const startTime = performance.now();
        function animateScroll(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / scrollDuration, 1);
          // easeInOutQuad
          const ease = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          window.scrollTo(0, scrollStart * (1 - ease));
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            document.documentElement.style.overflowY = 'hidden';
            document.body.style.overflowY = 'hidden';
          }
        }
        requestAnimationFrame(animateScroll);
      } else {
        document.documentElement.style.overflowY = 'hidden';
        document.body.style.overflowY = 'hidden';
      }

      // Block interaction with game
      lockOverlay = document.createElement('div');
      lockOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 99998; background: transparent; cursor: default;
      `;
      document.body.appendChild(lockOverlay);

      // Disable game canvas and text selection
      const heroSection = document.getElementById('hero-section');
      if (heroSection) heroSection.style.pointerEvents = 'none';
      document.body.style.userSelect = 'none';

      // Create music UI container (centered on screen)
      musicUIContainer = document.createElement('div');
      musicUIContainer.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        z-index: 99999; display: flex; flex-direction: column;
        align-items: center; gap: 16px;
        opacity: 0; transition: opacity 0.4s ease;
      `;

      // Title label (unclickable)
      const titleLabel = document.createElement('div');
      titleLabel.innerHTML = 'THE MUSIC<br>DANCE EXPERIENCE';
      titleLabel.style.cssText = `
        color: #001affff; font-family: 'Geist Pixel', 'Courier New', monospace; font-size: 75px;
        text-align: center; pointer-events: none; font-weight : bold;
        text-shadow: 0 0 20px #001affff; padding: 20px 40px;
        background: rgba(10, 0, 8, 1.0); border: 1px solid #001affff;
        letter-spacing: 4px; text-transform: uppercase;
      `;
      musicUIContainer.appendChild(titleLabel);

      // Style stop button
      stopBtn.textContent = 'STOP THE MUSIC DANCE EXPERIENCE';
      stopBtn.style.cssText = `
        color: #001affff; font-family: 'Courier New', monospace; font-size: 18px;
        text-align: center; cursor: pointer;
        text-shadow: 0 0 20px #001affff; padding: 20px 40px;
        background: rgba(10, 0, 8, 0.85); border: 1px solid #001affff;
        letter-spacing: 4px; text-transform: uppercase;
        display: block;
      `;
      musicUIContainer.appendChild(stopBtn);

      document.body.appendChild(musicUIContainer);
      requestAnimationFrame(() => { musicUIContainer.style.opacity = '1'; });

      startColorOscillation();
    }

    function stopMusic() {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;

      // Unlock scroll
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = 'auto';

      // Remove interaction blocker
      if (lockOverlay) {
        lockOverlay.remove();
        lockOverlay = null;
      }

      // Re-enable game canvas and text selection
      const heroSection = document.getElementById('hero-section');
      if (heroSection) heroSection.style.pointerEvents = '';
      document.body.style.userSelect = '';

      // Fade out music UI container, then remove
      if (musicUIContainer) {
        musicUIContainer.style.opacity = '0';
        const container = musicUIContainer;
        setTimeout(() => {
          container.remove();
          stopBtn.style.display = 'none';
          document.body.appendChild(stopBtn);
        }, 400);
        musicUIContainer = null;
      } else {
        stopBtn.style.display = 'none';
        document.body.appendChild(stopBtn);
      }

      stopColorOscillation();
    }

    document.addEventListener("keydown", (e) => {
      if (isPlaying) {
        if (e.key === 'Escape')
          stopMusic();
        return;
      }
      if (!e.key || e.key.length !== 1) return;
      typed += e.key.toLowerCase();
      if (typed.length > 3) typed = typed.slice(-3);
      if (typed === "mde") {
        startMusic();
        typed = "";
      }
    });

    stopBtn.addEventListener("click", stopMusic);
    audio.addEventListener("ended", stopMusic);
  }


  // ===== EASTER EGG: Track Tag Click Flash =====
  function initTrackTagFlash() {
    document.querySelectorAll(".track-tags span").forEach((tag) => {
      tag.style.cursor = "pointer";
      tag.style.transition = "all 0.15s ease";
      tag.addEventListener("click", () => {
        const origBg = tag.style.background;
        const origColor = tag.style.color;
        tag.style.background = "#4fd1d9";
        tag.style.color = "#0a1628";
        tag.style.boxShadow = "0 0 15px #4fd1d9";
        setTimeout(() => {
          tag.style.background = origBg;
          tag.style.color = origColor;
          tag.style.boxShadow = "";
        }, 300);
      });
    });
  }

  // ===== EASTER EGG: Idle Message (30s) =====
  function initIdleMessage() {
    let idleTimer = null;
    let shown = false;
    const idleMsg = document.createElement("div");
    idleMsg.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      color: ${RED}; font-family: 'Courier New', monospace; font-size: 14px;
      z-index: 99999; pointer-events: none; opacity: 0;
      transition: opacity 0.5s ease; text-shadow: 0 0 10px ${RED};
      background: rgba(10, 22, 40, 0.9); padding: 12px 24px; border: 1px solid #4fd1d940;
      white-space: nowrap;
    `;
    idleMsg.innerHTML =
      '&gt; STILL HERE? THE HACKATHON WON\'T WAIT.';
    document.body.appendChild(idleMsg);

    function resetIdle() {
      if (idleTimer) clearTimeout(idleTimer);
      idleMsg.style.opacity = "0";
      if (shown) return;
      idleTimer = setTimeout(() => {
        shown = true;
        idleMsg.style.opacity = "1";
        setTimeout(() => {
          idleMsg.style.opacity = "0";
        }, 5000);
      }, 30000);
    }

    ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, resetIdle, { passive: true });
    });
    resetIdle();
  }

  // ===== INTERACTION: Section Transitions — Horizontal Scan-Line Wipe =====
  function initSectionTransitions() {
    const sections = document.querySelectorAll(".section");
    if (!sections.length) return;

    const triggered = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id || entry.target.className;
          const key =
            id + "_" + (entry.boundingClientRect.top < 0 ? "up" : "down");
          if (entry.isIntersecting && !triggered.has(key)) {
            triggered.set(key, true);
            const line = document.createElement("div");
            line.style.cssText = `
            position: absolute; top: 0; left: 0; height: 3px; width: 0%;
            background: #4fd1d9; z-index: 9999; pointer-events: none;
            transition: width 300ms ease-out;
          `;
            entry.target.style.position =
              entry.target.style.position || "relative";
            entry.target.appendChild(line);
            requestAnimationFrame(() => {
              line.style.width = "100%";
            });
            setTimeout(() => line.remove(), 400);
          }
        });
      },
      { threshold: 0.01 },
    );

    sections.forEach((s) => observer.observe(s));
  }

  // ===== INTERACTION: Data Stream — Ambient Falling Hex Characters =====
  function initDataStream() {
    if (window.innerWidth <= 1200) return;

    const canvas = document.createElement("canvas");
    canvas.width = 20;
    canvas.height = window.innerHeight;
    canvas.style.cssText = `
      position: fixed; top: 0; right: 0; z-index: 9990;
      pointer-events: none; width: 20px; height: 100vh;
    `;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const chars = "0123456789ABCDEF";
    const drops = [];
    for (let i = 0; i < 12; i++) {
      drops.push({
        x: Math.random() * 16 + 2,
        y: Math.random() * canvas.height,
        speed: Math.random() * 0.4 + 0.15,
        char: chars[Math.floor(Math.random() * chars.length)],
        changeTimer: 0,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "10px Courier New";
      ctx.fillStyle = "rgba(79, 209, 217, 0.06)";

      drops.forEach((d) => {
        d.y += d.speed;
        d.changeTimer++;
        if (d.changeTimer > 60) {
          d.char = chars[Math.floor(Math.random() * chars.length)];
          d.changeTimer = 0;
        }
        if (d.y > canvas.height) {
          d.y = -10;
          d.x = Math.random() * 16 + 2;
        }
        ctx.fillText(d.char, d.x, d.y);
      });

      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", () => {
      canvas.height = window.innerHeight;
    });

    draw();
  }

  // ===== INTERACTION: Section Counter — Current Section Indicator =====
  function initSectionCounter() {
    const sections = document.querySelectorAll(".section");
    if (!sections.length) return;

    const total = String(sections.length).padStart(2, "0");
    const counter = document.createElement("div");
    counter.style.cssText = `
      position: fixed; bottom: 16px; left: 16px; z-index: 9995;
      font-family: 'Courier New', monospace; font-size: 9px;
      color: rgba(79, 209, 217, 0.25); pointer-events: none;
      letter-spacing: 2px;
    `;
    counter.textContent = "01 / " + total;
    document.body.appendChild(counter);

    const visibility = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target, entry.intersectionRatio);
        });

        let maxRatio = 0;
        let maxIndex = 0;
        sections.forEach((s, i) => {
          const ratio = visibility.get(s) || 0;
          if (ratio > maxRatio) {
            maxRatio = ratio;
            maxIndex = i;
          }
        });

        counter.textContent =
          String(maxIndex + 1).padStart(2, "0") + " / " + total;
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((s) => observer.observe(s));
  }

  // ===== INTERACTION: Mouse Ripple — Expanding Ring on Click =====
  function initMouseRipple() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes _rippleExpand {
        0% { width: 0; height: 0; opacity: 1; }
        100% { width: 100px; height: 100px; opacity: 0; }
      }
      ._mouse-ripple {
        position: fixed; border-radius: 50%; pointer-events: none;
        border: 1px solid rgba(79, 209, 217, 0.3);
        animation: _rippleExpand 600ms ease-out forwards;
        transform: translate(-50%, -50%);
        z-index: 9996;
      }
    `;
    document.head.appendChild(style);

    let ripples = [];

    document.addEventListener("click", (e) => {
      // Skip hero/game section
      const hero = document.getElementById("hero-section");
      if (hero && hero.contains(e.target)) return;

      if (ripples.length >= 3) {
        const oldest = ripples.shift();
        oldest.remove();
      }

      const ripple = document.createElement("div");
      ripple.className = "_mouse-ripple";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      document.body.appendChild(ripple);
      ripples.push(ripple);

      setTimeout(() => {
        ripple.remove();
        ripples = ripples.filter((r) => r !== ripple);
      }, 600);
    });
  }

  // ===== INTERACTION: Ambient Pulse — Page Breathing =====
  function initAmbientPulse() {
    document.body.style.transition = "background-color 2s ease-in-out";

    function pulse() {
      document.body.style.backgroundColor = "#0F0010";
      setTimeout(() => {
        document.body.style.backgroundColor = "#0a1628";
      }, 2000);

      const next = 8000 + Math.random() * 4000;
      setTimeout(pulse, next);
    }

    setTimeout(pulse, 8000 + Math.random() * 4000);
  }

  // ===== INTERACTION: Hover Traces — Lines + Timeline Box Draw =====
  function initFaqAccessibility() {
    document.querySelectorAll('.faq-question').forEach(function(el) {
      function toggle() {
        var item = el.parentElement;
        var open = item.classList.toggle('open');
        el.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  function initHoverLineTrace() {
    const style = document.createElement("style");
    style.textContent = `
      ._line-trace-wrap { position: relative; }
      ._line-trace {
        position: absolute; bottom: 0; left: 0;
        height: 1px; width: 0; background: ${RED};
        transition: width 400ms ease-out;
        pointer-events: none;
      }
      ._line-trace-wrap:hover ._line-trace {
        width: 100%;
      }

      ._timeline-box-wrap {
        position: relative;
      }

      ._timeline-box-trace {
        position: absolute;
        inset: -10px -14px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 160ms ease-out;
      }

      ._timeline-box-trace span {
        position: absolute;
        background: ${RED};
        box-shadow: 0 0 10px rgba(${RED_RGB.join(",")}, 0.24);
      }

      ._timeline-box-trace ._trace-top,
      ._timeline-box-trace ._trace-bottom {
        left: 0;
        right: 0;
        height: 1px;
        transform: scaleX(0);
        transform-origin: var(--trace-origin, left);
        transition: transform 260ms ease-out;
      }

      ._timeline-box-trace ._trace-top {
        top: 0;
      }

      ._timeline-box-trace ._trace-bottom {
        bottom: 0;
      }

      ._timeline-box-trace ._trace-left,
      ._timeline-box-trace ._trace-right {
        top: 0;
        bottom: 0;
        width: 1px;
        transform: scaleY(0);
        transform-origin: top;
        transition: transform 220ms ease-out 240ms;
      }

      ._timeline-box-trace ._trace-left {
        left: 0;
      }

      ._timeline-box-trace ._trace-right {
        right: 0;
      }

      ._timeline-box-wrap:hover ._timeline-box-trace {
        opacity: 1;
      }

      ._timeline-box-wrap:hover ._timeline-box-trace ._trace-top,
      ._timeline-box-wrap:hover ._timeline-box-trace ._trace-bottom {
        transform: scaleX(1);
      }

      ._timeline-box-wrap:hover ._timeline-box-trace ._trace-left,
      ._timeline-box-wrap:hover ._timeline-box-trace ._trace-right {
        transform: scaleY(1);
      }
    `;
    document.head.appendChild(style);

    document
      .querySelectorAll(".readout-row, .prize-entry")
      .forEach((el) => {
        el.classList.add("_line-trace-wrap");
        if (el.style.position === "" || el.style.position === "static") {
          el.style.position = "relative";
        }
        if (el.querySelector("._line-trace")) return;
        const line = document.createElement("div");
        line.className = "_line-trace";
        el.appendChild(line);
      });

    document.querySelectorAll(".timeline-item").forEach((item) => {
      item.classList.remove("_line-trace-wrap");
      item.querySelectorAll("._line-trace").forEach((line) => line.remove());
    });

    document.querySelectorAll(".timeline-copy").forEach((copy) => {
      copy.classList.add("_timeline-box-wrap");
      if (copy.style.position === "" || copy.style.position === "static") {
        copy.style.position = "relative";
      }
      if (copy.querySelector("._timeline-box-trace")) return;
      const box = document.createElement("div");
      box.className = "_timeline-box-trace";
      box.innerHTML = `
        <span class="_trace-top"></span>
        <span class="_trace-right"></span>
        <span class="_trace-bottom"></span>
        <span class="_trace-left"></span>
      `;
      copy.appendChild(box);
    });
  }

  // ===== INTERACTION: Reveal on Scroll — Glitch Text Entrance =====
  function initRevealOnScroll() {
    const headings = document.querySelectorAll(".glitch-text");
    if (!headings.length) return;

    headings.forEach((h) => {
      h.style.opacity = "0";
      h.style.transform = "translateY(40px)";
      h.style.transition =
        "opacity 800ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    headings.forEach((h) => observer.observe(h));
  }

  // ===== TEAM MARQUEE =====
  function initTeamGrid() {
    const heads = [
      {
        name: "AMANDEEP SINGH",
        role: "COMMITTEE HEAD",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Amandeep_2025-26.png",
        profile: "#",
      },
      {
        name: "VIRAJ BHARTIYA",
        role: "COMMITTEE HEAD",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Viraj_2025-26.png",
        profile: "#",
      },
      {
        name: "OMIK ACHARYA",
        role: "TECH HEAD",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Omik_2025-26.png",
        profile: "#",
      },
      {
        name: "ADITI SINGH",
        role: "CREATIVE HEAD",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Aditi_2025-26.png",
        profile: "#",
      },
      {
        name: "RISHI SHANBHAG",
        role: "MARKETING HEAD",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Rishi_2025-26.png",
        profile: "#",
      },
    ];

    const ty = [
      {
        name: "ADITYA BELGAONKAR",
        role: "TECH",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Aditya_2025-26.png",
        profile: "#",
      },
      {
        name: "KUMAR TANAY",
        role: "TECH",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Kumar_2025-26.png",
        profile: "#",
      },
      {
        name: "VIVEK JAIN",
        role: "TECH",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Vivek_2025-26.png",
        profile: "#",
      },
      {
        name: "AKANKSHA AGROYA",
        role: "CREATIVE",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Akanksha_2025-26.png",
        profile: "#",
      },
      {
        name: "AMRIT NIGAM",
        role: "CREATIVE",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Amrit_2025-26.png",
        profile: "#",
      },
      {
        name: "CHAITANYA DHAMDHERE",
        role: "MARKETING",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Chaitanya_2025-26.png",
        profile: "#",
      },
      {
        name: "DHARMIK CHANDEL",
        role: "MARKETING",
        dept: "IT/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Dharmik_2025-26.png",
        profile: "#",
      },
      {
        name: "SHREYANS TATIYA",
        role: "MARKETING",
        dept: "COMPS/TY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Shreyans_2025-26.png",
        profile: "#",
      },
    ];

    const sy = [
      {
        name: "ANMOL RAI",
        role: "TECH",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Anmol_2025-26.png",
        profile: "#",
      },
      {
        name: "ASHWERA HASAN",
        role: "TECH",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Ashwera_2025-26.png",
        profile: "#",
      },
      {
        name: "SAMAGRA AGARWAL",
        role: "TECH",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Samagra_2025-26.png",
        profile: "#",
      },
      {
        name: "SHANTANAV MUKHERJEE",
        role: "TECH",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Shantanav_2025-26.png",
        profile: "#",
      },
      {
        name: "TANUJ ADARKAR",
        role: "TECH",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Tanuj_2025-26.png",
        profile: "#",
      },
      {
        name: "VINAYAK PAI",
        role: "TECH",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Vinayak_2025-26.png",
        profile: "#",
      },
      {
        name: "AMEYA DEORE",
        role: "CREATIVE",
        dept: "CSBS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Ameya_2025-26.png",
        profile: "#",
      },
      {
        name: "PURVA POTE",
        role: "CREATIVE",
        dept: "CSBS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Purva_2025-26.png",
        profile: "#",
      },
      {
        name: "DIVYANSHI YADAV",
        role: "CREATIVE",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Divyanshi_2025-26.png",
        profile: "#",
      },
      {
        name: "DHANYA SHUKLA",
        role: "CREATIVE",
        dept: "COMPS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Dhanya_2025-26.png",
        profile: "#",
      },
      {
        name: "ARSHIA DANG",
        role: "MARKETING",
        dept: "IT/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Arshia_2025-26.png",
        profile: "#",
      },
      {
        name: "PARTH PANWAR",
        role: "MARKETING",
        dept: "AIDS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Parth_2025-26.png",
        profile: "#",
      },
      {
        name: "HARSHIL RAVARIYA",
        role: "MARKETING",
        dept: "AIDS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Harshil_2025-26.png",
        profile: "#",
      },
      {
        name: "SAMAIRA SHARMA",
        role: "MARKETING",
        dept: "IT/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Samaira_2025-26.png",
        profile: "#",
      },
      {
        name: "SHRAVIKA MHATRE",
        role: "MARKETING",
        dept: "VLSI/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Shravika_2025-26.png",
        profile: "#",
      },
      {
        name: "SRUSHTI TALANDAGE",
        role: "MARKETING",
        dept: "CSBS/SY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Srushti_2025-26.png",
        profile: "#",
      },
    ];

    const fy = [
      {
        name: "BHOUMIK SANGLE",
        role: "TECH",
        dept: "COMPS/FY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Bhoumik_2025-26.png",
        profile: "#",
      },
      {
        name: "DHRUV KUMAR",
        role: "TECH",
        dept: "COMPS/FY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Dhruv_2025-26.png",
        profile: "#",
      },
      {
        name: "PRANAV MENDON",
        role: "TECH",
        dept: "COMPS/FY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Pranav_2025-26.png",
        profile: "#",
      },
      {
        name: "ANCHITA SAHU",
        role: "CREATIVE",
        dept: "IT/FY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Anchita_2025-26.png",
        profile: "#",
      },
      {
        name: "MITALI PAUL",
        role: "CREATIVE",
        dept: "COMPS/FY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Mitali_2025-26.png",
        profile: "#",
      },
      {
        name: "RUDRAKSHI ACHARYYA",
        role: "MARKETING",
        dept: "COMPS/FY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Rudrakshi_2025-26.png",
        profile: "#",
      },
      {
        name: "YASH AGROYA",
        role: "MARKETING",
        dept: "IT/FY",
        photo: "https://kjssecodecell.com/static/images/team-2025-26/Yash_2025-26.png",
        profile: "#",
      },
    ];

    function makeCard(member) {
      const card = document.createElement("a");
      card.className = "team-card";
      card.href = member.profile;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute("aria-label", "Open " + member.name + " profile");

      card.innerHTML = `
        <div class="team-photo">
          <img src="${member.photo}" alt="${member.name}" loading="lazy" />
        </div>
        <div class="team-name">${member.name}</div>
        <div class="team-role">${member.role}</div>
      `;

      return card;
    }

    function fillRow(rowId, members) {
      const row = document.getElementById(rowId);
      if (!row) return;
      for (let pass = 0; pass < 2; pass++) {
        members.forEach((m) => row.appendChild(makeCard(m)));
      }
    }

    fillRow("team-row-heads", heads);
    fillRow("team-row-ty", ty);
    fillRow("team-row-sy", sy);
    fillRow("team-row-fy", fy);
  }

  // ===== INTERACTION: Keyboard Whisper — Key Press Feedback =====
  function initKeyboardWhisper() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes _whisperFade {
        0% { opacity: 0.15; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
      ._key-whisper {
        position: fixed; bottom: 40px; right: 24px;
        font-family: 'Courier New', monospace; font-size: 80px;
        color: #4fd1d9; pointer-events: none; z-index: 9994;
        animation: _whisperFade 300ms ease-out forwards;
        line-height: 1;
      }
    `;
    document.head.appendChild(style);

    let whispers = [];

    document.addEventListener("keydown", (e) => {
      // Skip if inside game section
      const hero = document.getElementById("hero-section");
      if (hero && hero.contains(document.activeElement)) return;
      // Skip modifier/special keys
      if (e.key.length > 1) return;

      if (whispers.length >= 3) {
        const oldest = whispers.shift();
        oldest.remove();
      }

      const w = document.createElement("div");
      w.className = "_key-whisper";
      w.textContent = e.key;
      w.style.bottom = 40 + whispers.length * 70 + "px";
      document.body.appendChild(w);
      whispers.push(w);

      setTimeout(() => {
        w.remove();
        whispers = whispers.filter((x) => x !== w);
      }, 300);
    });
  }
})();
