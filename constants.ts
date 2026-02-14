
export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 800;

export const PLAYER_SPEED = 5;
export const PLAYER_RADIUS = 25;
export const PLAYER_HITBOX_SCALE = 0.3;

export const BULLET_SPEED = 10;
export const ENEMY_BULLET_SPEED = 6;

export const WEAPON_UPGRADE_DURATION = 10000; // 10 seconds

export const ENEMY_CONFIGS = {
  SUICIDE: {
    hp: 1,
    speed: 4,
    color: '#ff4d4d',
    score: 100
  },
  S_CURVE: {
    hp: 2,
    speed: 2,
    color: '#4dff88',
    score: 200,
    sineAmp: 100,
    sineFreq: 0.005
  },
  SNIPER: {
    hp: 3,
    speed: 1.5,
    color: '#4d94ff',
    score: 500,
    fireRate: 3000
  }
};
