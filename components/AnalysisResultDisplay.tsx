import React, { useEffect } from 'react';
import type { AnalysisResult } from '../types';
import { MapPinIcon, CheckCircleIcon, BrainCircuitIcon, XCircleIcon, LinkIcon, GlobeIcon } from './Icon';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; className?: string }> = ({ icon, label, value, className = '' }) => (
    <div className={`bg-black/20 backdrop-blur-md p-4 rounded-xl flex items-center space-x-4 border border-white/10 ${className}`}>
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
    }, []);

  if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
        <XCircleIcon className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-bold">Invalid Analysis Data</h3>
        <p className="mt-2 text-red-200">The location data received was incomplete. Please try again.</p>
      </div>
    );
  }

  const position: [number, number] = [result.latitude, result.longitude];

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
        <div className="p-6">
             <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                Analysis Complete
            </h2>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 h-80 lg:h-auto w-full z-0">
                    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <Marker position={position}>
                            <Popup>
                                {result.locationName}
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard icon={<MapPinIcon className="w-8 h-8"/>} label="Location" value={result.locationName || 'Unknown'} />
                        <StatCard icon={<CheckCircleIcon className="w-8 h-8"/>} label="Confidence" value={`${result.confidence || 0}%`} />
                    </div>
                     <StatCard icon={<MapPinIcon className="w-8 h-8"/>} label="Coordinates" value={`${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`} />

                    <div className="bg-black/20 p-5 rounded-xl border border-white/10 mt-2">
                        <div className="flex items-center text-gray-300 mb-3">
                            <BrainCircuitIcon className="w-6 h-6 mr-3 text-cyan-400"/>
                            <h3 className="text-xl font-semibold">Agent's Reasoning</h3>
                        </div>
                        <p className="text-gray-300 leading-relaxed font-light whitespace-pre-wrap">{result.reasoning || 'No reasoning provided.'}</p>
                    </div>

                    {result.grounding && result.grounding.length > 0 && (
                         <div className="bg-black/20 p-5 rounded-xl border border-white/10">
                            <div className="flex items-center text-gray-300 mb-3">
                                <LinkIcon className="w-6 h-6 mr-3 text-cyan-400"/>
                                <h3 className="text-xl font-semibold">Sources</h3>
                            </div>
                            <ul className="space-y-2">
                                {result.grounding.map((chunk, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="mr-2 mt-1 text-cyan-400">{chunk.type === 'maps' ? <MapPinIcon className="w-4 h-4" /> : <GlobeIcon className="w-4 h-4" />}</span>
                                        <a href={chunk.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline break-all text-sm">
                                            {chunk.title}
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
