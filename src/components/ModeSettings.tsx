import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Gamepad2, Lock, Zap, Activity, Cpu } from 'lucide-react';

export const ModeSettings = () => {
  const [winLock, setWinLock] = useState(false);
  const [altF4Lock, setAltF4Lock] = useState(false);
  const [altTabLock, setAltTabLock] = useState(false);
  const [gamingOptimization, setGamingOptimization] = useState(true);
  const [trickRate, setTrickRate] = useState(1);
  const [antiWobble, setAntiWobble] = useState(2);
  const [pollingRate, setPollingRate] = useState(1000);

  return (
    <div className="flex h-full w-full bg-gray-50 p-8 overflow-y-auto">
       <div className="max-w-3xl mx-auto w-full space-y-8">
          
          {/* Gaming Optimizations */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                   <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-gray-900">Gaming Optimizations</h3>
                   <p className="text-xs text-gray-500">Prevent accidental interruptions during gameplay</p>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-4">
                <LockToggle label="Lock Windows Key" checked={winLock} onChange={setWinLock} />
                <LockToggle label="Lock Alt + F4" checked={altF4Lock} onChange={setAltF4Lock} />
                <LockToggle label="Lock Alt + Tab" checked={altTabLock} onChange={setAltTabLock} />
             </div>
          </section>

          {/* Performance Tuning */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-8">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                   <Cpu className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-gray-900">Performance Tuning</h3>
                   <p className="text-xs text-gray-500">Adjust hardware response characteristics</p>
                </div>
             </div>

             {/* Gaming Optimization Toggle */}
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                   <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" /> Dynamic Stroke Optimization
                   </h4>
                   <p className="text-xs text-gray-500 mt-1">Dynamically adjusts ranges to avoid disconnection issues</p>
                </div>
                <Toggle checked={gamingOptimization} onChange={setGamingOptimization} />
             </div>

             {/* Trick Rate */}
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-sm font-bold text-gray-900">Trick Rate (Reporting Interval)</label>
                   <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{trickRate}ms</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={trickRate}
                  onChange={(e) => setTrickRate(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[10px] text-gray-400">Adjusts reporting intervals for compatibility with older systems</p>
             </div>

             {/* Anti-Wobbliness */}
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-sm font-bold text-gray-900">Anti-Wobbliness Level</label>
                   <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">Level {antiWobble}</span>
                </div>
                <div className="flex gap-2">
                   {[0, 1, 2, 3, 4].map(level => (
                     <button
                       key={level}
                       onClick={() => setAntiWobble(level)}
                       className={cn(
                         "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                         antiWobble === level 
                           ? "bg-black text-white border-black" 
                           : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                       )}
                     >
                       {level === 0 ? "Off" : `Lvl ${level}`}
                     </button>
                   ))}
                </div>
                <p className="text-[10px] text-gray-400">Increases debounce delay slightly to reduce double-click issues</p>
             </div>

             {/* Polling Rate */}
             <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                   <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Polling Rate
                   </label>
                   <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{pollingRate}Hz</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                   {[125, 250, 500, 1000].map(rate => (
                     <button
                       key={rate}
                       onClick={() => setPollingRate(rate)}
                       className={cn(
                         "py-2 rounded-lg text-xs font-bold transition-all border",
                         pollingRate === rate 
                           ? "bg-green-500 text-white border-green-500 shadow-md" 
                           : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                       )}
                     >
                       {rate}Hz
                     </button>
                   ))}
                </div>
                <p className="text-[10px] text-gray-400">Higher polling rate increases CPU usage but reduces latency</p>
             </div>

          </section>
       </div>
    </div>
  );
};

const LockToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={cn(
      "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all gap-3",
      checked 
        ? "border-red-500 bg-red-50" 
        : "border-gray-100 bg-gray-50 hover:border-gray-200"
    )}
  >
     <div className={cn(
       "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
       checked ? "bg-red-100 text-red-600" : "bg-white text-gray-400"
     )}>
        <Lock className="w-5 h-5" />
     </div>
     <span className={cn("text-xs font-bold", checked ? "text-red-600" : "text-gray-500")}>{label}</span>
     <div className={cn("text-[10px] font-bold uppercase", checked ? "text-red-500" : "text-gray-400")}>
       {checked ? "LOCKED" : "UNLOCKED"}
     </div>
  </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={cn(
      "w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300",
      checked ? "bg-[#00E6CC]" : "bg-gray-200"
    )}
  >
    <motion.div 
      layout
      className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm"
      animate={{ left: checked ? 26 : 4 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </div>
);
