import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Sun, Zap, Activity, Waves, MousePointer, Grid, Clock, CloudRain, Wind, MoveDiagonal, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { DeviceState } from '../types';

interface LightingEffectsProps {
  lighting?: {
    setBrightness: (value: number) => Promise<void>;
    setEffect: (value: number) => Promise<void>;
    setEffectSpeed: (value: number) => Promise<void>;
    setColor: (hue: number, sat: number) => Promise<void>;
  };
  deviceState?: DeviceState;
}

const LIGHTING_EFFECTS = [
  { id: 'ray', label: 'Ray', icon: <Sun className="w-5 h-5" />, value: 1 },
  { id: 'stair', label: 'Stair', icon: <div className="w-5 h-5 flex items-end justify-center gap-0.5"><div className="w-1 h-2 bg-current"></div><div className="w-1 h-3 bg-current"></div><div className="w-1 h-4 bg-current"></div></div>, value: 2 },
  { id: 'static', label: 'Static', icon: <div className="w-5 h-5 border-b-2 border-current"></div>, value: 3 },
  { id: 'breath', label: 'Breath', icon: <Activity className="w-5 h-5" />, value: 4 },
  { id: 'flower', label: 'Flower', icon: <Zap className="w-5 h-5" />, value: 5 },
  { id: 'wave', label: 'Wave', icon: <Waves className="w-5 h-5" />, value: 6 },
  { id: 'ripple', label: 'Ripple', icon: <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full border border-current"></div></div>, value: 7 },
  { id: 'spout', label: 'Spout', icon: <div className="w-5 h-5 flex justify-center"><div className="w-1 h-full bg-current rotate-45"></div></div>, value: 8 },
  { id: 'galaxy', label: 'Galaxy', icon: <div className="w-5 h-5 grid grid-cols-2 gap-0.5"><div className="bg-current rounded-full"></div><div className="bg-current rounded-full opacity-50"></div><div className="bg-current rounded-full opacity-50"></div><div className="bg-current rounded-full"></div></div>, value: 9 },
  { id: 'rotation', label: 'Rotation', icon: <RotateIcon />, value: 10 },
  { id: 'point', label: 'Point', icon: <MousePointer className="w-5 h-5" />, value: 11 },
  { id: 'grid', label: 'Grid', icon: <Grid className="w-5 h-5" />, value: 12 },
  { id: 'time', label: 'Time', icon: <Clock className="w-5 h-5" />, value: 13 },
  { id: 'rain', label: 'Rain', icon: <CloudRain className="w-5 h-5" />, value: 14 },
  { id: 'ribbon', label: 'Ribbon', icon: <Wind className="w-5 h-5" />, value: 15 },
  { id: 'diagonal', label: 'Diagonal', icon: <MoveDiagonal className="w-5 h-5" />, value: 16 },
];

const COLOR_PRESETS = [
  '#FF5722', '#FFEB3B', '#00E676', '#2979FF', '#651FFF', '#F50057', '#D50000', '#FFC107', '#00B0FF', '#76FF03', '#3D5AFE', '#E040FB'
];

function RotateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 12" />
      <path d="M21 3v9h-9" />
    </svg>
  );
}

export const LightingEffects: React.FC<LightingEffectsProps> = ({ lighting, deviceState }) => {
  const [activeEffect, setActiveEffect] = useState('stair');
  const [brightness, setBrightness] = useState(100);
  const [speed, setSpeed] = useState(50);
  const [customColor, setCustomColor] = useState('#00BCD4');
  const [backlightEnabled, setBacklightEnabled] = useState(true);
  const [sidelightEnabled, setSidelightEnabled] = useState(true);
  const [glowEdgeEnabled, setGlowEdgeEnabled] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'down'>('right');

  // Initialize from device state
  useEffect(() => {
    if (deviceState?.lighting) {
      setBrightness(Math.round((deviceState.lighting.brightness / 255) * 100));
      // Map effect ID to our internal ID if possible
      const effect = LIGHTING_EFFECTS.find(e => e.value === deviceState.lighting?.effect);
      if (effect) {
        setActiveEffect(effect.id);
      }
    }
  }, [deviceState]);

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    // Convert 0-100 to 0-255
    const byteValue = Math.round((value / 100) * 255);
    lighting?.setBrightness(byteValue);
  };

  const handleEffectChange = (effectId: string) => {
    setActiveEffect(effectId);
    const effect = LIGHTING_EFFECTS.find(e => e.id === effectId);
    if (effect) {
      lighting?.setEffect(effect.value);
    }
  };

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
    const byteValue = Math.round((value / 100) * 255);
    lighting?.setEffectSpeed(byteValue);
  };

  const handleColorChange = (color: string) => {
    setCustomColor(color);
    // Convert Hex to HSV (Hue, Saturation) for QMK
    // This is a simplified conversion
    // QMK Hue is 0-255, Sat is 0-255
    
    // Simple mock conversion for now
    // In a real app, we'd parse the hex to RGB then to HSV
    lighting?.setColor(0, 255); 
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Panel: Effect Selection */}
      <div className="w-[320px] border-r border-gray-100 p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* Back Light Settings Card */}
        <div className="bg-[#333] text-white rounded-xl p-4 relative overflow-hidden group">
           <div className="relative z-10 flex justify-between items-end">
              <div>
                <h3 className="text-xs font-bold mb-1">Back Light Settings</h3>
                <p className="text-[10px] text-gray-400">Set the keyboard's Back Light effect</p>
              </div>
              <div 
                className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", backlightEnabled ? "bg-[#00E6CC]" : "bg-gray-600")}
                onClick={() => {
                   const newState = !backlightEnabled;
                   setBacklightEnabled(newState);
                   if (!newState) lighting?.setBrightness(0);
                   else lighting?.setBrightness(Math.round((brightness / 100) * 255));
                }}
              >
                 <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 shadow-sm transition-all", backlightEnabled ? "left-6" : "left-1")}></div>
              </div>
           </div>
           <div className="absolute top-2 right-2 opacity-10">
              <Grid className="w-16 h-16" />
           </div>
        </div>

        {/* Side Light Settings Card */}
        <div className="bg-white border border-gray-200 text-gray-800 rounded-xl p-4 relative overflow-hidden group">
           <div className="relative z-10 flex justify-between items-end">
              <div>
                <h3 className="text-xs font-bold mb-1">Side Light Settings</h3>
                <p className="text-[10px] text-gray-400">Set the keyboard's Side Light effect</p>
              </div>
              <div 
                className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", sidelightEnabled ? "bg-[#00E6CC]" : "bg-gray-200")}
                onClick={() => setSidelightEnabled(!sidelightEnabled)}
              >
                 <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 shadow-sm transition-all", sidelightEnabled ? "left-6" : "left-1")}></div>
              </div>
           </div>
        </div>

        {/* GlowEdge Settings Card */}
        <div className="bg-white border border-gray-200 text-gray-800 rounded-xl p-4 relative overflow-hidden group">
           <div className="relative z-10 flex justify-between items-end">
              <div>
                <h3 className="text-xs font-bold mb-1">GlowEdge Settings</h3>
                <p className="text-[10px] text-gray-400">Set the keyboard's GlowEdge effect</p>
              </div>
              <div 
                className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", glowEdgeEnabled ? "bg-[#00E6CC]" : "bg-gray-200")}
                onClick={() => setGlowEdgeEnabled(!glowEdgeEnabled)}
              >
                 <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 shadow-sm transition-all", glowEdgeEnabled ? "left-6" : "left-1")}></div>
              </div>
           </div>
        </div>

        {/* Effects Grid */}
        <div>
           <h3 className="text-xs font-bold text-gray-900 mb-4">Lighting Settings</h3>
           <div className="grid grid-cols-4 gap-2">
              {LIGHTING_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => handleEffectChange(effect.id)}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center gap-2 transition-all",
                    activeEffect === effect.id
                      ? "bg-[#333] text-white shadow-md"
                      : "bg-white border border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-900"
                  )}
                >
                  {effect.icon}
                  <span className="text-[9px] font-medium">{effect.label}</span>
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Middle Panel: Sliders */}
      <div className="w-[240px] border-r border-gray-100 p-6 flex flex-col gap-8">
         <div className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="text-xs font-bold text-gray-900">Brightness</label>
               <span className="text-xs font-bold text-gray-500">{brightness}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={brightness} 
              onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#333]" 
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-mono">
               <span>0</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span>
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="text-xs font-bold text-gray-900">Speed</label>
               <span className="text-xs font-bold text-gray-500">{speed}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={speed} 
              onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#333]" 
            />
         </div>

         <div className="space-y-4">
            <label className="text-xs font-bold text-gray-900">Direction</label>
            <div className="grid grid-cols-4 gap-2">
               {[
                 { id: 'left', icon: <ArrowLeft className="w-4 h-4" /> },
                 { id: 'right', icon: <ArrowRight className="w-4 h-4" /> },
                 { id: 'up', icon: <ArrowUp className="w-4 h-4" /> },
                 { id: 'down', icon: <ArrowDown className="w-4 h-4" /> }
               ].map((dir) => (
                 <button
                   key={dir.id}
                   onClick={() => setDirection(dir.id as any)}
                   className={cn(
                     "h-8 rounded-lg flex items-center justify-center border transition-all",
                     direction === dir.id
                       ? "bg-[#333] text-white border-[#333]"
                       : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                   )}
                 >
                   {dir.icon}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Right Panel: Color Picker */}
      <div className="flex-1 p-6">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-gray-900">Custom Color</h3>
            <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
               <div className="w-3 h-3 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
            </div>
         </div>

         <div className="flex gap-6">
            {/* Color Picker Area */}
            <div className="w-64 space-y-4">
               <div 
                 className="w-full aspect-square rounded-xl shadow-inner relative"
                 style={{ background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${customColor})` }}
               >
                  <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-black/20"></div>
               </div>
               <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-1/2 w-4 h-4 bg-white rounded-full border border-gray-200 shadow-sm"></div>
               </div>
               <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500">HEX</span>
                  <input 
                    type="text" 
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold text-gray-900 outline-none w-full"
                  />
               </div>
            </div>

            {/* Presets */}
            <div className="flex-1">
               <h4 className="text-[10px] font-bold text-gray-500 mb-3">Color Preset</h4>
               <div className="flex flex-wrap gap-2 mb-8">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
               </div>

               <h4 className="text-[10px] font-bold text-gray-500 mb-3">Recently Used</h4>
               <div className="flex flex-wrap gap-2">
                  <button className="w-8 h-8 rounded-full border border-gray-200 bg-white"></button>
                  <button className="w-8 h-8 rounded-full border border-gray-200 bg-white"></button>
                  <button className="w-8 h-8 rounded-full border border-gray-200 bg-white"></button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
