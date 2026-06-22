# Box Breathing

A minimal, zero-dependency web app for guided box breathing (4-4-4-4).

## Usage

Open `index.html` in any browser — no build step, no server required.

## Rhythm

| Phase   | Duration |
|---------|----------|
| Inhale  | 4s       |
| Hold    | 4s       |
| Exhale  | 4s       |
| Hold    | 4s       |

**16s per cycle · 18 cycles · 5 minutes total**

## Features

- Animated breathing circle with phase-colored glow
- Soft sine tones on each phase transition (Web Audio API)
- Cycle counter and countdown timer
- **Streak tracking** — daily sessions build a streak, missed days show a warning
- **Celebration toasts** — milestone messages on streak milestones (7, 30, etc.)
- **Zero friction** — just enter your name, no email or account needed
- Fully responsive — works on phones, tablets, and desktops
- Single HTML file, no dependencies, no build step
- Data stored in localStorage (per-device)

## Streak Rules

- Complete one session per day to keep your streak alive
- Multiple sessions in one day count toward total sessions but not streak
- Miss a day → streak resets to 0 on next session
- Streaks, best streak, and session count persist in localStorage
