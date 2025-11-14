import React, { useEffect, useState } from 'react';
import type { AnalysisResult } from '../types';
import { MapPinIcon, CheckCircleIcon, BrainCircuitIcon, XCircleIcon, LinkIcon, GlobeIcon } from './Icon';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; className?: string }> = ({ icon, label, value, className = '' }) => (
    <div className={`bg-gray-800/50 backdrop-blur-md p-4 rounded-2xl flex items-center space-x-4 border border-gray-700/80 ${className}`}>
        <div className="text-blue-400">{icon}</div>
        <div>
            <p className="text-sm text-blue-200/70">{label}</p>
            <p className="text-lg font-semibold text-gray-100">{value}</p>
        </div>
    </div>
);


const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onClick: () => void }> = ({ title, children, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-700/50">
            <h2>
                <button
                    type="button"
                    className="flex items-center justify-between w-full p-4 font-medium text-left text-gray-300 hover:bg-gray-800/50 transition-colors"
                    onClick={onClick}
                    aria-expanded={isOpen}
                >
                    <span>{title}</span>
                    <svg
                        className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                    >
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                    </svg>
                </button>
            </h2>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} grid`}>
              <div className="overflow-hidden">
                <div className="p-4 border-t border-gray-700/50">
                     <div className="text-gray-400 leading-relaxed font-light whitespace-pre-wrap text-sm sm:text-base">{children}</div>
                </div>
              </div>
            </div>
        </div>
    );
};


const ChainOfThoughtAccordion: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const finalReasoning = { model: 'Final Synthesis (GPT-OSS)', reasoning: result.reasoning };
    const allSteps = result.intermediateSteps ? [...result.intermediateSteps, finalReasoning] : [finalReasoning];
    const [openIndex, setOpenIndex] = useState<number | null>(allSteps.length -1);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    
    if (!result.intermediateSteps || result.intermediateSteps.length === 0) {
        return (
            <div className="bg-black/20 p-4 rounded-xl border border-gray-700/50 mt-2">
                <div className="flex items-center text-gray-200 mb-3">
                    <BrainCircuitIcon className="w-6 h-6 mr-3 text-blue-400"/>
                    <h3 className="text-xl font-semibold">Agent's Reasoning</h3>
                </div>
                <p className="text-gray-300 leading-relaxed font-light whitespace-pre-wrap text-sm sm:text-base">{result.reasoning || 'No reasoning provided.'}</p>
            </div>
        )
    }

    return (
        <div className="bg-black/20 rounded-xl border border-gray-700/50 mt-2">
            <div className="p-4 flex items-center text-gray-200">
                <BrainCircuitIcon className="w-6 h-6 mr-3 text-blue-400"/>
                <h3 className="text-xl font-semibold">Chain of Thought</h3>
            </div>
            <div className="rounded-b-xl overflow-hidden">
                {allSteps.map((step, index) => (
                    <AccordionItem
                        key={index}
                        title={step.model}
                        isOpen={openIndex === index}
                        onClick={() => handleClick(index)}
                    >
                        {step.reasoning}
                    </AccordionItem>
                ))}
            </div>
        </div>
    );
};


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
      <div className="bg-red-900/50 border border-red-500/50 text-red-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
        <XCircleIcon className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-bold">Invalid Analysis Data</h3>
        <p className="mt-2 text-red-300">The location data received was incomplete. Please try again.</p>
      </div>
    );
  }

  const position: [number, number] = [result.latitude, result.longitude];

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-6">
             <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Analysis Complete
            </h2>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 h-64 sm:h-80 lg:h-auto w-full z-0">
                    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
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

                    <ChainOfThoughtAccordion result={result} />

                    {result.grounding && result.grounding.length > 0 && (
                         <div className="bg-black/20 p-4 rounded-xl border border-gray-700/50">
                            <div className="flex items-center text-gray-200 mb-3">
                                <LinkIcon className="w-6 h-6 mr-3 text-blue-400"/>
                                <h3 className="text-xl font-semibold">Sources</h3>
                            </div>
                            <ul className="space-y-2">
                                {result.grounding.map((chunk, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="mr-2 mt-1 text-blue-400">{chunk.type === 'maps' ? <MapPinIcon className="w-4 h-4" /> : <GlobeIcon className="w-4 h-4" />}</span>
                                        <a href={chunk.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline break-all text-sm">
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