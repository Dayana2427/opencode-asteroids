'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Cada skin define casco (body), color, morro (nose) y llama (flame/flameX).
// Solo cambia la apariencia: la hitbox de la nave es siempre la misma.
const SKINS = [
  {
    name: 'CLÁSICA',
    color: '#fff',
    body: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    nose: 21,
    flame: 'rgba(255, 130, 0, 0.85)',
    flameX: 8,
  },
  {
    name: 'RETRO',
    color: '#0f0',
    body: [[14, -6], [14, 6], [-4, 6], [-10, 12], [-10, -12], [-4, -6]],
    nose: 16,
    flame: 'rgba(255, 255, 0, 0.85)',
    flameX: 10,
  },
  {
    name: 'CAZA',
    color: '#f44',
    body: [[24, 0], [-10, -7], [-6, 0], [-10, 7]],
    nose: 25,
    flame: 'rgba(255, 60, 60, 0.9)',
    flameX: 8,
  },
  {
    name: 'PLATILLO',
    color: '#0ff',
    body: [[10, -3], [6, -11], [-4, -11], [-12, -4], [-12, 4], [-4, 11], [6, 11], [10, 3]],
    nose: 13,
    flame: 'rgba(0, 255, 200, 0.85)',
    flameX: 12,
  },
  {
    name: 'NEÓN',
    color: '#f4f',
    body: [[22, 0], [2, -10], [-4, -4], [-14, -8], [-9, 0], [-14, 8], [-4, 4], [2, 10]],
    nose: 24,
    flame: 'rgba(255, 100, 255, 0.9)',
    flameX: 12,
  },
];

const SKIN_STORAGE_KEY = 'asteroids-skin';
let currentSkin = 0;
let skinNoticeTimer = 0;

try {
  const saved = Number(localStorage.getItem(SKIN_STORAGE_KEY));
  if (Number.isInteger(saved) && saved >= 0 && saved < SKINS.length) currentSkin = saved;
} catch {}

function cycleSkin() {
  currentSkin = (currentSkin + 1) % SKINS.length;
  try { localStorage.setItem(SKIN_STORAGE_KEY, String(currentSkin)); } catch {}
  skinNoticeTimer = 1.5;
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = this.speedBoost > 0 ? 520 : 260;  // px/s² (x2 con power-up)
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = SKINS[currentSkin].nose;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[currentSkin];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Casco según el skin activo
    ctx.beginPath();
    ctx.moveTo(skin.body[0][0], skin.body[0][1]);
    for (let i = 1; i < skin.body.length; i++)
      ctx.lineTo(skin.body[i][0], skin.body[i][1]);
    ctx.closePath();

    // Halo cian mientras dura el power-up de velocidad
    if (this.speedBoost > 0) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.lineWidth   = 5;
      ctx.stroke();
      ctx.lineWidth   = 1.5;
    }

    ctx.strokeStyle = skin.color;
    ctx.stroke();

    // Llama del propulsor (más intensa con el power-up)
    if (this.thrusting && Math.random() > (this.speedBoost > 0 ? 0.15 : 0.35)) {
      const fx = -skin.flameX;
      ctx.beginPath();
      ctx.moveTo(fx, -4);
      ctx.lineTo(fx - rand(this.speedBoost > 0 ? 10 : 6, this.speedBoost > 0 ? 20 : 14), 0);
      ctx.lineTo(fx,  4);
      ctx.strokeStyle = this.speedBoost > 0 ? 'rgba(0, 255, 255, 0.9)' : skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up ──────────────────────────────────────────────────────────────────
const POWERUP_DROP_CHANCE    = 0.15; // probabilidad de drop al destruir un asteroide
const POWERUP_SPEED_DURATION = 5;    // segundos de efecto "Velocidad"

class PowerUp {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.type   = 'speed';
    this.radius = 10;
    this.ttl    = 10;
    this.rot    = 0;
    this.dead   = false;
  }

  update(dt) {
    this.rot += 2 * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por desaparecer
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Rayo (símbolo de velocidad) dentro de un rombo
    ctx.beginPath();
    ctx.moveTo( 0, -12);
    ctx.lineTo( 9,  0);
    ctx.lineTo( 0, 12);
    ctx.lineTo(-9,  0);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo( 1, -5);
    ctx.lineTo(-2,  0);
    ctx.lineTo( 1,  0);
    ctx.lineTo(-1,  5);
    ctx.stroke();

    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const STAR_POINTS        = 250;  // puntos al destruirla
const STAR_SPAWN_MIN     = 8;    // seg mínimo entre spawns
const STAR_SPAWN_MAX     = 15;   // seg máximo entre spawns
const STAR_MAX_ON_SCREEN = 1;    // máximo simultáneas en pantalla

class ShootingStar {
  constructor() {
    // Nace en un borde aleatorio y apunta hacia el interior de la pantalla
    const side = randInt(0, 3);
    if (side === 0)      { this.x = rand(0, W); this.y = 0; }
    else if (side === 1) { this.x = rand(0, W); this.y = H; }
    else if (side === 2) { this.x = 0; this.y = rand(0, H); }
    else                 { this.x = W; this.y = rand(0, H); }

    const angle = Math.atan2(H / 2 - this.y + rand(-150, 150),
                             W / 2 - this.x + rand(-150, 150));
    const SPEED = rand(380, 450);
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;

    this.radius = 12;
    this.ttl    = rand(4, 6);
    this.dead   = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    // Estela: segmentos que se desvanecen detrás del núcleo
    const tailX = this.x - this.vx * 0.12;
    const tailY = this.y - this.vy * 0.12;
    ctx.strokeStyle = 'rgba(255, 220, 100, 0.5)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 220, 100, 0.25)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 0.2, this.y - this.vy * 0.2);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    // Núcleo dorado brillante
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let starSpawnTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starSpawnTimer = rand(STAR_SPAWN_MIN, STAR_SPAWN_MAX);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  starSpawnTimer = rand(STAR_SPAWN_MIN, STAR_SPAWN_MAX);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // El cambio de skin funciona en cualquier estado
  if (skinNoticeTimer > 0) skinNoticeTimer -= dt;
  if (pressed('KeyC')) cycleSkin();

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Spawn periódico de estrellas fugaces
  starSpawnTimer -= dt;
  if (starSpawnTimer <= 0) {
    if (shootingStars.length < STAR_MAX_ON_SCREEN)
      shootingStars.push(new ShootingStar());
    starSpawnTimer = rand(STAR_SPAWN_MIN, STAR_SPAWN_MAX);
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < POWERUP_DROP_CHANCE)
          powerups.push(new PowerUp(a.x, a.y));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += STAR_POINTS;
        explode(s.x, s.y, 10);
        if (Math.random() < POWERUP_DROP_CHANCE)
          powerups.push(new PowerUp(s.x, s.y));
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets       = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
    // Nave vs estrella fugaz
    if (!ship.dead) {
      for (const s of shootingStars) {
        if (dist(ship, s) < ship.radius + s.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
  }

  // Nave vs power-up
  for (const p of powerups) {
    if (dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.speedBoost = POWERUP_SPEED_DURATION;
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkin];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(0.45, 0.45);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2 / 0.45;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.body[0][0], skin.body[0][1]);
  for (let i = 1; i < skin.body.length; i++)
    ctx.lineTo(skin.body[i][0], skin.body[i][1]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (ship.speedBoost > 0) {
    ctx.fillStyle = '#0ff';
    ctx.fillText(`VELOCIDAD ${ship.speedBoost.toFixed(1)}s`, 14, 48);
  }

  // Aviso temporal al cambiar de skin
  if (skinNoticeTimer > 0) {
    const skin = SKINS[currentSkin];
    ctx.fillStyle = skin.color;
    ctx.textAlign = 'center';
    ctx.fillText(`SKIN: ${skin.name}`, W / 2, 48);
  }

  // Pista fija de la tecla de skins
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font      = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('C · SKIN', 14, H - 12);
}

function drawOverlay(title, sub, sub2) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
  if (sub2) ctx.fillText(sub2, W / 2, H / 2 + 48);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  powerups.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shootingStars.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER',
                `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`,
                'C PARA CAMBIAR NAVE');
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
