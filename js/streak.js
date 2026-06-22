/**
 * Streak Module
 *
 * Pure data layer — handles localStorage persistence, streak
 * calculation, and profile management. Zero DOM coupling.
 */
const Streak = (() => {
  'use strict';

  const STORAGE_KEY = 'boxbreathing_profile';

  // ── Date helpers ─────────────────────────────────

  function todayStr() {
    const d = new Date();
    return isoDate(d);
  }

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return isoDate(d);
  }

  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ── Storage ──────────────────────────────────────

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }

  function save(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  // ── Profile ──────────────────────────────────────

  function getProfile() {
    return load();
  }

  function createProfile(name) {
    const profile = {
      name: name.trim() || 'Friend',
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      lastSessionDate: null,
    };
    save(profile);
    return profile;
  }

  // ── Session Recording ────────────────────────────
  // Called when a breathing session completes.
  // Returns { profile, message }
  function recordSession(cyclesCompleted) {
    const profile = load() || {
      name: 'Friend',
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      lastSessionDate: null,
    };

    const today = todayStr();
    const yesterday = yesterdayStr();

    // Always increment total sessions
    profile.totalSessions = (profile.totalSessions || 0) + 1;

    // Streak logic
    if (profile.lastSessionDate === yesterday) {
      profile.currentStreak++;
    } else if (profile.lastSessionDate === today) {
      // Already did a session today — streak unchanged
    } else {
      // Missed day or first session — reset to 1
      profile.currentStreak = 1;
    }

    // Update all-time best
    if (profile.currentStreak > (profile.longestStreak || 0)) {
      profile.longestStreak = profile.currentStreak;
    }

    profile.lastSessionDate = today;
    save(profile);

    return { profile, message: celebrationMessage(profile.currentStreak) };
  }

  // ── Status Check ─────────────────────────────────
  // Called on app open to determine what banner to show.
  // Returns { status, profile, message }
  // status: 'none' | 'active' | 'warning' | 'reset'
  function checkStatus() {
    const profile = load();
    if (!profile || !profile.lastSessionDate) {
      return { status: 'none', profile: null };
    }

    const today = todayStr();
    const yesterday = yesterdayStr();

    if (profile.lastSessionDate === today) {
      return {
        status: 'active',
        profile,
        message: `🔥 Day ${profile.currentStreak} streak — session done today!`,
      };
    }

    if (profile.lastSessionDate === yesterday) {
      const days = profile.currentStreak;
      return {
        status: 'warning',
        profile,
        message: `⚠️ Streak on the line! ${days} day${days > 1 ? 's' : ''} — breathe to keep it alive.`,
      };
    }

    const days = profile.currentStreak;
    return {
      status: 'reset',
      profile,
      message: `Your streak ended. You had ${days} day${days > 1 ? 's' : ''}. Ready for a fresh start?`,
    };
  }

  // ── Celebration Messages ─────────────────────────

  function celebrationMessage(streak) {
    if (streak === 1) return '🌱 Day 1 — a new streak begins!';
    if (streak === 7) return "🔥 One week! You're on fire!";
    if (streak === 30) return '🏆 30 days! That\'s a month of consistency!';
    if (streak % 7 === 0) {
      const weeks = streak / 7;
      return `🔥 ${streak} days! ${weeks} week${weeks > 1 ? 's' : ''} strong!`;
    }
    return `🔥 Day ${streak} streak! Keep going.`;
  }

  return {
    getProfile,
    createProfile,
    recordSession,
    checkStatus,
    celebrationMessage,
  };
})();
