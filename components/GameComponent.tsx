
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GAME_WIDTH, GAME_HEIGHT, PLAYER_RADIUS, PLAYER_HITBOX_SCALE, 
  PLAYER_SPEED, BULLET_SPEED, ENEMY_BULLET_SPEED, ENEMY_CONFIGS, WEAPON_UPGRADE_DURATION 
} from '../constants';
import { 
  EnemyType, WeaponLevel, Vector2D, Enemy, Bullet, Particle, PowerUp, GameState 
} from '../types';

interface GameComponentProps {
  onStateUpdate: (score: number, hp: number, weaponLevel: WeaponLevel, isGameOver: boolean) => void;
}

interface BackgroundAsset {
  x: number;
  y: number;
  size: number;
  speed: number;
  rot: number;
  rotVel: number;
  type: 'ASTEROID' | 'NEBULA';
  color?: string;
}

// Pixel Data Definitions
// 0: transparent, 1: primary, 2: secondary/shadow, 3: accent, 4: cockpit/glass
const PLAYER_PIXELS = [
  [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,4,4,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,4,4,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,3,3,1,1,1,1,1,1,3,3,1,0,0],
  [0,1,3,3,1,1,1,1,1,1,1,1,3,3,1,0],
  [1,3,3,1,1,1,1,1,1,1,1,1,1,3,3,1],
  [1,1,1,1,1,2,2,1,1,2,2,1,1,1,1,1],
  [1,1,1,1,1,2,2,1,1,2,2,1,1,1,1,1],
  [0,1,1,1,0,0,0,1,1,0,0,0,1,1,1,0],
  [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const SUICIDE_PIXELS = [
  [0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,1,1,3,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,2,2,2,2,1,1,0,0,0,0],
  [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,3,3,1,1,1,1,1,1,3,3,1,1,0],
  [1,1,3,3,3,3,1,1,1,1,3,3,3,3,1,1],
  [1,1,1,3,3,1,1,1,1,1,1,3,3,1,1,1],
  [0,1,1,1,1,1,2,2,2,2,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
];

const SNIPER_PIXELS = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,4,4,4,4,4,4,4,4,4,4,1,2,1],
  [1,2,1,4,3,3,4,4,4,4,3,3,4,1,2,1],
  [1,2,1,4,3,3,4,4,4,4,3,3,4,1,2,1],
  [1,2,1,4,4,4,4,4,4,4,4,4,4,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0],
];

const GameComponent: React.FC<GameComponentProps> = ({ onStateUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState & { assets: BackgroundAsset[] }>({
    player: {
      pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 120 },
      hp: 100,
      maxHp: 100,
      score: 0,
      weaponLevel: WeaponLevel.LEVEL_1,
      weaponTimeout: null,
      lastFired: 0,
    },
    enemies: [],
    bullets: [],
    particles: [],
    powerUps: [],
    isGameOver: false,
    shakeIntensity: 0,
    assets: [],
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const bgOffset = useRef(0);

  useEffect(() => {
    const assets: BackgroundAsset[] = [];
    for(let i=0; i<3; i++) {
       assets.push({
          x: Math.random() * GAME_WIDTH,
          y: Math.random() * GAME_HEIGHT,
          size: 200 + Math.random() * 300,
          speed: 0.2 + Math.random() * 0.3,
          rot: Math.random() * Math.PI,
          rotVel: 0,
          type: 'NEBULA',
          color: Math.random() > 0.5 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(14, 165, 233, 0.1)'
       });
    }
    for(let i=0; i<6; i++) {
      assets.push({
         x: Math.random() * GAME_WIDTH,
         y: Math.random() * GAME_HEIGHT,
         size: 25 + Math.random() * 55,
         speed: 0.6 + Math.random() * 1.4,
         rot: Math.random() * Math.PI,
         rotVel: (Math.random() - 0.5) * 0.03,
         type: 'ASTEROID'
      });
    }
    stateRef.current.assets = assets;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current[e.code] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const spawnEnemy = useCallback(() => {
    const types = [EnemyType.SUICIDE, EnemyType.S_CURVE, EnemyType.SNIPER];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = ENEMY_CONFIGS[type];
    const newEnemy: Enemy = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      pos: { x: Math.random() * (GAME_WIDTH - 100) + 50, y: -80 },
      initialX: 0,
      radius: type === EnemyType.SNIPER ? 35 : 25,
      hitboxScale: 0.7,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      lastFired: Date.now(),
      angle: 0
    };
    newEnemy.initialX = newEnemy.pos.x;
    stateRef.current.enemies.push(newEnemy);
  }, []);

  const createExplosion = (pos: Vector2D, color: string) => {
    for (let i = 0; i < 15; i++) {
      stateRef.current.particles.push({
        id: Math.random().toString(),
        pos: { ...pos },
        vel: { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 },
        radius: Math.random() * 4 + 2,
        hitboxScale: 0,
        color,
        life: 1, maxLife: 1,
      });
    }
  };

  const update = useCallback(() => {
    const state = stateRef.current;
    if (state.isGameOver) return;

    bgOffset.current = (bgOffset.current + 1.5) % 100;

    state.assets.forEach(a => {
      a.y += a.speed; a.rot += a.rotVel;
      if (a.y > GAME_HEIGHT + a.size) {
        a.y = -a.size; a.x = Math.random() * GAME_WIDTH;
      }
    });

    const p = state.player;
    if ((keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) && p.pos.x > 30) p.pos.x -= PLAYER_SPEED;
    if ((keysRef.current['ArrowRight'] || keysRef.current['KeyD']) && p.pos.x < GAME_WIDTH - 30) p.pos.x += PLAYER_SPEED;
    if ((keysRef.current['ArrowUp'] || keysRef.current['KeyW']) && p.pos.y > 30) p.pos.y -= PLAYER_SPEED;
    if ((keysRef.current['ArrowDown'] || keysRef.current['KeyS']) && p.pos.y < GAME_HEIGHT - 30) p.pos.y += PLAYER_SPEED;

    const now = Date.now();
    const canFire = keysRef.current['Space'] && (now - p.lastFired > 115);
    if (canFire) {
      if (p.weaponLevel === WeaponLevel.LEVEL_1) {
        state.bullets.push({ id: Math.random().toString(), pos: { x: p.pos.x, y: p.pos.y - 35 }, vel: { x: 0, y: -BULLET_SPEED * 1.3 }, radius: 3, hitboxScale: 1, isEnemy: false, damage: 1 });
      } else if (p.weaponLevel === WeaponLevel.LEVEL_2) {
        state.bullets.push({ id: Math.random().toString(), pos: { x: p.pos.x - 14, y: p.pos.y - 25 }, vel: { x: 0, y: -BULLET_SPEED * 1.3 }, radius: 3, hitboxScale: 1, isEnemy: false, damage: 1 });
        state.bullets.push({ id: Math.random().toString(), pos: { x: p.pos.x + 14, y: p.pos.y - 25 }, vel: { x: 0, y: -BULLET_SPEED * 1.3 }, radius: 3, hitboxScale: 1, isEnemy: false, damage: 1 });
      } else if (p.weaponLevel === WeaponLevel.LEVEL_3) {
        state.bullets.push({ id: Math.random().toString(), pos: { x: p.pos.x, y: p.pos.y - 35 }, vel: { x: 0, y: -BULLET_SPEED * 1.3 }, radius: 3, hitboxScale: 1, isEnemy: false, damage: 1 });
        state.bullets.push({ id: Math.random().toString(), pos: { x: p.pos.x - 12, y: p.pos.y - 25 }, vel: { x: -4, y: -BULLET_SPEED * 1.3 }, radius: 3, hitboxScale: 1, isEnemy: false, damage: 1 });
        state.bullets.push({ id: Math.random().toString(), pos: { x: p.pos.x + 12, y: p.pos.y - 25 }, vel: { x: 4, y: -BULLET_SPEED * 1.3 }, radius: 3, hitboxScale: 1, isEnemy: false, damage: 1 });
      }
      p.lastFired = now;
    }

    if (p.weaponTimeout && now > p.weaponTimeout) { p.weaponLevel = WeaponLevel.LEVEL_1; p.weaponTimeout = null; }

    state.enemies.forEach((enemy, index) => {
      switch (enemy.type) {
        case EnemyType.SUICIDE:
          enemy.pos.x += Math.sign(p.pos.x - enemy.pos.x) * 2.5;
          enemy.pos.y += enemy.speed * 1.1;
          break;
        case EnemyType.S_CURVE:
          enemy.angle += 0.07;
          enemy.pos.x = enemy.initialX + Math.sin(enemy.angle) * 110;
          enemy.pos.y += enemy.speed;
          break;
        case EnemyType.SNIPER:
          if (enemy.pos.y < 120) enemy.pos.y += enemy.speed;
          else if (now - enemy.lastFired > 2800) {
            const angle = Math.atan2(p.pos.y - enemy.pos.y, p.pos.x - enemy.pos.x);
            state.bullets.push({
              id: Math.random().toString(), pos: { ...enemy.pos },
              vel: { x: Math.cos(angle) * ENEMY_BULLET_SPEED, y: Math.sin(angle) * ENEMY_BULLET_SPEED },
              radius: 6, hitboxScale: 1, isEnemy: true, damage: 18
            });
            enemy.lastFired = now;
          }
          break;
      }
      if (enemy.pos.y > GAME_HEIGHT + 100) state.enemies.splice(index, 1);
      const dist = Math.hypot(enemy.pos.x - p.pos.x, enemy.pos.y - p.pos.y);
      if (dist < (enemy.radius * enemy.hitboxScale) + (PLAYER_RADIUS * PLAYER_HITBOX_SCALE)) {
        p.hp -= 20; state.shakeIntensity = 15; createExplosion(enemy.pos, '#ef4444'); state.enemies.splice(index, 1);
      }
    });

    state.bullets.forEach((bullet, bIdx) => {
      bullet.pos.x += bullet.vel.x; bullet.pos.y += bullet.vel.y;
      if (bullet.isEnemy) {
        if (Math.hypot(bullet.pos.x - p.pos.x, bullet.pos.y - p.pos.y) < bullet.radius + (PLAYER_RADIUS * PLAYER_HITBOX_SCALE)) {
          p.hp -= bullet.damage; state.shakeIntensity = 10; state.bullets.splice(bIdx, 1);
        }
      } else {
        state.enemies.forEach((enemy, eIdx) => {
          if (Math.hypot(bullet.pos.x - enemy.pos.x, bullet.pos.y - enemy.pos.y) < bullet.radius + (enemy.radius * enemy.hitboxScale)) {
            enemy.hp -= bullet.damage;
            state.particles.push({
              id: Math.random().toString(), pos: { ...bullet.pos }, vel: { x: (Math.random()-0.5)*5, y: 3 }, radius: 2, hitboxScale: 0, color: '#fff', life: 0.25, maxLife: 0.25
            });
            state.bullets.splice(bIdx, 1);
            if (enemy.hp <= 0) {
              p.score += ENEMY_CONFIGS[enemy.type].score;
              createExplosion(enemy.pos, ENEMY_CONFIGS[enemy.type].color);
              if (Math.random() < 0.25) state.powerUps.push({
                id: Math.random().toString(), pos: { ...enemy.pos }, radius: 18, hitboxScale: 1, type: 'UPGRADE', level: Math.random() > 0.5 ? WeaponLevel.LEVEL_3 : WeaponLevel.LEVEL_2
              });
              state.enemies.splice(eIdx, 1);
            }
          }
        });
      }
      if (bullet.pos.y < -100 || bullet.pos.y > GAME_HEIGHT + 100) state.bullets.splice(bIdx, 1);
    });

    state.powerUps.forEach((pu, index) => {
      pu.pos.y += 2.2;
      if (Math.hypot(pu.pos.x - p.pos.x, pu.pos.y - p.pos.y) < pu.radius + PLAYER_RADIUS) {
        p.weaponLevel = pu.level; p.weaponTimeout = now + WEAPON_UPGRADE_DURATION; state.powerUps.splice(index, 1);
      }
    });

    state.particles.forEach((pt, index) => {
      pt.pos.x += pt.vel.x; pt.pos.y += pt.vel.y; pt.life -= 0.035;
      if (pt.life <= 0) state.particles.splice(index, 1);
    });

    if (state.shakeIntensity > 0) state.shakeIntensity *= 0.92;
    if (p.hp <= 0) { p.hp = 0; state.isGameOver = true; }
    onStateUpdate(p.score, p.hp, p.weaponLevel, state.isGameOver);
  }, [onStateUpdate]);

  const drawPixelSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, pixels: number[][], size: number, colors: string[]) => {
    const startX = x - (pixels[0].length * size) / 2;
    const startY = y - (pixels.length * size) / 2;
    pixels.forEach((row, rIdx) => {
      row.forEach((pixel, cIdx) => {
        if (pixel !== 0) {
          ctx.fillStyle = colors[pixel - 1];
          ctx.fillRect(startX + cIdx * size, startY + rIdx * size, size, size);
        }
      });
    });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    // Engine Flames
    const flicker = Math.sin(Date.now() * 0.05) * 5 + 15;
    const colors = ['#f8fafc', '#3b82f6', '#ef4444', '#0ea5e9'];
    
    // Thrusters
    ctx.shadowBlur = 15; ctx.shadowColor = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(x - 10, y + 10); ctx.lineTo(x - 6, y + 10 + flicker); ctx.lineTo(x - 2, y + 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 2, y + 10); ctx.lineTo(x + 6, y + 10 + flicker); ctx.lineTo(x + 10, y + 10); ctx.fill();
    
    drawPixelSprite(ctx, x, y, PLAYER_PIXELS, 3, colors);
    ctx.restore();
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    ctx.save();
    if (enemy.type === EnemyType.SUICIDE) {
      const colors = ['#ef4444', '#991b1b', '#facc15'];
      drawPixelSprite(ctx, enemy.pos.x, enemy.pos.y, SUICIDE_PIXELS, 3, colors);
    } else if (enemy.type === EnemyType.S_CURVE) {
      ctx.fillStyle = '#991b1b';
      ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444';
      ctx.beginPath(); ctx.arc(enemy.pos.x, enemy.pos.y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + enemy.angle;
        ctx.beginPath(); ctx.moveTo(enemy.pos.x, enemy.pos.y);
        ctx.lineTo(enemy.pos.x + Math.cos(ang) * 35, enemy.pos.y + Math.sin(ang) * 35); ctx.stroke();
      }
    } else {
      const colors = ['#1e293b', '#334155', '#ef4444', '#3b82f6'];
      drawPixelSprite(ctx, enemy.pos.x, enemy.pos.y, SNIPER_PIXELS, 4, colors);
    }
    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    stateRef.current.assets.filter(a => a.type === 'NEBULA').forEach(a => {
       ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
       ctx.fillStyle = a.color || 'rgba(14, 165, 233, 0.1)';
       ctx.filter = 'blur(60px)';
       ctx.beginPath(); ctx.ellipse(0, 0, a.size, a.size*0.7, 0, 0, Math.PI*2); ctx.fill();
       ctx.restore();
    });

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)'; ctx.lineWidth = 1;
    const spacing = 50; const off = bgOffset.current % spacing;
    for (let x = 0; x <= GAME_WIDTH; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke(); }
    for (let y = off; y <= GAME_HEIGHT; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke(); }

    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const sx = (i * 91) % GAME_WIDTH;
      const sy = (i * 113 + bgOffset.current * (i % 2 + 0.5)) % GAME_HEIGHT;
      ctx.globalAlpha = (i % 4 + 1) / 10;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    stateRef.current.assets.filter(a => a.type === 'ASTEROID').forEach(a => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
      ctx.beginPath();
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const r = a.size * (0.8 + Math.random() * 0.4);
        const px = Math.cos(angle) * r; const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    });
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = stateRef.current;
    drawBackground(ctx);
    ctx.save();
    if (state.shakeIntensity > 1) ctx.translate((Math.random()-0.5)*state.shakeIntensity, (Math.random()-0.5)*state.shakeIntensity);

    state.powerUps.forEach(pu => {
      ctx.fillStyle = pu.level === WeaponLevel.LEVEL_3 ? '#facc15' : '#38bdf8';
      ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath(); ctx.arc(pu.pos.x, pu.pos.y, pu.radius, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Press Start 2P';
      ctx.textAlign = 'center'; ctx.fillText('UP', pu.pos.x, pu.pos.y + 4);
    });

    state.bullets.forEach(b => {
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 12; ctx.shadowColor = b.isEnemy ? '#ef4444' : '#fbbf24';
      ctx.beginPath(); ctx.roundRect(b.pos.x - 2, b.pos.y - 12, 4, 24, 2); ctx.fill();
    });

    state.particles.forEach(p => {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.fillRect(p.pos.x - p.radius, p.pos.y - p.radius, p.radius * 2, p.radius * 2);
    });
    ctx.globalAlpha = 1;

    state.enemies.forEach(e => drawEnemy(ctx, e));
    if (!state.isGameOver) drawPlayer(ctx, state.player.pos.x, state.player.pos.y);
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let spawnTimer = 0; let frameId: number;
    const loop = () => {
      update(); draw(ctx);
      spawnTimer += 16; if (spawnTimer > 1400) { spawnEnemy(); spawnTimer = 0; }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [update, draw, spawnEnemy]);

  return <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="cursor-none" />;
};

export default GameComponent;
