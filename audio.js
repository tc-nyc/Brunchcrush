/* Zero-dependency Web Audio API sound effects + mobile haptic feedback */
window.BRUNCH_AUDIO = (() => {
  let ctx = null;
  let enabled = true;

  function ensureContext() {
    if (!enabled) return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function unlock() {
    ensureContext();
  }

  function setEnabled(val) {
    enabled = Boolean(val);
  }

  function isEnabled() {
    return enabled;
  }

  function vibrate(pattern) {
    if (!enabled) return;
    if (navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  function playTone(freq, duration, type = 'sine', gainPeak = 0.14, delay = 0, slideTo = null) {
    const audio = ensureContext();
    if (!audio) return;
    const now = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function swap() {
    playTone(340, 0.08, 'triangle', 0.09, 0, 480);
    vibrate(10);
  }

  function invalid() {
    playTone(210, 0.09, 'sawtooth', 0.07, 0, 150);
    playTone(165, 0.11, 'sawtooth', 0.07, 0.08, 125);
    vibrate([18, 25, 18]);
  }

  function match(combo = 1) {
    // Cheerful pentatonic climb as cascades chain
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
    const base = scale[Math.min(combo - 1, scale.length - 1)];
    playTone(base, 0.14, 'triangle', 0.14, 0, base * 1.12);
    playTone(base * 1.5, 0.12, 'sine', 0.08, 0.04);
    vibrate(combo >= 2 ? 22 : 12);
  }

  function specialCreate() {
    playTone(587.33, 0.12, 'triangle', 0.14, 0);
    playTone(880.0, 0.16, 'triangle', 0.14, 0.07);
    playTone(1174.66, 0.22, 'sine', 0.12, 0.14);
    vibrate([18, 20, 26]);
  }

  function specialBlast() {
    playTone(220, 0.26, 'sawtooth', 0.12, 0, 75);
    playTone(660, 0.22, 'triangle', 0.13, 0.02, 1200);
    vibrate([28, 22, 34]);
  }

  function win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      playTone(n, 0.22, 'triangle', 0.15, idx * 0.09);
    });
    vibrate([25, 40, 25, 40, 50]);
  }

  function lose() {
    playTone(392, 0.18, 'triangle', 0.12, 0, 349);
    playTone(329.6, 0.2, 'triangle', 0.12, 0.16, 261.6);
    vibrate([40, 40, 40]);
  }

  function coffeePrompt() {
    // Warm café bell chime
    playTone(659.25, 0.28, 'sine', 0.14, 0);
    playTone(880.0, 0.32, 'sine', 0.14, 0.12);
    playTone(1318.5, 0.45, 'sine', 0.12, 0.24);
    vibrate([20, 30, 30]);
  }

  function reshuffle() {
    [440, 392, 349, 494].forEach((n, i) => {
      playTone(n, 0.11, 'triangle', 0.1, i * 0.06);
    });
    vibrate([16, 20, 16, 20, 24]);
  }

  return {
    unlock,
    setEnabled,
    isEnabled,
    swap,
    invalid,
    match,
    specialCreate,
    specialBlast,
    win,
    lose,
    coffeePrompt,
    reshuffle,
  };
})();
