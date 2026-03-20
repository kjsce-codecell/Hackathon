let audioCtx = null;
let droneOsc = null;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        startDrone();
    } catch (e) {
        audioCtx = null;
    }
}

function startDrone() {
    if (!audioCtx) return;
    droneOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    droneOsc.type = "sine";
    droneOsc.frequency.setValueAtTime(60, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    droneOsc.connect(gain);
    gain.connect(audioCtx.destination);
    droneOsc.start();
}

function playClick() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playRefine() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playNope() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playMilestone() {
    if (!audioCtx) return;
    const freqs = [200, 267, 333];
    freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq + i * 2, audioCtx.currentTime);
        osc.detune.setValueAtTime(i * 10, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.5,
        );
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    });
}

// Global Konami Code / Easter Egg Listener
(function () {
    let keys = [];
    const MAX_KEYS = Math.max(
        "codecell".length,
        "cheetah".length,
        "sher".length,
    );

    window.addEventListener("keydown", (e) => {
        keys.push(e.key.toLowerCase());
        if (keys.length > MAX_KEYS) {
            keys.shift();
        }

        const sequence = keys.join("");

        // Check codecell
        if (sequence.endsWith("codecell")) {
            // You can add logic for the visual easter egg here similar to the React one,
            // or simply log/play a sound.
            console.log("CODECELL Easter Egg triggered!");
            // Example visual implementation using a temporary overlay:
            let overlay = document.getElementById("codecell-easter-egg");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.id = "codecell-easter-egg";
                overlay.style.cssText =
                    "display:flex; position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; justify-content:center; align-items:center; opacity:0; transition:all 0.5s ease-out; pointer-events:none; transform:scale(0.5);";
                overlay.innerHTML =
                    '<img src="images/codecell.jpeg" style="width: 1000px; height: 600px; max-width: 80vw; max-height: 80vw; object-contain: cover; border-radius: 10%; box-shadow: 0 0 150px rgba(255,255,255,0.6);" />';
                document.body.appendChild(overlay);
            }
            setTimeout(() => {
                overlay.style.opacity = "1";
                overlay.style.transform = "scale(1)";
            }, 50);
            setTimeout(() => {
                overlay.style.opacity = "0";
                overlay.style.transform = "scale(0.5)";
            }, 4500);
            setTimeout(() => {
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 5000);
        }

        // Check sher
        if (sequence.endsWith("sher")) {
            const audio = new Audio("audio-assets/sher.opus");
            audio.play().catch(console.error);
        }

        // Check cheetah
        if (sequence.endsWith("cheetah")) {
            const audio = new Audio("audio-assets/cheetah.opus");
            audio.play().catch(console.error);
        }
    });
})();
