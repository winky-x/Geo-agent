import React, { useEffect } from 'react';
import { GlobeIcon } from './Icon';

export const Loader: React.FC = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
        }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center my-12">
        <div className="relative">
            <GlobeIcon className="w-16 h-16 text-cyan-500 animate-spin-slow" />
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-ping"></div>
        </div>
      <p className="mt-4 text-lg text-gray-300">Agent is analyzing the image...</p>
      <p className="text-sm text-gray-500">This may take a moment.</p>
    </div>
  );
};
