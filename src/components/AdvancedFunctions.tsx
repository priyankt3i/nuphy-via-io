import React from 'react';
import { Zap, Layers, Command, ArrowRightLeft, MousePointer2 } from 'lucide-react';

export const AdvancedFunctions = () => {
  return (
    <div className="flex h-full w-full bg-gray-50 p-8 overflow-y-auto items-center justify-center">
      <div className="grid grid-cols-3 gap-6 max-w-5xl w-full">
        <FeatureCard 
          icon={<Zap className="w-6 h-6 text-yellow-500" />}
          title="Dynamic Keystroke (DKS)"
          description="Bind up to 4 functions to a single key based on press depth."
        />
        <FeatureCard 
          icon={<Layers className="w-6 h-6 text-blue-500" />}
          title="Mod Tap (MT)"
          description="Hold for one function, tap for another."
        />
        <FeatureCard 
          icon={<Command className="w-6 h-6 text-purple-500" />}
          title="Toggle Key (TGL)"
          description="Click to toggle continuous triggering."
        />
        <FeatureCard 
          icon={<ArrowRightLeft className="w-6 h-6 text-green-500" />}
          title="Rapid Shift (RS)"
          description="Prioritize keys based on press depth when two are held."
        />
        <FeatureCard 
          icon={<MousePointer2 className="w-6 h-6 text-red-500" />}
          title="SOCD"
          description="Simultaneous Opposing Cardinal Directions priority settings."
        />
        <FeatureCard 
          icon={<Zap className="w-6 h-6 text-orange-500" />}
          title="Hyper Tap (HT)"
          description="Automatic triggering of alternate keys upon release."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-100 transition-colors">
      {icon}
    </div>
    <h3 className="text-sm font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
  </div>
);
