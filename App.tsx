
import React, { useState, useCallback } from 'react';
import GameComponent from './components/GameComponent';
import { WeaponLevel } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<{
    score: number;
    hp: number;
    weaponLevel: WeaponLevel;
    isGameOver: boolean;
  }>({
    score: 0,
    hp: 100,
    weaponLevel: WeaponLevel.LEVEL_1,
    isGameOver: false,
  });

  const [highScore, setHighScore] = useState(0);

  const handleStateChange = useCallback((score: number, hp: number, weaponLevel: WeaponLevel, isGameOver: boolean) => {
    setGameState({ score, hp, weaponLevel, isGameOver });
    if (score > highScore) setHighScore(score);
  }, [highScore]);

  const restartGame = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-full h-screen bg-[#020617] flex items-center justify-center overflow-hidden">
      {/* Main Game Frame */}
      <div className="relative border-[8px] border-[#1e293b] rounded-sm overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] bg-black">
        <GameComponent onStateUpdate={handleStateChange} />
        
        {/* CRT Scanline Overlay Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />

        {/* HUD Overlay - Styled like the screenshot */}
        <div className="absolute bottom-6 left-6 pointer-events-none select-none z-40">
          <div className="bg-[#0f172a]/90 border-2 border-[#34d399] p-4 rounded-tr-3xl min-w-[180px] backdrop-blur-md shadow-[4px_-4px_15px_rgba(52,211,153,0.2)]">
            <div className="space-y-2 border-b-2 border-[#34d399]/30 pb-3">
              <div className="flex justify-between items-center">
                <span className="text-[#34d399] text-[9px] font-['Press_Start_2P']">SCORE:</span>
                <span className="text-white text-xs font-['Press_Start_2P'] tracking-tighter">{gameState.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#34d399] text-[9px] font-['Press_Start_2P']">HEALTH:</span>
                <span className={`text-xs font-['Press_Start_2P'] ${gameState.hp < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{gameState.hp}%</span>
              </div>
            </div>
            
            <div className="pt-3 flex items-center gap-3">
               <div className="w-10 h-10 border-2 border-[#fbbf24] flex items-center justify-center bg-[#fbbf24]/10 relative">
                  <span className="text-[#fbbf24] text-[14px] font-['Press_Start_2P']">
                    {gameState.weaponLevel === 1 ? 'C' : gameState.weaponLevel === 2 ? 'P' : 'S'}
                  </span>
                  {/* Small icon bits */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#fbbf24]" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[7px] text-gray-400 font-['Press_Start_2P'] mb-1">ARMAMENT</span>
                  <span className="text-[9px] text-white font-['Press_Start_2P'] uppercase">LEVEL {gameState.weaponLevel}</span>
               </div>
            </div>
          </div>
        </div>

        {/* FPS & SYSTEM Label */}
        <div className="absolute top-4 left-4 flex gap-4 text-white/30 text-[9px] font-['Orbitron'] z-40 uppercase tracking-widest">
          <span>FPS: 60</span>
          <span>LINK: STABLE</span>
        </div>

        {/* Game Over Screen */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000 z-[100]">
            <div className="w-full max-w-xs border-y-4 border-red-600 py-8 mb-8">
              <h2 className="text-4xl font-bold text-red-600 mb-2 font-['Press_Start_2P'] italic">CRITICAL FAILURE</h2>
            </div>
            <div className="text-white font-['Press_Start_2P'] text-xs mb-12 space-y-4">
              <p>PILOT STATUS: MIA</p>
              <p className="text-blue-400">FINAL DATA: {gameState.score} PTS</p>
            </div>
            <button 
              onClick={restartGame}
              className="px-10 py-5 bg-transparent border-4 border-[#34d399] text-[#34d399] font-['Press_Start_2P'] text-sm hover:bg-[#34d399] hover:text-black transition-all active:scale-95 shadow-[0_0_40px_rgba(52,211,153,0.4)]"
            >
              DEPLOY NEW VESSEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
