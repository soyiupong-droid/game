
export enum EnemyType {
  SUICIDE = 'SUICIDE',
  S_CURVE = 'S_CURVE',
  SNIPER = 'SNIPER'
}

export enum WeaponLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  pos: Vector2D;
  radius: number;
  hitboxScale: number;
}

export interface Bullet extends GameObject {
  vel: Vector2D;
  isEnemy: boolean;
  damage: number;
  angle?: number;
}

export interface Enemy extends GameObject {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  lastFired: number;
  initialX: number;
  angle: number; // for pathing
}

export interface Particle extends GameObject {
  vel: Vector2D;
  color: string;
  life: number;
  maxLife: number;
}

export interface PowerUp extends GameObject {
  type: 'UPGRADE';
  level: WeaponLevel;
}

export interface GameState {
  player: {
    pos: Vector2D;
    hp: number;
    maxHp: number;
    score: number;
    weaponLevel: WeaponLevel;
    weaponTimeout: number | null;
    lastFired: number;
  };
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  powerUps: PowerUp[];
  isGameOver: boolean;
  shakeIntensity: number;
}