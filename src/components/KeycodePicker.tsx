import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Type, Music, Palette, Command, Box } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

const KEYCODE_CATEGORIES = {
  Basic: {
    icon: <Type className="w-4 h-4" />,
    keys: [
      'ESC', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'PRTSC', 'DEL', 'HOME', 'END', 'PGUP', 'PGDN',
      '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', 'BACKSPACE', 'NUM', '/', '*', '-',
      'TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|', '7', '8', '9',
      'CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', 'ENTER', '4', '5', '6',
      'SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 'SHIFT', 'UP', '1', '2', '3',
      'CTRL', 'CMD', 'OPT', 'SPACE', 'OPT', 'CMD', 'CTRL', 'LEFT', 'DOWN', 'RIGHT', '0', '.'
    ]
  },
  Media: {
    icon: <Music className="w-4 h-4" />,
    keys: ['VOL+', 'VOL-', 'MUTE', 'PLAY', 'NEXT', 'PREV', 'BRI+', 'BRI-', 'CALC', 'MAIL', 'MYPC', 'WWW']
  },
  RGB: {
    icon: <Palette className="w-4 h-4" />,
    keys: ['RGB_TOG', 'RGB_MOD', 'RGB_HUI', 'RGB_HUD', 'RGB_SAI', 'RGB_SAD', 'RGB_VAI', 'RGB_VAD']
  },
  Special: {
    icon: <Box className="w-4 h-4" />,
    keys: ['MO(1)', 'MO(2)', 'MO(3)', 'TG(1)', 'TG(2)', 'TG(3)', 'TO(0)', 'TO(1)', 'RESET', 'DEBUG']
  },
  Macro: {
    icon: <Command className="w-4 h-4" />,
    keys: ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15']
  }
};

interface DraggableKeyProps {
  keycode: string;
  uniqueId: string;
  onSelect: (keycode: string) => void;
}

const DraggableKey: React.FC<DraggableKeyProps> = ({ keycode, uniqueId, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${uniqueId}`,
    data: { keycode, type: 'source' }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(keycode)}
      className={cn(
        "h-10 min-w-[40px] px-3 rounded-lg border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm text-xs font-bold text-gray-700 transition-all flex items-center justify-center active:scale-95 touch-none",
        isDragging && "shadow-xl border-blue-500 bg-blue-50"
      )}
    >
      {keycode}
    </button>
  );
};

interface KeycodePickerProps {
  onSelect: (keycode: string) => void;
}

export const KeycodePicker: React.FC<KeycodePickerProps> = ({ onSelect }) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof KEYCODE_CATEGORIES>('Basic');

  return (
    <div className="flex h-full bg-white rounded-xl overflow-hidden flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="w-full lg:w-48 flex lg:flex-col gap-2 p-3 sm:p-4 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Object.entries(KEYCODE_CATEGORIES).map(([category, data]) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as keyof typeof KEYCODE_CATEGORIES)}
            className={cn(
              "flex shrink-0 items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-lg transition-all",
              activeCategory === category
                ? "bg-[#333] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {data.icon}
            {category}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white">
        <div className="mb-4">
           <h3 className="text-lg font-bold text-gray-900">{activeCategory}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {KEYCODE_CATEGORIES[activeCategory].keys.map((keycode, index) => (
            <DraggableKey
              key={`${keycode}-${index}`}
              uniqueId={`${keycode}-${index}`}
              keycode={keycode}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
