/**
 * App Module — Breathing Engine
 *
 * The core breathing loop, audio cues, and session lifecycle.
 * Depends on: Streak, UI (global)
 */
(() => {
  'use strict';

  // ── Config ──────────────────────────────────────

  const PHASES = [
    { id: 'inhale',   label: 'Inhale', duration: 4 },
    { id: 'hold-in',  label: 'Hold',   duration: 4 },
    { id: 'exhale',   label: 'Exhale', duration: 4 },
    { id: 'hold-out', label: 'Hold',   duration: 4 },
  ];

  const CYCLE_DURATION = PHASES.reduce((sum, p) => sum + p.duration, 0); // 16s
  const TOTAL_DURATION = 300; // 5 minutes
  const TOTAL_CYCLES = Math.floor(TOTAL_DURATION / CYCLE_DURATION); // 18

  const ARC_LENGTH = 2 * Math.PI * 134; // ~842

  // ── DOM refs ────────────────────────────────────

  const $ = (id) => document.getElementById(id);

  const dom = {
    app:          $('app'),
    progressArc:  $('progressArc'),
    phaseName:    $('phaseName'),
    phaseTimer:   $('phaseTimer'),
    cycleCount:   $('cycleCount'),
    cycleTotal:   $('cycleTotal'),
    timeRemaining: $('timeRemaining'),
    idleText:     $('idleText'),
    btnStart:     $('btnStart'),
    btnReset:     $('btnReset'),
    dots:         document.querySelectorAll('.phase-dot'),
  };

  // ── State ───────────────────────────────────────

  let running = false;
  let phaseIndex = 0;
  let cycle = 0;
  let phaseStart = 0;
  let sessionStart = 0;
  let animFrameId = null;
  let audioCtx = null;

  // ── Audio (Web Audio API) ───────────────────────

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  /**
   * Play an Om (Aum) sound for phase transitions.
   * Uses layered oscillators to create a deep, resonant humming quality
   * with harmonics that mimic the sacred Om mantra.
   */
  function playOm(duration = 1.2) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Om fundamental ~136.1 Hz with rich harmonic overtones
    const harmonics = [
      { freq: 136.10, gain: 0.18, type: 'sine' },   // Fundamental (Om)
      { freq: 272.20, gain: 0.10, type: 'sine' },   // 2nd harmonic
      { freq: 408.30, gain: 0.05, type: 'sine' },   // 3rd harmonic
      { freq: 544.40, gain: 0.03, type: 'sine' },   // 4th harmonic
      { freq: 680.50, gain: 0.015, type: 'sine' },  // 5th harmonic
    ];

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    // Slow attack (A) — the "A" in Aum
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.25);
    // Sustain (U) — hold resonance
    masterGain.gain.setValueAtTime(0.30, now + 0.5);
    // Release (M) — gentle fade
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(audioCtx.destination);

    harmonics.forEach(({ freq, gain: hGain, type }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(hGain, now);
      osc.connect(gain).connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // ── Formatting ──────────────────────────────────

  function formatTime(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ── Phase Transition ────────────────────────────

  function setPhase(idx) {
    phaseIndex = idx;
    const phase = PHASES[idx];

    dom.app.dataset.phase = phase.id;
    dom.phaseName.textContent = phase.label;

    dom.dots.forEach((dot) =>
      dot.classList.toggle('active', dot.dataset.dot === phase.id)
    );

    playOm();
  }

  // ── Progress Update ─────────────────────────────

  function updateProgress(phaseElapsed, phaseDuration, totalElapsed) {
    // Arc: fraction of current phase elapsed
    const frac = Math.min(phaseElapsed / phaseDuration, 1);
    dom.progressArc.style.strokeDashoffset = ARC_LENGTH * (1 - frac);

    // Phase countdown
    const phaseSecLeft = Math.max(0, Math.ceil(phaseDuration - phaseElapsed));
    dom.phaseTimer.textContent = `${phaseSecLeft}s`;

    // Total remaining time
    const remaining = Math.max(0, TOTAL_DURATION * 1000 - totalElapsed);
    dom.timeRemaining.textContent = formatTime(remaining);
  }

  // ── Tick Loop ───────────────────────────────────

  function tick() {
    if (!running) return;

    const now = performance.now();
    const phaseElapsed = (now - phaseStart) / 1000;
    const currentPhase = PHASES[phaseIndex];
    const totalElapsed = now - sessionStart;

    updateProgress(phaseElapsed, currentPhase.duration, totalElapsed);

    // Phase transition
    if (phaseElapsed >= currentPhase.duration) {
      const nextIdx = (phaseIndex + 1) % PHASES.length;

      // Completed a full cycle?
      if (nextIdx === 0 && (TOTAL_DURATION * 1000 - totalElapsed) >= CYCLE_DURATION * 1000) {
        cycle++;
        dom.cycleCount.textContent = cycle;
      }

      // Session complete?
      if (totalElapsed >= TOTAL_DURATION * 1000) {
        finish();
        return;
      }

      phaseStart = now;
      setPhase(nextIdx);
    }

    animFrameId = requestAnimationFrame(tick);
  }

  // ── Session Lifecycle ───────────────────────────

  function start() {
    ensureAudio();

    running = true;
    cycle = 1;
    dom.cycleCount.textContent = '1';
    sessionStart = performance.now();
    phaseStart = sessionStart;

    dom.btnStart.disabled = true;
    dom.btnReset.disabled = false;
    dom.idleText.style.opacity = '0';

    setPhase(0);
    animFrameId = requestAnimationFrame(tick);
  }

  function finish() {
    running = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    dom.phaseName.textContent = 'Done';
    dom.phaseTimer.textContent = '0s';
    dom.timeRemaining.textContent = '0:00';
    dom.cycleCount.textContent = cycle;
    dom.progressArc.style.strokeDashoffset = 0;

    dom.btnStart.disabled = true;
    dom.btnReset.disabled = false;
    dom.idleText.style.opacity = '1';
    dom.idleText.textContent = 'Session complete!';
    dom.app.dataset.phase = 'idle';
    dom.dots.forEach((d) => d.classList.remove('active'));

    // Record session and update streak
    const { profile, message } = Streak.recordSession(cycle);
    UI.renderStats(profile);
    UI.showCelebration(message);
  }

  function reset() {
    running = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    phaseIndex = 0;
    cycle = 0;

    dom.phaseName.textContent = 'Ready';
    dom.phaseTimer.textContent = formatTime(TOTAL_DURATION * 1000);
    dom.timeRemaining.textContent = formatTime(TOTAL_DURATION * 1000);
    dom.cycleCount.textContent = '0';

    dom.progressArc.style.transition = 'none';
    dom.progressArc.style.strokeDashoffset = ARC_LENGTH;
    requestAnimationFrame(() => {
      dom.progressArc.style.transition = '';
    });

    dom.btnStart.disabled = false;
    dom.btnReset.disabled = true;
    dom.idleText.style.opacity = '1';
    dom.idleText.textContent = 'Press Start to begin';
    dom.app.dataset.phase = 'idle';
    dom.dots.forEach((d) => d.classList.remove('active'));
  }

  // ── Init ────────────────────────────────────────

  function init() {
    dom.btnStart.addEventListener('click', start);
    dom.btnReset.addEventListener('click', reset);

    dom.cycleTotal.textContent = TOTAL_CYCLES;
    dom.phaseTimer.textContent = formatTime(TOTAL_DURATION * 1000);

    // First-time vs returning user
    if (!UI.checkReturning()) {
      UI.showWelcome();
    }
  }

  init();
})();
