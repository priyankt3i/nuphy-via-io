import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Zap, Activity, Battery, Keyboard, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [autoSelectAll, setAutoSelectAll] = useState(true);
  const [autoSleep, setAutoSleep] = useState(true);
  const [sleepDuration, setSleepDuration] = useState(6);
  const [returnRate, setReturnRate] = useState(1000);
  const [onboardLight, setOnboardLight] = useState(true);
  const [capsLight, setCapsLight] = useState(true);
  const [sleepLight, setSleepLight] = useState(true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-[calc(100vw-1rem)] max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gray-50 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                <SettingsIcon className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Keyboard Settings</h2>
                <p className="hidden sm:block text-xs text-gray-500">Global configuration for all Onboard Modes</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-4 sm:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            
            {/* General Settings */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Keyboard className="w-3 h-3" /> General
              </h3>
              
              <SettingItem 
                label="Auto Select All"
                description="Automatically select all keys when switches are identical type"
                control={
                  <Toggle checked={autoSelectAll} onChange={setAutoSelectAll} />
                }
              />

              <SettingItem 
                label="Auto Sleep"
                description="Turn off lights and enter sleep mode after inactivity"
                control={
                  <div className="flex items-center gap-4">
                    <select 
                      disabled={!autoSleep}
                      value={sleepDuration}
                      onChange={(e) => setSleepDuration(Number(e.target.value))}
                      className="text-xs font-bold bg-gray-100 border-none rounded-lg px-3 py-1.5 disabled:opacity-50"
                    >
                      <option value={3}>3 min</option>
                      <option value={6}>6 min</option>
                      <option value={10}>10 min</option>
                      <option value={30}>30 min</option>
                    </select>
                    <Toggle checked={autoSleep} onChange={setAutoSleep} />
                  </div>
                }
              />

              <SettingItem 
                label="Receiver Return Rate"
                description="Higher rate means faster transmission speed (1000Hz = 1ms)"
                control={
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg flex-wrap">
                    {[125, 500, 1000].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setReturnRate(rate)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-bold transition-all",
                          returnRate === rate 
                            ? "bg-white text-black shadow-sm" 
                            : "text-gray-500 hover:text-gray-900"
                        )}
                      >
                        {rate}Hz
                      </button>
                    ))}
                  </div>
                }
              />
            </section>

            {/* Indicator Lights */}
            <section className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Indicator Lights
              </h3>

              <SettingItem 
                label="Onboard Mode Indicator"
                description="Lighting prompts when switching modes"
                control={<Toggle checked={onboardLight} onChange={setOnboardLight} />}
              />

              <SettingItem 
                label="Caps Lock Indicator"
                description="Lighting prompts when Caps Lock is active"
                control={<Toggle checked={capsLight} onChange={setCapsLight} />}
              />

              <SettingItem 
                label="Sleep Indicator"
                description="Lighting prompts when keyboard sleep is toggled"
                control={<Toggle checked={sleepLight} onChange={setSleepLight} />}
              />
            </section>

          </div>

          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors">
               Cancel
             </button>
             <button onClick={onClose} className="px-6 py-2 rounded-lg bg-black text-white text-sm font-bold shadow-lg hover:bg-gray-800 transition-transform active:scale-95">
               Save Changes
             </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SettingItem = ({ label, description, control }: { label: string, description: string, control: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 gap-3">
    <div>
      <h4 className="text-sm font-bold text-gray-900">{label}</h4>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <div className="self-start sm:self-auto">{control}</div>
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

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
