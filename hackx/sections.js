// sections.js — Canvas animations and interactivity for Hack X sections
(function () {
  "use strict";

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
      },
      { passive: true },
    );

    window.addEventListener(
      "mouseleave",
      () => {
        mouseX = -9999;
        mouseY = -9999;
      },
      { passive: true },
    );

    function draw() {
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
    initPrizeCounters();
    // initScrollProgressBar(); // removed — was showing blue line at top
    initAnnouncements();
    // Clean interactions (pure CSS, no rAF loops)
    initHoverLineTrace();
    initRevealOnScroll();
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

  // ===== ABOUT: Binary Rain (SUBTLE — low alpha, slow fall) =====
  function initAboutCanvas() {
    const canvas = document.getElementById("about-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const chars = "01アカサタナハマヤラワ{}[]<>/\\|=+-*&^%$#@!HACKXCODECEL";
    let columns, drops;

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      columns = Math.floor(canvas.width / 14);
      drops = new Array(columns).fill(1);
    }

    function draw() {
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
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
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

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
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

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
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

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
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

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
  }

  // ===== SCROLL FADE-IN (smoother: 0.6s ease-out) =====
  function initScrollFadeIn() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 },
    );

    document
      .querySelectorAll(".timeline-item, .about-stat")
      .forEach((item) => observer.observe(item));

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

  // ===== SUBTLE-BUT-WILD: Timeline Line Draw on Scroll =====
  // The timeline vertical line "draws" downward as you scroll through the section
  function initTimelineLineDraw() {
    const timelineSection = document.getElementById("timeline-section");
    if (!timelineSection) return;

    const timelineLine = timelineSection.querySelector(".timeline-line");
    if (!timelineLine) return;

    // Store original height, then set to 0
    const computedStyle = window.getComputedStyle(timelineLine);
    const fullHeight = timelineLine.offsetHeight || timelineLine.scrollHeight;
    timelineLine.style.height = "0px";
    timelineLine.style.transition = "none";
    timelineLine.style.overflow = "visible";

    function update() {
      const rect = timelineSection.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Start drawing when section enters viewport, finish when section leaves
      const scrollStart = viewportHeight * 0.8;
      const scrollEnd = -sectionHeight * 0.2;
      const progress = Math.max(
        0,
        Math.min(1, (scrollStart - sectionTop) / (scrollStart - scrollEnd)),
      );

      timelineLine.style.height = progress * fullHeight + "px";
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
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
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
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
        color: #ff0000ff; font-family: 'Geist Pixel', 'Courier New', monospace; font-size: 75px;
        text-align: center; pointer-events: none; font-weight : bold;
        text-shadow: 0 0 20px #ff0000ff; padding: 20px 40px;
        background: rgba(10, 0, 8, 1.0); border: 1px solid #ff0000ff;
        letter-spacing: 4px; text-transform: uppercase;
      `;
      musicUIContainer.appendChild(titleLabel);

      // Style stop button
      stopBtn.textContent = 'STOP THE MUSIC DANCE EXPERIENCE';
      stopBtn.style.cssText = `
        color: #ff0000ff; font-family: 'Courier New', monospace; font-size: 18px;
        text-align: center; cursor: pointer;
        text-shadow: 0 0 20px #ff0000ff; padding: 20px 40px;
        background: rgba(10, 0, 8, 0.85); border: 1px solid #ff0000ff;
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
      '&gt; STILL HERE? THE HACKATHON WON\'T WAIT. <a href="https://hackx.codecell.io/register" target="_blank" style="color:#4fd1d9;pointer-events:auto;text-decoration:underline;">[REGISTER]</a>';
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

  // ===== INTERACTION: Hover Line Trace — Cyan Border Trace =====
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
    `;
    document.head.appendChild(style);

    document
      .querySelectorAll(".readout-row, .prize-entry, .timeline-item")
      .forEach((el) => {
        el.classList.add("_line-trace-wrap");
        if (el.style.position === "" || el.style.position === "static") {
          el.style.position = "relative";
        }
        const line = document.createElement("div");
        line.className = "_line-trace";
        el.appendChild(line);
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
