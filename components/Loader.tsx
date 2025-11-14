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
    <div className="flex flex-col items-center justify-center text-center my-12 h-full">
        <div className="relative w-24 h-24">
             <GlobeIcon className="absolute inset-0 m-auto w-10 h-10 text-cyan-400 animate-pulse" style={{ animationDuration: '1.5s' }}/>
             <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-spin-slow"></div>
             <div className="absolute inset-2 border-t-2 border-fuchsia-500/50 rounded-full animate-spin-reverse-slow"></div>
             <div className="absolute inset-0 rounded-full animate-ping border border-cyan-500/50"></div>
        </div>
      <p className="mt-6 text-lg text-gray-300">Agent is analyzing the media...</p>
      <p className="text-sm text-gray-500">This may take a moment.</p>
    </div>
  );
};