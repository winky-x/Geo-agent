import React from 'react';
import type { PipelineStage, StageStatus } from '../types';
import { CheckCircleIcon, CircleIcon, SpinnerIcon, XCircleIcon } from './Icon';

const StatusIcon: React.FC<{ status: StageStatus }> = ({ status }) => {
    switch (status) {
        case 'pending':
            return <CircleIcon className="w-6 h-6 text-gray-500" />;
        case 'running':
            return <SpinnerIcon className="w-6 h-6 text-blue-400 animate-spin" />;
        case 'completed':
            return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
        case 'failed':
            return <XCircleIcon className="w-6 h-6 text-red-400" />;
    }
};

const PipelineStageItem: React.FC<{ stage: PipelineStage, isLast: boolean }> = ({ stage, isLast }) => {
    const getStatusTextColor = () => {
        switch(stage.status) {
            case 'running': return 'text-blue-300';
            case 'completed': return 'text-green-300';
            case 'failed': return 'text-red-300';
            default: return 'text-gray-200';
        }
    };

    const getModelName = (name: string): string | null => {
        const match = name.match(/\(([^)]+)\)/);
        return match ? match[1] : null;
    };
    
    const modelName = getModelName(stage.name);

    return (
        <div className="relative flex items-start pl-4 transition-all duration-300">
             {!isLast && <div className="absolute left-7 top-5 -ml-px w-0.5 h-full bg-gray-700/70" />}
            <div className="flex-shrink-0 flex items-center justify-center h-10">
               <div className="z-10 bg-gray-800/50">
                 <StatusIcon status={stage.status} />
               </div>
            </div>
            <div className="ml-4">
                <h4 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${getStatusTextColor()}`}>{stage.name}</h4>
                <p className="mt-1 text-sm text-gray-400">{stage.description}</p>
                {stage.status === 'running' && modelName && (
                    <div className="mt-2 text-xs font-medium text-blue-300 bg-blue-900/50 rounded-full px-2 py-1 inline-block animate-pulse">
                        Querying: {modelName}
                    </div>
                )}
            </div>
        </div>
    );
};


interface PipelineDisplayProps {
    stages: PipelineStage[];
}

export const PipelineDisplay: React.FC<PipelineDisplayProps> = ({ stages }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/80 rounded-2xl p-4 sm:p-6">
            <h3 className="text-xl font-bold text-blue-400 mb-6 text-center">Geo-Forensics In Progress...</h3>
            <div className="space-y-4 sm:space-y-6">
                {stages.map((stage, index) => (
                    <PipelineStageItem key={stage.id} stage={stage} isLast={index === stages.length - 1} />
                ))}
            </div>
        </div>
    );
};