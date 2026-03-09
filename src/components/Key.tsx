import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface KeyProps {
  label: string;
  subLabel?: string;
  width?: number;
  height?: number;
  isActive?: boolean;
  isPressed?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'dark' | 'green' | 'orange' | 'yellow';
}

export const Key: React.FC<KeyProps> = ({
  label,
  subLabel,
  width = 1,
  height = 1,
  isActive,
  isPressed,
  onClick,
  variant = 'default'
}) => {
  // Base unit size in pixels
  const u = 54;
  const gap = 4;

  const style = {
    width: `${width * u + (width - 1) * gap}px`,
    height: `${height * u + (height - 1) * gap}px`,
  };

  // The screenshot shows keys are mostly white with a colored border (likely RGB effect).
  // The actual keycap color seems to be white for all keys.
  // We will simulate the "RGB Wave" effect by using a gradient border or background.
  // For now, let's make them clean white with a subtle border, and use the variant for the "RGB" color hint if needed.
  
  return (
    <motion.button
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={style}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[8px] transition-all duration-100 select-none",
        "bg-white border border-gray-300 shadow-[0_2px_0_rgba(0,0,0,0.05)]", // Base white key style
        
        // Text Style
        "text-gray-700 font-bold text-[10px] tracking-wider",

        // Active/Selected State
        isActive && "ring-2 ring-blue-400 z-10",

        // Pressed State
        isPressed && "translate-y-[1px] shadow-none bg-gray-50",
        
        "active:translate-y-[1px] active:shadow-none"
      )}
    >
      <span className="z-10">{label}</span>
      {subLabel && <span className="text-[8px] text-gray-400 absolute bottom-1 z-10">{subLabel}</span>}
      
      {/* RGB Effect Simulation (Gradient Border/Glow) */}
      {/* In the screenshot, there is a rainbow gradient across the keyboard. 
          We can simulate this by adding a colored overlay or border based on position, 
          but since we don't have position passed to Key, we'll keep it simple for now. 
          Or we can rely on the parent to pass a color. 
          
          Let's add a subtle inner glow to mimic the backlight.
      */}
      <div className="absolute inset-0 rounded-[8px] bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none"></div>
    </motion.button>
  );
};
