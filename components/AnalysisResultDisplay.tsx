import React, { useEffect } from 'react';
import type { AnalysisResult } from '../types';
// FIX: Import GlobeIcon to resolve 'Cannot find name' error.
import { MapPinIcon, CheckCircleIcon, BrainCircuitIcon, XCircleIcon, LinkIcon, GlobeIcon } from './Icon';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex items-center space-x-4">
        <div className="text-cyan-400">{icon}</div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-lg font-semibold text-white">{value}</p>
        </div>
    </div>
);


export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const style = document.createElement('style');
        style.innerHTML = `
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
        `;
        document.head.appendChild(style);
        
        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

  if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl p-6 flex flex-col items-center justify-center text-center h-full">
        <XCircleIcon className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-bold">Invalid Analysis Data</h3>
        <p className="mt-2 text-red-200">The location data received from the AI was incomplete or malformed. Please try analyzing another image.</p>
      </div>
    );
  }

  const position: [number, number] = [result.latitude, result.longitude];

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-6">
             <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">Analysis Complete</h2>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 h-80 lg:h-full w-full z-0">
                    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position}>
                            <Popup>
                                {result.locationName}
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <StatCard icon={<MapPinIcon className="w-8 h-8"/>} label="Location" value={result.locationName || 'Unknown'} />
                    <StatCard icon={<CheckCircleIcon className="w-8 h-8"/>} label="Confidence" value={`${result.confidence || 0}%`} />
                    <StatCard icon={<MapPinIcon className="w-8 h-8"/>} label="Coordinates" value={`${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`} />

                    <div className="bg-gray-900/70 p-6 rounded-lg mt-2">
                        <div className="flex items-center text-gray-300 mb-3">
                            <BrainCircuitIcon className="w-6 h-6 mr-3 text-cyan-400"/>
                            <h3 className="text-xl font-semibold">Agent's Reasoning</h3>
                        </div>
                        <p className="text-gray-300 leading-relaxed font-light whitespace-pre-wrap">{result.reasoning || 'No reasoning provided.'}</p>
                    </div>

                    {result.grounding && result.grounding.length > 0 && (
                         <div className="bg-gray-900/70 p-6 rounded-lg">
                            <div className="flex items-center text-gray-300 mb-3">
                                <LinkIcon className="w-6 h-6 mr-3 text-cyan-400"/>
                                <h3 className="text-xl font-semibold">Sources</h3>
                            </div>
                            <ul className="space-y-2">
                                {result.grounding.map((chunk, index) => (
                                    <li key={index}>
                                        <a href={chunk.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline break-all text-sm flex items-start">
                                            <span className="mr-2 mt-1">{chunk.type === 'maps' ? <MapPinIcon className="w-4 h-4" /> : <GlobeIcon className="w-4 h-4" />}</span>
                                            <span className="truncate">{chunk.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
             </div>
        </div>
    </div>
  );
};