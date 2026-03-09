import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  Menu, 
  Monitor, 
  Layers, 
  FileText, 
  Globe, 
  Settings, 
  MessageCircle, 
  Download, 
  History, 
  ChevronLeft, 
  ChevronRight,
  Keyboard,
  Zap,
  LayoutTemplate
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  deviceName: string;
}

export const Sidebar = ({ isOpen, onToggle, onOpenSettings, deviceName }: SidebarProps) => {
  const [activeMode, setActiveMode] = useState('Office');

  const sidebarVariants = {
    open: { width: 280 },
    closed: { width: 80 }
  };

  return (
    <motion.div 
      initial={isOpen ? "open" : "closed"}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="h-full max-w-[85vw] bg-white border-r border-gray-200 flex flex-col relative z-30 shadow-xl"
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold italic text-xs">IO</span>
          </div>
          <motion.span 
            animate={{ opacity: isOpen ? 1 : 0, display: isOpen ? "block" : "none" }}
            className="font-bold text-lg tracking-tight whitespace-nowrap"
          >
            NuPhy IO
          </motion.span>
        </div>
      </div>

      {/* Zoom Button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-40"
      >
        {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        
        {/* Devices Displaying */}
        <div className="space-y-3">
          <div className={cn("text-xs font-bold text-gray-400 uppercase tracking-wider px-2", !isOpen && "text-center")}>
            {isOpen ? "Device" : "Dev"}
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Keyboard className="w-5 h-5 text-gray-600" />
            </div>
            {isOpen && (
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-gray-900 truncate">{deviceName || "NuPhy Keyboard"}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-gray-500">Connected</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Onboard Mode */}
        <div className="space-y-3">
          <div className={cn("text-xs font-bold text-gray-400 uppercase tracking-wider px-2", !isOpen && "text-center")}>
            {isOpen ? "Onboard Mode" : "Mode"}
          </div>
          
          <div className="space-y-2">
            {['Office', 'Gaming', 'Mac', 'Win'].map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group relative",
                  activeMode === mode ? "bg-black text-white shadow-md" : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                  activeMode === mode ? "bg-white/20" : "bg-gray-100 group-hover:bg-white"
                )}>
                  <Layers className="w-4 h-4" />
                </div>
                {isOpen && (
                  <>
                    <span className="text-sm font-medium flex-1">{mode}</span>
                    {activeMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Unapplied Onboard Mode (Recommended) */}
        <div className="space-y-3">
          <div className={cn("text-xs font-bold text-gray-400 uppercase tracking-wider px-2", !isOpen && "text-center")}>
            {isOpen ? "Recommended" : "Rec"}
          </div>
          <div className="space-y-2">
             {['FPS Optimization', 'MOBA Pro'].map((mode) => (
               <div key={mode} className="group relative">
                 <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-left transition-all opacity-60 hover:opacity-100">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <LayoutTemplate className="w-4 h-4" />
                    </div>
                    {isOpen && <span className="text-sm font-medium">{mode}</span>}
                 </button>
                 {isOpen && (
                   <button className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity">
                     Apply
                   </button>
                 )}
               </div>
             ))}
          </div>
        </div>

      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-1">
        <SidebarItem icon={<FileText />} label="IO Manual" isOpen={isOpen} />
        <SidebarItem icon={<Globe />} label="Language" isOpen={isOpen} />
        <SidebarItem icon={<Settings />} label="Setting" isOpen={isOpen} onClick={onOpenSettings} />
        <SidebarItem icon={<MessageCircle />} label="Contact Us" isOpen={isOpen} />
        <SidebarItem icon={<Download />} label="Client Download" isOpen={isOpen} />
        
        <div className={cn("mt-4 pt-4 border-t border-gray-200", !isOpen && "flex flex-col items-center")}>
           {isOpen ? (
             <div className="flex justify-between items-center">
               <div>
                 <p className="text-[10px] font-bold text-gray-900">NuPhy IO v2.1.0</p>
                 <button className="text-[10px] text-gray-500 hover:underline flex items-center gap-1">
                   <History className="w-3 h-3" /> Update History
                 </button>
               </div>
             </div>
           ) : (
             <div className="w-2 h-2 rounded-full bg-gray-300" title="v2.1.0"></div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

const SidebarItem = ({ icon, label, isOpen, onClick }: { icon: React.ReactNode, label: string, isOpen: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all",
      !isOpen && "justify-center"
    )}
    title={!isOpen ? label : undefined}
  >
    <div className="w-5 h-5 flex-shrink-0">
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
    </div>
    {isOpen && <span className="text-xs font-bold">{label}</span>}
  </button>
);
