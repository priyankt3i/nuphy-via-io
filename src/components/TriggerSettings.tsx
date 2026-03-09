import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Target, Zap, ArrowDown, ArrowUp, Info } from 'lucide-react';

export const TriggerSettings = () => {
  const [actuationPoint, setActuationPoint] = useState(1.2);
  const [rapidTrigger, setRapidTrigger] = useState(true);
  const [rtPress, setRtPress] = useState(0.15);
  const [rtRelease, setRtRelease] = useState(0.15);
  const [deadZoneTop, setDeadZoneTop] = useState(0.1);
  const [deadZoneBottom, setDeadZoneBottom] = useState(0.1);
  const [continuousRT, setContinuousRT] = useState(false);

  // Mock visualization of key press
  const [mockPressDepth, setMockPressDepth] = useState(0);

  return (
    <div className="flex h-full w-full bg-gray-50">
      {/* Left Panel: Visualization */}
      <div className="w-[360px] border-r border-gray-200 bg-white p-6 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Key Press Visualization</h3>
          <p className="text-xs text-gray-500">Real-time press depth reference</p>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
           {/* Key Visualization */}
           <div className="w-32 h-64 bg-gray-100 rounded-lg relative overflow-hidden border border-gray-200">
              {/* Travel Track */}
              <div className="absolute inset-x-0 top-0 h-full w-full flex flex-col justify-between py-2 px-4">
                 {[0, 1, 2, 3, 4].map(mm => (
                   <div key={mm} className="w-full border-b border-gray-300 flex items-end justify-end">
                     <span className="text-[9px] text-gray-400">{mm}mm</span>
                   </div>
                 ))}
              </div>

              {/* Actuation Line */}
              <div 
                className="absolute w-full border-t-2 border-dashed border-orange-500 z-10"
                style={{ top: `${(actuationPoint / 4) * 100}%` }}
              >
                <span className="absolute right-1 -top-4 text-[9px] font-bold text-orange-500">Actuation {actuationPoint}mm</span>
              </div>

              {/* Key Stem */}
              <motion.div 
                className="absolute top-0 left-4 right-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg shadow-lg z-20"
                style={{ height: `${(mockPressDepth / 4) * 100}%`, minHeight: '20px' }}
                animate={{ height: `${Math.max(5, (mockPressDepth / 4) * 100)}%` }}
              >
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">
                   {mockPressDepth.toFixed(2)}mm
                 </div>
              </motion.div>
           </div>
           
           {/* Interactive Slider to Simulate Press (since we don't have hardware) */}
           <div className="absolute right-0 top-1/2 -translate-y-1/2 h-64 w-8 bg-gray-100 rounded-full ml-4">
              <input 
                type="range" 
                min="0" 
                max="4" 
                step="0.01"
                value={mockPressDepth}
                onChange={(e) => setMockPressDepth(parseFloat(e.target.value))}
                className="h-full w-full appearance-none bg-transparent -rotate-180"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              />
           </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
           <div className="flex items-start gap-2">
             <Info className="w-4 h-4 text-blue-500 mt-0.5" />
             <p className="text-[10px] text-blue-600 leading-tight">
               Visualization is an approximation. Actual performance depends on switch physical characteristics.
             </p>
           </div>
        </div>
      </div>

      {/* Right Panel: Settings */}
      <div className="flex-1 p-8 overflow-y-auto">
         <div className="max-w-2xl space-y-8">
            
            {/* Actuation Point */}
            <section className="space-y-4">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Actuation Point</h3>
                    <p className="text-xs text-gray-500">Distance required to trigger a key press</p>
                  </div>
                  <span className="text-sm font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">{actuationPoint} mm</span>
               </div>
               <input 
                 type="range" 
                 min="0.1" 
                 max="3.8" 
                 step="0.1"
                 value={actuationPoint}
                 onChange={(e) => setActuationPoint(parseFloat(e.target.value))}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
               />
               <div className="flex justify-between text-xs text-gray-400 font-mono">
                 <span>0.1mm</span>
                 <span>4.0mm</span>
               </div>
            </section>

            <div className="h-px bg-gray-200"></div>

            {/* Rapid Trigger */}
            <section className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" /> Rapid Trigger (RT)
                    </h3>
                    <p className="text-xs text-gray-500">Reset key immediately upon release</p>
                  </div>
                  <Toggle checked={rapidTrigger} onChange={setRapidTrigger} />
               </div>

               {rapidTrigger && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="grid grid-cols-2 gap-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
                 >
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="flex items-center gap-1 text-orange-500"><ArrowDown className="w-3 h-3" /> Press Sensitivity</span>
                          <span>{rtPress} mm</span>
                       </div>
                       <input 
                         type="range" 
                         min="0.05" 
                         max="2.0" 
                         step="0.05"
                         value={rtPress}
                         onChange={(e) => setRtPress(parseFloat(e.target.value))}
                         className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                       />
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="flex items-center gap-1 text-blue-500"><ArrowUp className="w-3 h-3" /> Release Sensitivity</span>
                          <span>{rtRelease} mm</span>
                       </div>
                       <input 
                         type="range" 
                         min="0.05" 
                         max="2.0" 
                         step="0.05"
                         value={rtRelease}
                         onChange={(e) => setRtRelease(parseFloat(e.target.value))}
                         className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                       />
                    </div>

                    <div className="col-span-2 pt-4 border-t border-gray-100 flex justify-between items-center">
                       <div>
                         <h4 className="text-xs font-bold text-gray-900">Continuous Rapid Trigger</h4>
                         <p className="text-[10px] text-gray-500">RT terminates only when button is fully released</p>
                       </div>
                       <Toggle checked={continuousRT} onChange={setContinuousRT} size="sm" />
                    </div>
                 </motion.div>
               )}
            </section>

            <div className="h-px bg-gray-200"></div>

            {/* Dead Zones */}
            <section className="space-y-6">
               <div>
                 <h3 className="text-sm font-bold text-gray-900">Dead Zone Configuration</h3>
                 <p className="text-xs text-gray-500">Limit active range to prevent accidental triggers</p>
               </div>
               
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <div className="flex justify-between text-xs font-bold">
                        <span>Top Dead Zone</span>
                        <span>{deadZoneTop} mm</span>
                     </div>
                     <input 
                       type="range" 
                       min="0" 
                       max="1.0" 
                       step="0.05"
                       value={deadZoneTop}
                       onChange={(e) => setDeadZoneTop(parseFloat(e.target.value))}
                       className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                     />
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between text-xs font-bold">
                        <span>Bottom Dead Zone</span>
                        <span>{deadZoneBottom} mm</span>
                     </div>
                     <input 
                       type="range" 
                       min="0" 
                       max="1.0" 
                       step="0.05"
                       value={deadZoneBottom}
                       onChange={(e) => setDeadZoneBottom(parseFloat(e.target.value))}
                       className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                     />
                  </div>
               </div>
            </section>

         </div>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange, size = 'md' }: { checked: boolean, onChange: (v: boolean) => void, size?: 'sm' | 'md' }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={cn(
      "rounded-full relative cursor-pointer transition-colors duration-300",
      checked ? "bg-[#00E6CC]" : "bg-gray-200",
      size === 'md' ? "w-12 h-6" : "w-8 h-4"
    )}
  >
    <motion.div 
      layout
      className={cn(
        "bg-white rounded-full absolute shadow-sm",
        size === 'md' ? "w-4 h-4 top-1" : "w-3 h-3 top-0.5"
      )}
      animate={{ left: checked ? (size === 'md' ? 26 : 18) : (size === 'md' ? 4 : 2) }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </div>
);
