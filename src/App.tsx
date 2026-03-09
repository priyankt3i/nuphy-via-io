import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';
import { Keyboard, Zap, Settings, FileText, Battery, RefreshCw, Monitor, Moon, Sun, Globe, X, PlayCircle, RotateCcw, Laptop, Beaker, Save, Target } from 'lucide-react';
import { useKeyboard } from './hooks/useKeyboard';
import { KeyboardVisualizer } from './components/KeyboardVisualizer';
import { KeycodePicker } from './components/KeycodePicker';
import { LightingEffects } from './components/LightingEffects';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { TriggerSettings } from './components/TriggerSettings';
import { ModeSettings } from './components/ModeSettings';
import { AdvancedFunctions } from './components/AdvancedFunctions';
import { MacroRecording } from './components/MacroRecording';
import { mapEventCodeToLabel } from './utils/keycodes';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, DragEndEvent, DragStartEvent } from '@dnd-kit/core';

export default function App() {
  const { deviceState, requestDevice, enableDemoMode, refreshState, loading, config, lighting, setKeycode } = useKeyboard();
  const [activeLayer, setActiveLayer] = useState(0);
  const [activeTab, setActiveTab] = useState<'Trigger Settings' | 'Key Bindings' | 'Advanced Functions' | 'Lighting Effects' | 'Macro Recording' | 'Switch Selection' | 'Mode Settings'>('Lighting Effects');
  const [selectedKey, setSelectedKey] = useState<{row: number, col: number, label: string} | null>(null);
  const [showKeyTest, setShowKeyTest] = useState(false);
  const [osMode, setOsMode] = useState<'Mac' | 'Win'>('Mac');
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [testHistory, setTestHistory] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [keymapOverrides, setKeymapOverrides] = useState<Record<string, string>>({});
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // active.id is "source-KEYCODE"
    setActiveDragId(active.data.current?.keycode as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.data.current?.type === 'source' && over.data.current?.type === 'target') {
      const keycodeStr = active.data.current.keycode as string;
      const targetId = over.id as string; // "row,col"
      const [rowStr, colStr] = targetId.split(',');
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);

      console.log(`Dropped ${keycodeStr} onto ${row},${col}`);
      
      // Update overrides locally for immediate UI feedback
      const overrideKey = `${activeLayer},${row},${col}`;
      setKeymapOverrides(prev => ({
        ...prev,
        [overrideKey]: keycodeStr
      }));

      // Highlight the changed key
      setHighlightedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(overrideKey);
        return newSet;
      });

      // Update selected key info
      setSelectedKey({ row, col, label: `Key ${row},${col} -> ${keycodeStr}` });
      
      // Send to keyboard via VIA protocol
      // We need to convert the string keycode (e.g. "KC_PRTSC") to its numeric value
      // For now, we'll try to parse it if it's hex, or use a mapping
      // A full implementation would need a complete mapping of VIA keycode strings to numbers
      let numericKeycode = 0;
      
      // Basic mapping for common keys to test
      const basicKeycodeMap: Record<string, number> = {
        'PRTSC': 0x0046,
        'DEL': 0x004C,
        'INS': 0x0049,
        'HOME': 0x004A,
        'END': 0x004D,
        'PGUP': 0x004B,
        'PGDN': 0x004E,
      };

      if (keycodeStr.startsWith('0x')) {
        numericKeycode = parseInt(keycodeStr, 16);
      } else if (basicKeycodeMap[keycodeStr]) {
        numericKeycode = basicKeycodeMap[keycodeStr];
      } else {
        console.warn(`Could not resolve numeric keycode for ${keycodeStr}`);
        // Fallback: try to find it in the QMK basic keycodes or just use 0
      }

      if (numericKeycode > 0 && deviceState.isConnected) {
        try {
          await setKeycode(activeLayer, row, col, numericKeycode);
          console.log(`Successfully set keycode ${numericKeycode} at layer ${activeLayer}, row ${row}, col ${col}`);
        } catch (e) {
          console.error("Failed to set keycode", e);
        }
      }
    }
  };

  const handleKeyClick = (row: number, col: number) => {
    setSelectedKey({ row, col, label: `Key ${row},${col}` });
  };

  const handleKeycodeSelect = (keycode: string) => {
    if (selectedKey) {
      console.log(`Assigned ${keycode} to ${selectedKey.row},${selectedKey.col}`);
    }
  };

  const toggleOsMode = () => {
    const newMode = osMode === 'Mac' ? 'Win' : 'Mac';
    setOsMode(newMode);
    // Typically Mac is Layer 0, Win is Layer 2 on NuPhy keyboards
    setActiveLayer(newMode === 'Mac' ? 0 : 2);
  };

  const [isTestActive, setIsTestActive] = useState(false);

  // Key Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const label = mapEventCodeToLabel(e.code, osMode);
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(label);
        return newSet;
      });
      
      if (showKeyTest && isTestActive) {
        setTestHistory(prev => [...prev, label].slice(-20)); // Keep last 20
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const label = mapEventCodeToLabel(e.code, osMode);
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(label);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [osMode, showKeyTest, isTestActive]);

  // Landing Page
  if (!deviceState.isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
          <h1 className="text-xl font-bold italic tracking-tighter">NuPhyIO</h1>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
             <button className="flex items-center gap-1 hover:text-black"><Globe className="w-4 h-4" /> English</button>
             <button className="flex items-center gap-1 hover:text-black"><Sun className="w-4 h-4" /> Theme</button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-12 max-w-4xl w-full"
        >
          {/* USB Cable Animation */}
          <div className="relative h-32 w-full flex justify-center items-end">
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
               className="flex flex-col items-center"
             >
               <div className="w-1 h-32 bg-gray-100 absolute bottom-12"></div>
               <div className="w-8 h-12 bg-white border border-gray-200 rounded-md z-10 relative flex items-center justify-center shadow-sm">
                 <div className="w-full h-2 bg-[#00E6CC] absolute top-0 rounded-t-md"></div>
               </div>
               <div className="w-4 h-4 bg-gray-200 rounded-b-sm mt-0.5"></div>
             </motion.div>
          </div>

          {/* Keyboard Placeholder / Wireframe */}
          <div className="w-[800px] h-[300px] border-2 border-gray-100 rounded-[24px] flex items-center justify-center bg-gray-50/50">
             <div className="grid grid-cols-15 gap-2 opacity-10">
                {/* Abstract grid to simulate keyboard */}
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 border border-gray-400 rounded-md"></div>
                ))}
             </div>
          </div>

          <div className="text-center space-y-6">
            <p className="text-gray-400 text-sm">
              Plug in the keyboard before granting the driver its access below
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={requestDevice}
                disabled={loading}
                className="px-8 py-3 bg-[#1A1A1A] text-white font-bold rounded-full hover:bg-black transition-transform active:scale-95 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Access Authorization'}
              </button>
              <button
                onClick={enableDemoMode}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Try Demo Mode
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Interface
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="flex h-screen bg-[#F2F2F2] text-[#333333] overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        deviceName={deviceState.name}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header / Upper Sidebar */}
        <header className="h-16 flex items-center justify-between px-8 bg-transparent z-20 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-bold text-gray-700">Office Mode</span>
              <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Save className="w-3 h-3" /> Saved
              </span>
            </div>
            
            <div className="h-4 w-px bg-gray-300"></div>

            <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors">
              <Target className="w-3 h-3" /> Recalibrate
            </button>
            
            <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors">
              <Beaker className="w-3 h-3" /> Feature Lab
            </button>
          </div>

          <div className="flex items-center gap-4">
             {/* Refresh Button */}
             <button 
               onClick={refreshState}
               disabled={loading}
               className={cn(
                 "p-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-all",
                 loading && "animate-spin text-blue-500"
               )}
               title="Refresh Device State"
             >
               <RefreshCw className="w-4 h-4" />
             </button>

             {/* OS Toggle */}
             <button 
               onClick={toggleOsMode}
               className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
             >
               <span className={cn(
                 "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors",
                 osMode === 'Mac' ? "bg-black text-white" : "bg-blue-600 text-white"
               )}>
                 {osMode === 'Mac' ? 'M1' : 'W'}
               </span>
               <span className="text-xs font-bold text-gray-700">{osMode}</span>
             </button>
             
             <button 
               onClick={() => setShowKeyTest(!showKeyTest)}
               className={cn(
                 "flex items-center gap-2 px-4 py-1.5 rounded-full shadow-sm border transition-all text-xs font-bold",
                 showKeyTest 
                   ? "bg-black text-white border-black" 
                   : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
               )}
             >
               <Keyboard className="w-4 h-4" />
               Key Test
             </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-start pt-2 pb-8 px-8 gap-6 overflow-hidden z-10">
          
          {/* Keyboard Visualizer Area */}
          <div className="relative flex-shrink-0 z-10">
            <KeyboardVisualizer 
              config={config} 
              onKeyClick={handleKeyClick} 
              activeLayer={activeLayer} 
              deviceState={deviceState}
              pressedKeys={pressedKeys}
              keymapOverrides={keymapOverrides}
              highlightedKeys={highlightedKeys}
              osMode={osMode}
            />
            
            {/* Floating Layer Controls */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-sm border border-gray-200 p-1 flex items-center gap-1">
               <button className="px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-100 flex items-center gap-1">
                 <RotateCcw className="w-3 h-3" /> Reset
               </button>
               <div className="w-px h-4 bg-gray-200 mx-1"></div>
               {Array.from({ length: deviceState.layerCount || 4 }).map((_, layer) => (
                 <button
                   key={layer}
                   onClick={() => setActiveLayer(layer)}
                   className={cn(
                     "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                     activeLayer === layer
                       ? "bg-[#333] text-white"
                       : "text-gray-500 hover:bg-gray-100"
                   )}
                 >
                   FN {layer}
                 </button>
               ))}
            </div>
          </div>

          {/* Bottom Configuration Panel */}
          <div className="w-full max-w-[1400px] flex-1 bg-white rounded-[24px] shadow-xl border border-gray-200 overflow-hidden flex flex-col mt-8">
             {/* Tabs */}
             <div className="flex items-center px-8 pt-6 gap-8 border-b border-gray-100 bg-[#FAFAFA]">
                {['Trigger Settings', 'Key Bindings', 'Advanced Functions', 'Lighting Effects', 'Macro Recording', 'Switch Selection', 'Mode Settings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "pb-4 text-sm font-bold transition-all relative",
                      activeTab === tab
                        ? "text-black"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-black rounded-t-full" />
                    )}
                  </button>
                ))}
             </div>

             {/* Content */}
             <div className="flex-1 p-0 bg-white overflow-hidden">
                {activeTab === 'Key Bindings' && (
                  <div className="flex h-full">
                    <div className="flex-1 border-r border-gray-100">
                      <KeycodePicker onSelect={handleKeycodeSelect} />
                    </div>
                    
                    {/* Commonly Used Section (Right Side) */}
                    <div className="w-[400px] p-6 bg-[#FAFAFA] overflow-y-auto">
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Commonly Used</h3>
                       <div className="grid grid-cols-4 gap-2">
                          {['INS', 'SCR', 'PAUSE', 'MENU', 'CALC', 'MAIL', 'HOME', 'END', 'PGUP', 'PGDN', 'PRTSC', 'DEL'].map(key => (
                            <button key={key} className="h-10 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-600 hover:border-gray-400 hover:shadow-sm transition-all">
                              {key}
                            </button>
                          ))}
                       </div>
                       
                       <div className="mt-8">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Selected Key Info</h3>
                          {selectedKey ? (
                             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-lg font-bold">{selectedKey.label.split(' ')[1] || '?'}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">{selectedKey.label}</p>
                                    <p className="text-xs text-gray-400">Row {selectedKey.row}, Col {selectedKey.col}</p>
                                  </div>
                                </div>
                             </div>
                          ) : (
                            <div className="text-center text-gray-400 text-xs py-4">
                              Select a key to view details
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Trigger Settings' && (
                  <TriggerSettings />
                )}

                {activeTab === 'Lighting Effects' && (
                   <LightingEffects lighting={lighting} deviceState={deviceState} />
                )}
                
                {activeTab === 'Advanced Functions' && (
                  <AdvancedFunctions />
                )}
                
                {activeTab === 'Macro Recording' && (
                  <MacroRecording />
                )}
                
                {activeTab === 'Mode Settings' && (
                  <ModeSettings />
                )}
             </div>
          </div>
        </main>

        {/* Key Test Side Panel */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: showKeyTest ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-4 right-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#FAFAFA]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">IO</div>
              <div>
                <h3 className="text-sm font-bold">Key Test</h3>
                <p className="text-[10px] text-gray-400">Test the keyboard keys</p>
              </div>
            </div>
            <button onClick={() => setShowKeyTest(false)} className="p-1 hover:bg-gray-200 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="p-4 space-y-6 flex-1 overflow-y-auto">
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <h4 className="text-xs font-bold text-gray-500">Clear Records</h4>
                 <button onClick={() => setTestHistory([])} className="px-3 py-1 bg-[#333] text-white text-[10px] font-bold rounded-full">Clear</button>
               </div>
               <p className="text-[10px] text-gray-400">Clear all test history</p>
             </div>

             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <h4 className="text-xs font-bold text-gray-500">Start The Test</h4>
                 <div 
                   onClick={() => setIsTestActive(!isTestActive)}
                   className={cn(
                     "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                     isTestActive ? "bg-green-500" : "bg-gray-200"
                   )}
                 >
                   <motion.div 
                     animate={{ x: isTestActive ? 20 : 2 }}
                     className="w-3 h-3 bg-white rounded-full absolute top-1 shadow-sm"
                   />
                 </div>
               </div>
               <p className="text-[10px] text-gray-400">Turn on the switch to start testing</p>
             </div>
             
             <div className="pt-4 border-t border-gray-100">
               <h4 className="text-xs font-bold text-gray-500 mb-2">Test History</h4>
               {testHistory.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {testHistory.map((key, i) => (
                     <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{key}</span>
                   ))}
                 </div>
               ) : (
                 <div className="h-32 flex items-center justify-center text-gray-300 text-xs italic">
                   No keys pressed yet
                 </div>
               )}
             </div>
          </div>
        </motion.div>
      </div>

      <DragOverlay>
        {activeDragId ? (
          <div className="h-10 min-w-[40px] px-3 rounded-lg border border-blue-500 bg-blue-50 shadow-xl text-xs font-bold text-gray-700 flex items-center justify-center cursor-grabbing">
            {activeDragId}
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
}
