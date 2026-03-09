import React from 'react';
import { Key } from './Key';
import { KeymapConfig, DeviceState } from '../types';
import { getKeyLabel } from '../utils/keycodes';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../lib/utils';

interface KeyboardVisualizerProps {
  config: KeymapConfig;
  activeLayer?: number;
  onKeyClick?: (rowIndex: number, colIndex: number) => void;
  deviceState?: DeviceState;
  pressedKeys?: Set<string>;
  keymapOverrides?: Record<string, string>;
  highlightedKeys?: Set<string>;
  osMode?: 'Mac' | 'Win';
}

interface DroppableKeyProps {
  id: string;
  children: React.ReactNode;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const DroppableKey: React.FC<DroppableKeyProps> = ({ id, children, onClick, isHighlighted }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type: 'target', id }
  });

  return (
    <div 
      ref={setNodeRef} 
      onClick={onClick}
      className={cn(
        "relative rounded-[6px] transition-all",
        isOver && "ring-2 ring-blue-500 z-20 scale-105",
        isHighlighted && "ring-2 ring-green-500 z-20"
      )}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-blue-500/20 rounded-[6px] pointer-events-none" />
      )}
    </div>
  );
};

export const KeyboardVisualizer: React.FC<KeyboardVisualizerProps> = ({ 
  config, 
  activeLayer = 0, 
  onKeyClick, 
  deviceState, 
  pressedKeys, 
  keymapOverrides, 
  highlightedKeys,
  osMode = 'Mac'
}) => {
  
  // Helper to determine key variant based on label and position
  const getKeyVariant = (label: string, row: number, col: number): 'default' | 'dark' | 'green' | 'orange' | 'yellow' => {
    // In the screenshot, most keys are white. 
    // The "highlight" comes from the RGB effect, not the keycap color itself usually.
    // But for the visualizer, let's keep it clean white for now unless specific accents are needed.
    return 'default';
  };

  const renderLayout = () => {
    return config.layouts.keymap.map((row, rowIndex) => {
      const keys = [];
      let currentProps = { w: 1, h: 1, x: 0, y: 0 };
      
      for (let i = 0; i < row.length; i++) {
        const item = row[i];
        
        if (typeof item === 'object') {
          currentProps = { ...currentProps, ...item };
        } else if (typeof item === 'string') {
          const isModifier = currentProps.w > 1 || rowIndex === 0;
          
          let label = item;
          const [rStr, cStr] = item.split(',');
          const r = parseInt(rStr, 10);
          const c = parseInt(cStr, 10);

          // 1. Get Label from Device State or Fallback Map
          const overrideKey = `${activeLayer},${r},${c}`;
          if (keymapOverrides && keymapOverrides[overrideKey]) {
            label = keymapOverrides[overrideKey];
          } else if (deviceState?.keymap && deviceState.keymap[activeLayer] && deviceState.keymap[activeLayer][r] && deviceState.keymap[activeLayer][r][c] !== undefined) {
             const keycode = deviceState.keymap[activeLayer][r][c];
             label = getKeyLabel(keycode);
          } else {
              // Fallback Mapping
              const matrixMap: Record<string, string> = {
                 // Row 0
                 "0,0": "ESC", "0,1": "F1", "0,2": "F2", "0,3": "F3", "0,4": "F4", "0,5": "F5", "0,6": "F6", "0,7": "F7", "0,8": "F8", "0,9": "F9", "0,10": "F10", "0,11": "F11", "0,12": "F12", 
                 "2,14": "PRTSC", "0,15": "INS", "0,14": "DEL",
                 // Row 1
                 "1,0": "`", "1,1": "1", "1,2": "2", "1,3": "3", "1,4": "4", "1,5": "5", "1,6": "6", "1,7": "7", "1,8": "8", "1,9": "9", "1,10": "0", "1,11": "-", "1,12": "=", "1,13": "BACK", "1,16": "HOME",
                 // Row 2
                 "2,0": "TAB", "2,1": "Q", "2,2": "W", "2,3": "E", "2,4": "R", "2,5": "T", "2,6": "Y", "2,7": "U", "2,8": "I", "2,9": "O", "2,10": "P", "2,11": "[", "2,12": "]", "2,13": "\\", "2,16": "PGUP",
                 // Row 3
                 "3,0": "CAPS", "3,1": "A", "3,2": "S", "3,3": "D", "3,4": "F", "3,5": "G", "3,6": "H", "3,7": "J", "3,8": "K", "3,9": "L", "3,10": ";", "3,11": "'", "3,13": "ENTER", "1,15": "PGDN",
                 // Row 4
                 "4,0": "SHIFT", "4,2": "Z", "4,3": "X", "4,4": "C", "4,5": "V", "4,6": "B", "4,7": "N", "4,8": "M", "4,9": ",", "4,10": ".", "4,11": "/", "4,13": "SHIFT", "4,14": "UP", "2,15": "END",
                 // Row 5
                 "5,0": "CTRL", "5,1": "OPT", "5,2": "CMD", "5,6": "SPACE", "5,9": "CMD", "5,10": "FN", "3,14": "CTRL", "5,13": "LEFT", "5,14": "DOWN", "5,15": "RIGHT"
              };
              
              if (matrixMap[item]) label = matrixMap[item];
          }

          // Apply OS Mode Overrides
          if (osMode === 'Win') {
            if (label === 'CMD') label = 'WIN';
            if (label === 'OPT') label = 'ALT';
          } else {
            if (label === 'WIN') label = 'CMD';
            if (label === 'ALT') label = 'OPT';
          }

          const isPressed = pressedKeys?.has(label);
          const variant = getKeyVariant(label, rowIndex, i);
          const keyId = `key-${r}-${c}`; 
          const isHighlighted = highlightedKeys?.has(`${activeLayer},${r},${c}`);

          keys.push(
            <DroppableKey 
              key={keyId} 
              id={`${r},${c}`} 
              onClick={() => onKeyClick?.(rowIndex, i)}
              isHighlighted={isHighlighted}
            >
              <Key
                label={label} 
                width={currentProps.w}
                height={currentProps.h}
                variant={variant}
                isPressed={isPressed}
              />
            </DroppableKey>
          );
          
          currentProps = { ...currentProps, w: 1, h: 1 };
        }
      }
      
      return (
        <div key={rowIndex} className="flex gap-1 mb-1 justify-center">
          {keys}
        </div>
      );
    });
  };

  return (
    <div className="relative w-full max-w-full p-3 sm:p-4 md:p-6 bg-white rounded-[24px] shadow-sm border border-gray-200">
       {/* Main Case Frame - Cleaner Look */}
       <div className="p-2 bg-[#F5F5F5] rounded-[16px] border border-gray-100 shadow-inner overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-fit mx-auto [--key-gap:4px] [--key-unit:34px] sm:[--key-unit:42px] xl:[--key-unit:54px]">
             {renderLayout()}
          </div>
       </div>
       
       {/* Status Light Area - Simplified */}
       <div className="absolute top-4 sm:top-6 right-6 sm:right-12 w-12 sm:w-16 h-1 bg-gray-200 rounded-full"></div>
    </div>
  );
};
