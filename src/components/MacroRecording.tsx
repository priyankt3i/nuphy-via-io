import React from 'react';
import { PlayCircle, Plus, Trash2, Save, Clock, Repeat } from 'lucide-react';

export const MacroRecording = () => {
  return (
    <div className="flex h-full w-full bg-gray-50 flex-col xl:flex-row">
      {/* Left Panel: Macro List */}
      <div className="w-full xl:w-64 border-b xl:border-b-0 xl:border-r border-gray-200 bg-white p-4 flex flex-col max-h-[280px] xl:max-h-none">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Macros (0/32)</h3>
          <button className="p-1 hover:bg-gray-100 rounded text-gray-500">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-500">M{i}</div>
                <span className="text-sm font-medium text-gray-700">Macro {i}</span>
              </div>
              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Editor */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[280px]">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
          <PlayCircle className="w-8 h-8 text-gray-300" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">No Macro Selected</h3>
          <p className="text-sm text-gray-500 mt-1">Select or create a macro to start recording</p>
        </div>
        <button className="px-6 py-2 bg-black text-white text-sm font-bold rounded-full shadow-lg hover:bg-gray-800 transition-transform active:scale-95">
          Create New Macro
        </button>
      </div>
      
      {/* Right Panel: Settings */}
      <div className="w-full xl:w-72 border-t xl:border-t-0 xl:border-l border-gray-200 bg-white p-4 sm:p-6 space-y-8">
         <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3 h-3" /> Recording Settings
            </h3>
            
            <div className="space-y-2">
               <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                 <input type="radio" name="interval" defaultChecked className="accent-black" />
                 Real Interval
               </label>
               <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                 <input type="radio" name="interval" className="accent-black" />
                 Fixed Interval (10ms)
               </label>
               <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                 <input type="radio" name="interval" className="accent-black" />
                 No Interval
               </label>
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Repeat className="w-3 h-3" /> Loop Mode
            </h3>
            
            <div className="space-y-2">
               <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                 <input type="radio" name="loop" defaultChecked className="accent-black" />
                 Play Once
               </label>
               <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                 <input type="radio" name="loop" className="accent-black" />
                 Loop while pressed
               </label>
               <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                 <input type="radio" name="loop" className="accent-black" />
                 Toggle Loop
               </label>
            </div>
         </div>
      </div>
    </div>
  );
};
