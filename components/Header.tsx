
import React from 'react';
import { GlobeIcon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GlobeIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Geo-Agent
          </h1>
        </div>
        <p className="text-sm text-gray-400 hidden sm:block">Image Geolocation powered by Gemini</p>
      </div>
    </header>
  );
};
