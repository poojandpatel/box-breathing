/**
 * UI Module
 *
 * Handles all overlay, banner, toast, and stats rendering.
 * Depends on: Streak (for profile data)
 */
const UI = (() => {
  'use strict';

  // ── DOM refs (cached on first access) ────────────

  function el(id) {
    return document.getElementById(id);
  }

  // ── Welcome Overlay ──────────────────────────────

  function showWelcome(onComplete) {
    const overlay = el('welcomeOverlay');
    const nameInput = el('nameInput');
    const btnEnter = el('btnEnter');

    if (!overlay) return;

    overlay.classList.add('visible');
    nameInput.focus();

    const toggleBtn = () => {
      btnEnter.disabled = !nameInput.value.trim();
    };

    nameInput.addEventListener('input', toggleBtn);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && nameInput.value.trim()) done();
    });

    function done() {
      const profile = Streak.createProfile(nameInput.value);
      renderStats(profile);
      const name = profile.name || 'Friend';
      setIdleText(`Welcome, ${name} — press Start to begin`);
      overlay.classList.remove('visible');
      if (typeof onComplete === 'function') onComplete(profile);
    }

    btnEnter.addEventListener('click', done);
  }

  // ── Streak Banner (top of screen) ────────────────
  // Auto-dismisses after 6s or on tap.

  function showBanner(message, type) {
    const banner = el('streakBanner');
    if (!banner) return;

    banner.textContent = message;
    banner.className = `streak-banner ${type} visible`;
    banner.onclick = () => banner.classList.remove('visible');

    setTimeout(() => banner.classList.remove('visible'), 6000);
  }

  // ── Celebration Toast (bottom of screen) ─────────
  // Auto-dismisses after 5s.

  function showCelebration(message) {
    const toast = el('celebration');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');

    setTimeout(() => toast.classList.remove('visible'), 5000);
  }

  // ── Streak Stats Display ─────────────────────────
  // Renders current streak, best streak, total sessions.

  function renderStats(profile) {
    const current = el('currentStreak');
    const longest = el('longestStreak');
    const total = el('totalSessions');

    if (current) current.textContent = profile.currentStreak || 0;
    if (longest) longest.textContent = profile.longestStreak || 0;
    if (total) total.textContent = profile.totalSessions || 0;
  }

  // ── Breathing Tip ────────────────────────────────
  // Shows on each load unless dismissed. Persists dismissal in session.

  let tipDismissed = false;

  function initTip() {
    const tip = el('breathingTip');
    const dismissBtn = el('tipDismiss');
    if (!tip) return;

    if (tipDismissed) {
      tip.classList.add('hidden');
      return;
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        tipDismissed = true;
        tip.classList.add('hidden');
      });
    }
  }

  // ── Idle Text ────────────────────────────────────

  function setIdleText(text) {
    const idleText = el('idleText');
    if (idleText) idleText.textContent = text;
  }

  // ── Rotate Warning (mobile landscape) ────────────
  // screen.orientation.angle works on all modern mobile browsers including iOS Safari.

  function checkRotateWarning() {
    const rotate = el('rotateWarning');
    if (!rotate) return;

    const isMobile = Math.min(screen.width, screen.height) <= 800;
    const angle = screen.orientation ? screen.orientation.angle : 0;
    const isLandscape = angle === 90 || angle === -90;

    if (isMobile && isLandscape) {
      rotate.classList.add('visible');
    } else {
      rotate.classList.remove('visible');
    }
  }

  function initRotateWarning() {
    checkRotateWarning();
    window.addEventListener('orientationchange', () => {
      setTimeout(checkRotateWarning, 150);
    });
  }

  // ── Returning User Check ─────────────────────────
  // On app open: load profile, render stats, show banner if needed.
  // Returns true if user profile exists.

  function checkReturning() {
    const profile = Streak.getProfile();
    if (!profile) return false;

    renderStats(profile);

    const name = profile.name || 'Friend';
    setIdleText(`Welcome back, ${name} — press Start to begin`);

    const { status, message } = Streak.checkStatus();

    if (status === 'warning') {
      showBanner(message, 'warning');
    } else if (status === 'reset') {
      showBanner(message, 'reset');
    } else if (status === 'active') {
      showBanner(message, 'active');
    }

    return true;
  }

  return {
    showWelcome,
    showBanner,
    showCelebration,
    renderStats,
    checkReturning,
    initTip,
    initRotateWarning,
    setIdleText,
  };
})();
