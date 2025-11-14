import React from 'react';
import { GlobeIcon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-700/80 sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GlobeIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">
            Geo-Agent
          </h1>
        </div>
        <p className="text-sm text-gray-400 hidden sm:block">Geolocation Forensics powered by Gemini</p>
      </div>
    </header>
  );
};