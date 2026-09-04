# AGENTS.md

## Overview

Single-page HTML5 Asteroids clone. All game logic lives in one file, `game.js`
(vanilla ES6, no framework, no bundler, no dependencies). `index.html` only
hosts a fixed 800x600 `<canvas>` and loads `game.js`.

## Running

- Open `index.html` directly in a browser, or `npx serve .` → http://localhost:3000
- There is no build step, no test suite, no linter, and no CI.

## Conventions

- User-facing text (HUD, overlays, comments) is in **Spanish**; keep it that way.
- `W`/`H` (800/600) are duplicated in `index.html` canvas attributes and in
  `game.js` — change both together.
- All positions wrap toroidally via the `wrap()` helper; new moving entities
  should use it too.
- Entities follow the same pattern: `update(dt)`, `draw()`, and a `dead` flag
  that the main `update()` uses to filter arrays.
- Constants are inline (e.g. `SPEED = 520`, `DRAG = 0.987` inside `Ship.update`);
  shared per-size tables live in `RADII`/`SPEEDS`/`POINTS`.
- Game flow states: `'playing' | 'dead' | 'gameover'` handled in `update()`;
  restarting is bound to Space in the gameover state.
- Power-ups: destroyed asteroids (and shooting stars) have a
  `POWERUP_DROP_CHANCE` chance of dropping one via the `dropPowerUp()` helper,
  chosen evenly (1/3) between `'speed'` (doubles ship thrust for
  `POWERUP_SPEED_DURATION` seconds; cyan halo), `'triple'` (fires 3 parallel
  bullets per shot with `TRIPLE_OFFSET` px separation for
  `POWERUP_TRIPLE_DURATION` seconds; magenta halo), and `'shield'` (green
  pulsing ring of `SHIELD_RADIUS` around the ship for
  `POWERUP_SHIELD_DURATION` seconds). While active, the shield vaporizes
  asteroids/shooting stars on contact — no splitting — awarding their points
  and applying the drop chance again; the shield survives hits. Handled by the
  `PowerUp` class and the `powerups` array; HUD timers stack below `SCORE`
  (`VELOCIDAD`/`TRIPLE`/`ESCUDO`).
- Shooting star ("estrella fugaz"): fast golden entity (`ShootingStar` class,
  `shootingStars` array) that spawns periodically every
  `STAR_SPAWN_MIN`–`STAR_SPAWN_MAX` seconds (max `STAR_MAX_ON_SCREEN` at once),
  expires on its own via `ttl`, kills the ship on contact, and awards
  `STAR_POINTS` (no splitting) when shot; power-up drop chance applies to it too.
- Skins: the `C` key cycles the ship's appearance (`cycleSkin()`), works in any
  game state. Skins live in the `SKINS` table (hull `body`, `color`, `nose`
  offset for bullet spawn, `flame` color and `flameX` anchor for the thruster).
  Optional per-skin fields: `scale` (default 1, via `skinScale()`) scales the
  hull/flame rendering, bullet-spawn nose, shield-ring radius, HUD life icons
  and the ship hitbox (`12 × scale`); `pointsMultiplier` (default 1) multiplies
  every score gain via the `addPoints()` helper. Power-ups render as colored halos
  (cyan/magenta) over the hull instead of replacing its color. Selection persists in
  localStorage (`SKIN_STORAGE_KEY`), with a fallback for missing/invalid values.
  `drawLifeIcon` reuses the active skin's hull so HUD life icons match. The
  `GIGANTE` skin is green and twice the size of the original hull (`scale: 2`),
  awarding double points (`pointsMultiplier: 2`).
