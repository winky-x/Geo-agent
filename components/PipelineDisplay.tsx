
import React from 'react';
import type { PipelineStage, StageStatus } from '../types';
import { CheckCircleIcon, CircleIcon, SpinnerIcon, XCircleIcon } from './Icon';

const StatusIcon: React.FC<{ status: StageStatus }> = ({ status }) => {
    switch (status) {
        case 'pending':
            return <CircleIcon className="w-6 h-6 text-gray-500" />;
        case 'running':
            return <SpinnerIcon className="w-6 h-6 text-cyan-400 animate-spin" />;
        case 'completed':
            return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
        case 'failed':
            return <XCircleIcon className="w-6 h-6 text-red-400" />;
    }
};

const PipelineStageItem: React.FC<{ stage: PipelineStage, isLast: boolean }> = ({ stage, isLast }) => {
    const getStatusTextColor = () => {
        switch(stage.status) {
            case 'running': return 'text-cyan-300';
            case 'completed': return 'text-green-300';
            case 'failed': return 'text-red-300';
            default: return 'text-white';
        }
    };

    return (
        <div className="relative flex items-start">
             {!isLast && <div className="absolute left-3 top-5 w-0.5 h-full bg-gray-700" />}
            <div className="flex-shrink-0 flex items-center justify-center h-10">
               <div className="z-10 bg-gray-900">
                 <StatusIcon status={stage.status} />
               </div>
            </div>
            <div className="ml-4">
                <h4 className={`text-lg font-semibold ${getStatusTextColor()}`}>{stage.name}</h4>
                <p className="mt-1 text-sm text-gray-400">{stage.description}</p>
            </div>
        </div>
    );
};


interface PipelineDisplayProps {
    stages: PipelineStage[];
}

export const PipelineDisplay: React.FC<PipelineDisplayProps> = ({ stages }) => {
    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 h-full">
            <h3 className="text-xl font-bold text-cyan-400 mb-6">Geo-Analysis Pipeline Status</h3>
            <div className="space-y-6">
                {stages.map((stage, index) => (
                    <PipelineStageItem key={stage.id} stage={stage} isLast={index === stages.length - 1} />
                ))}
            </div>
        </div>
    );
};
