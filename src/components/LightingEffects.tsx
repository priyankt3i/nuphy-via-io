import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { 
  PowerOff, Square, ArrowDownUp, ArrowLeftRight, Activity,
  List, Aperture, RefreshCw, RefreshCcw, Palette,
  CloudRain, CloudDrizzle, Waves, Flame, Binary,
  MousePointer2, Target, Droplets, Crosshair, Maximize, MoveDiagonal,
  Keyboard as KeyboardIcon
} from 'lucide-react';
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

// Actual QMK RGB Matrix effects from NuPhy Air75 V2 JSON
const LIGHTING_EFFECTS = [
  { id: 'all_off', label: 'All Off', icon: <PowerOff className="w-5 h-5" />, value: 0 },
  { id: 'solid', label: 'Solid Color', icon: <Square className="w-5 h-5" />, value: 1 },
  { id: 'grad_ud', label: 'Gradient U/D', icon: <ArrowDownUp className="w-5 h-5" />, value: 2 },
  { id: 'grad_lr', label: 'Gradient L/R', icon: <ArrowLeftRight className="w-5 h-5" />, value: 3 },
  { id: 'breathing', label: 'Breathing', icon: <Activity className="w-5 h-5" />, value: 4 },
  { id: 'band_sat', label: 'Band Sat.', icon: <List className="w-5 h-5" />, value: 5 },
  { id: 'band_val', label: 'Band Val.', icon: <List className="w-5 h-5" />, value: 6 },
  { id: 'pinwheel_sat', label: 'Pinwheel Sat.', icon: <Aperture className="w-5 h-5" />, value: 7 },
  { id: 'pinwheel_val', label: 'Pinwheel Val.', icon: <Aperture className="w-5 h-5" />, value: 8 },
  { id: 'spiral_sat', label: 'Spiral Sat.', icon: <RefreshCw className="w-5 h-5" />, value: 9 },
  { id: 'spiral_val', label: 'Spiral Val.', icon: <RefreshCw className="w-5 h-5" />, value: 10 },
  { id: 'cycle_all', label: 'Cycle All', icon: <RefreshCcw className="w-5 h-5" />, value: 11 },
  { id: 'cycle_lr', label: 'Cycle L/R', icon: <ArrowLeftRight className="w-5 h-5" />, value: 12 },
  { id: 'cycle_ud', label: 'Cycle U/D', icon: <ArrowDownUp className="w-5 h-5" />, value: 13 },
  { id: 'rainbow_chev', label: 'Rainbow Chev.', icon: <Palette className="w-5 h-5" />, value: 14 },
  { id: 'cycle_out_in', label: 'Cycle Out/In', icon: <Maximize className="w-5 h-5" />, value: 15 },
  { id: 'cycle_out_in_dual', label: 'Cycle Out/In Dual', icon: <Maximize className="w-5 h-5" />, value: 16 },
  { id: 'cycle_pinwheel', label: 'Cycle Pinwheel', icon: <Aperture className="w-5 h-5" />, value: 17 },
  { id: 'cycle_spiral', label: 'Cycle Spiral', icon: <RefreshCw className="w-5 h-5" />, value: 18 },
  { id: 'dual_beacon', label: 'Dual Beacon', icon: <Target className="w-5 h-5" />, value: 19 },
  { id: 'rainbow_beacon', label: 'Rainbow Beacon', icon: <Target className="w-5 h-5" />, value: 20 },
  { id: 'rainbow_pinwheels', label: 'Rainbow Pinwheels', icon: <Aperture className="w-5 h-5" />, value: 21 },
  { id: 'raindrops', label: 'Raindrops', icon: <CloudRain className="w-5 h-5" />, value: 22 },
  { id: 'jellybean_raindrops', label: 'Jellybean Rain', icon: <CloudDrizzle className="w-5 h-5" />, value: 23 },
  { id: 'hue_breathing', label: 'Hue Breathing', icon: <Activity className="w-5 h-5" />, value: 24 },
  { id: 'hue_pendulum', label: 'Hue Pendulum', icon: <MoveDiagonal className="w-5 h-5" />, value: 25 },
  { id: 'hue_wave', label: 'Hue Wave', icon: <Waves className="w-5 h-5" />, value: 26 },
  { id: 'typing_heatmap', label: 'Typing Heatmap', icon: <Flame className="w-5 h-5" />, value: 27 },
  { id: 'digital_rain', label: 'Digital Rain', icon: <Binary className="w-5 h-5" />, value: 28 },
  { id: 'reactive_simple', label: 'Reactive Simple', icon: <MousePointer2 className="w-5 h-5" />, value: 29 },
  { id: 'reactive', label: 'Reactive', icon: <MousePointer2 className="w-5 h-5" />, value: 30 },
  { id: 'reactive_wide', label: 'Reactive Wide', icon: <ArrowLeftRight className="w-5 h-5" />, value: 31 },
  { id: 'reactive_multiwide', label: 'Reactive Multiwide', icon: <ArrowLeftRight className="w-5 h-5" />, value: 32 },
  { id: 'reactive_cross', label: 'Reactive Cross', icon: <Crosshair className="w-5 h-5" />, value: 33 },
  { id: 'reactive_multicross', label: 'Reactive Multicross', icon: <Crosshair className="w-5 h-5" />, value: 34 },
  { id: 'reactive_nexus', label: 'Reactive Nexus', icon: <Target className="w-5 h-5" />, value: 35 },
  { id: 'reactive_multinexus', label: 'Reactive MultiNexus', icon: <Target className="w-5 h-5" />, value: 36 },
  { id: 'splash', label: 'Splash', icon: <Droplets className="w-5 h-5" />, value: 37 },
  { id: 'multisplash', label: 'MultiSplash', icon: <Droplets className="w-5 h-5" />, value: 38 },
  { id: 'solid_splash', label: 'Solid Splash', icon: <Droplets className="w-5 h-5" />, value: 39 },
  { id: 'solid_multisplash', label: 'Solid MultiSplash', icon: <Droplets className="w-5 h-5" />, value: 40 },
];

const COLOR_PRESETS = [
  '#FF5722', '#FFEB3B', '#00E676', '#2979FF', '#651FFF', '#F50057', '#D50000', '#FFC107', '#00B0FF', '#76FF03', '#3D5AFE', '#E040FB'
];

export const LightingEffects: React.FC<LightingEffectsProps> = ({ lighting, deviceState }) => {
  const [activeEffect, setActiveEffect] = useState(3); // Default to Stair (value 3)
  const [brightness, setBrightness] = useState(100);
  const [speed, setSpeed] = useState(50);
  const [customColor, setCustomColor] = useState('#00E6CC');
  const [backlightEnabled, setBacklightEnabled] = useState(true);
  const [sidelightEnabled, setSidelightEnabled] = useState(true);

  // Initialize from device state
  useEffect(() => {
    if (deviceState?.lighting) {
      setBrightness(Math.round((deviceState.lighting.brightness / 255) * 100));
      setActiveEffect(deviceState.lighting.effect || 3);
    }
  }, [deviceState]);

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    const byteValue = Math.round((value / 100) * 255);
    lighting?.setBrightness(byteValue);
  };

  const handleEffectChange = (effectValue: number) => {
    setActiveEffect(effectValue);
    lighting?.setEffect(effectValue);
  };

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
    const byteValue = Math.round((value / 100) * 255);
    lighting?.setEffectSpeed(byteValue);
  };

  const handleColorChange = (color: string) => {
    setCustomColor(color);
    // Simple mock conversion for now: Hue 0-255, Sat 255
    lighting?.setColor(128, 255); 
  };

  return (
    <div className="flex h-full w-full bg-[#f5f5f5] p-6 gap-4 overflow-hidden">
      
      {/* Area 1: Toggles */}
      <div className="w-[260px] flex flex-col gap-4">
         {/* Back Light Settings Card */}
         <div className="bg-[#2A2A2A] rounded-2xl p-4 text-white flex flex-col gap-4 relative overflow-hidden shadow-lg">
            {/* Graphic */}
            <div className="h-28 bg-[#1A1A1A] rounded-xl flex items-center justify-center border border-[#00E6CC]/30 shadow-[0_0_20px_rgba(0,230,204,0.15)] relative overflow-hidden">
               <KeyboardIcon className="w-20 h-20 text-[#00E6CC] opacity-80" strokeWidth={1} />
               <div className="absolute inset-0 bg-gradient-to-t from-[#00E6CC]/10 to-transparent"></div>
            </div>
            <div className="flex justify-between items-center z-10 mt-2">
               <div>
                 <h3 className="text-sm font-bold tracking-tight">Back Light Settings</h3>
                 <p className="text-[10px] text-gray-400 leading-tight mt-1">Set the keyboard's Back Light<br/>effect</p>
               </div>
               <div 
                 className={cn("w-11 h-6 rounded-full relative cursor-pointer transition-colors", backlightEnabled ? "bg-[#00E6CC]" : "bg-gray-600")}
                 onClick={() => {
                    const newState = !backlightEnabled;
                    setBacklightEnabled(newState);
                    if (!newState) lighting?.setBrightness(0);
                    else lighting?.setBrightness(Math.round((brightness / 100) * 255));
                 }}
               >
                  <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all", backlightEnabled ? "left-6" : "left-1")}></div>
               </div>
            </div>
         </div>

         {/* Side Light Settings Card */}
         <div className="bg-white rounded-2xl p-4 text-gray-800 flex flex-col gap-4 border border-gray-200 shadow-sm">
            {/* Graphic */}
            <div className="h-28 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
               <KeyboardIcon className="w-20 h-20 text-gray-300" strokeWidth={1} />
            </div>
            <div className="flex justify-between items-center mt-2">
               <div>
                 <h3 className="text-sm font-bold tracking-tight">Side Light Settings</h3>
                 <p className="text-[10px] text-gray-400 leading-tight mt-1">Set the keyboard's Side Light<br/>effect</p>
               </div>
               <div 
                 className={cn("w-11 h-6 rounded-full relative cursor-pointer transition-colors", sidelightEnabled ? "bg-[#00E6CC]" : "bg-gray-200")}
                 onClick={() => setSidelightEnabled(!sidelightEnabled)}
               >
                  <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all", sidelightEnabled ? "left-6" : "left-1")}></div>
               </div>
            </div>
         </div>
      </div>

      {/* Area 2: Effects Grid */}
      <div className="w-[340px] bg-white rounded-2xl p-6 border border-gray-200 flex flex-col shadow-sm">
         <h3 className="text-sm font-bold text-gray-900 mb-4">Lighting Settings</h3>
         <div className="grid grid-cols-4 gap-3 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            {LIGHTING_EFFECTS.map((effect) => (
              <button
                key={effect.id}
                onClick={() => handleEffectChange(effect.value)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200",
                  activeEffect === effect.value
                    ? "bg-[#2A2A2A] text-white shadow-md scale-105"
                    : "bg-white border border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {effect.icon}
                <span className="text-[10px] font-medium tracking-tight">{effect.label}</span>
              </button>
            ))}
         </div>
      </div>

      {/* Area 3: Sliders */}
      <div className="w-[280px] bg-white rounded-2xl p-6 border border-gray-200 flex flex-col gap-10 shadow-sm">
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <label className="text-sm font-bold text-gray-900">Brightness</label>
               <span className="text-sm font-bold text-gray-500">{brightness}%</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={brightness} 
                onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2A2A2A]" 
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-3 px-1">
                 <span>0</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span>
              </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <label className="text-sm font-bold text-gray-900">Speed</label>
               <span className="text-sm font-bold text-gray-500">{speed}%</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={speed} 
                onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2A2A2A]" 
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-3 px-1">
                 <span>0</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span>
              </div>
            </div>
         </div>
      </div>

      {/* Area 4: Color Picker */}
      <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-200 flex flex-col shadow-sm min-w-[300px]">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900">Custom Color</h3>
            <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-pointer">
               <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
            </div>
         </div>

         <div className="flex flex-col xl:flex-row gap-8 h-full">
            {/* Color Picker Area */}
            <div className="flex-1 flex flex-col gap-4 max-w-[300px]">
               <div 
                 className="w-full aspect-square rounded-2xl shadow-inner relative border border-gray-100"
                 style={{ background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${customColor})` }}
               >
                  <div className="absolute top-6 right-6 w-5 h-5 rounded-full border-2 border-white shadow-md ring-1 ring-black/10"></div>
               </div>
               
               <div className="h-5 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 relative mt-2 shadow-inner">
                  <div className="absolute top-1/2 -translate-y-1/2 left-1/2 w-6 h-6 bg-white rounded-full border-2 border-gray-200 shadow-md cursor-pointer"></div>
               </div>
               
               <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 mt-2">
                  <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">HEX</span>
                  <input 
                    type="text" 
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="bg-transparent text-sm font-mono font-bold text-gray-900 outline-none w-full"
                  />
               </div>
            </div>

            {/* Presets */}
            <div className="flex-1 flex flex-col">
               <h4 className="text-xs font-bold text-gray-900 mb-4">Color Preset</h4>
               <div className="flex flex-wrap gap-3 mb-10">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className="w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform ring-1 ring-black/5"
                      style={{ backgroundColor: color }}
                    />
                  ))}
               </div>

               <h4 className="text-xs font-bold text-gray-900 mb-4">Recently Used</h4>
               <div className="flex flex-wrap gap-3">
                  <button className="w-8 h-8 rounded-full border-2 border-gray-100 bg-white hover:border-gray-300 transition-colors"></button>
                  <button className="w-8 h-8 rounded-full border-2 border-gray-100 bg-white hover:border-gray-300 transition-colors"></button>
                  <button className="w-8 h-8 rounded-full border-2 border-gray-100 bg-white hover:border-gray-300 transition-colors"></button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

