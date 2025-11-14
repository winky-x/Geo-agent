import React, { useState, useCallback, lazy, Suspense, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { MediaPreview } from './components/MediaPreview';
import { PipelineDisplay } from './components/PipelineDisplay';
import { analyzeMediaLocation } from './services/analysisService';
import type { AnalysisResult, PipelineStage } from './types';
import { Loader } from './components/Loader';
import { FloatingInputBar } from './components/FloatingInputBar';
import { GlobeIcon } from './components/Icon';
import { WelcomeScreen } from './components/WelcomeScreen';


const AnalysisResultDisplay = lazy(() => 
  import('./components/AnalysisResultDisplay').then(module => ({ default: module.AnalysisResultDisplay }))
);

const Chatbot = lazy(() => import('./components/Chatbot').then(module => ({ default: module.Chatbot })));

type Message = {
  id: number;
  role: 'system' | 'media' | 'pipeline' | 'result' | 'error';
  content: string | React.ReactNode;
};

const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
    { id: 'A', name: 'Stage A: Media Ingestion & Forensics', description: 'Extracting key frames and preparing media for analysis.', status: 'pending' },
    { id: 'B', name: 'Stage B: Scene & Object Recognition (Gemini)', description: 'Identifying landmarks, text, and environmental clues.', status: 'pending' },
    { id: 'C', name: 'Stage C: Hypothesis Generation (Gemini)', description: 'Generating potential locations based on recognized objects.', status: 'pending' },
    { id: 'D', name: 'Stage D: Visual Verification (Nemotron-VL)', description: 'Cross-examining location hypotheses against visual evidence.', status: 'pending' },
    { id: 'E', name: 'Stage E: Multi-Hypothesis Synthesis (GPT-OSS)', description: 'Synthesizing all data to determine the most probable location.', status: 'pending' },
    { id: 'F', name: 'Stage F: Geographic & Web Grounding (Google)', description: 'Validating the final location against real-world map and web data.', status: 'pending' },
    { id: 'G', name: 'Stage G: Dossier Compilation', description: 'Formatting the complete forensic analysis for final report.', status: 'pending' },
];


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  
  const nextId = useRef(0);
  const getUniqueId = () => nextId.current++;

  const scrollToBottom = () => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [messages]);

  const addMessage = useCallback((role: Message['role'], content: Message['content']) => {
    setMessages(prev => [...prev, { id: getUniqueId(), role, content }]);
  }, []);

  const handleFileUpload = async (file: File) => {
    if (isProcessing) return;
    const mediaUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    
    const mediaMessage: Message = { id: getUniqueId(), role: 'media', content: <MediaPreview mediaUrl={mediaUrl} isVideo={isVideo} /> };
    
    let pipelineStages = [...INITIAL_PIPELINE_STAGES].map(stage => ({ ...stage, status: 'pending' as const }));
    const pipelineMessage: Message = { id: getUniqueId(), role: 'pipeline', content: <PipelineDisplay stages={pipelineStages} /> };
    const pipelineMessageId = pipelineMessage.id;

    setMessages([mediaMessage, pipelineMessage]);
    setIsProcessing(true);

    const onProgress = (updatedStages: PipelineStage[]) => {
        setMessages(prev => prev.map(msg => 
            msg.id === pipelineMessageId ? { ...msg, content: <PipelineDisplay stages={updatedStages} /> } : msg
        ));
    };

    try {
      const result = await analyzeMediaLocation(file, onProgress, pipelineStages);
      
      setMessages(prev => prev.map(msg => msg.id === pipelineMessageId ? {
        id: pipelineMessageId,
        role: 'result',
        content: <Suspense fallback={<Loader />}><AnalysisResultDisplay result={result} /></Suspense>
      } : msg));

      URL.revokeObjectURL(mediaUrl);

    } catch (err) {
      const errorMessage = err instanceof Error ? `Analysis failed: ${err.message}` : 'An unknown error occurred during analysis.';
      addMessage('error', errorMessage);
      console.error(err);
      setMessages(prev => prev.filter(msg => msg.id !== pipelineMessageId));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-transparent text-gray-200">
      <Header />
      {messages.length === 0 ? (
        <WelcomeScreen onFileUpload={handleFileUpload} />
      ) : (
        <main ref={messageListRef} className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar pb-32">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => {
               const isSpecialCard = msg.role === 'media' || msg.role === 'pipeline' || msg.role === 'result' || msg.role === 'error';

              return (
                <div key={msg.id} className="flex items-start gap-3 w-full justify-start animate-fadeInUp">
                  {msg.role === 'system' && (
                     <div className="w-8 h-8 rounded-full bg-blue-900/40 flex-shrink-0 flex items-center justify-center border border-blue-500/30">
                      <GlobeIcon className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                  
                  <div className={`
                      w-full
                      ${!isSpecialCard ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700/80 text-gray-200 rounded-2xl p-4 whitespace-pre-wrap max-w-[calc(100%-44px)]' : ''}
                      ${msg.role === 'error' ? 'bg-red-900/50 backdrop-blur-lg border border-red-500/50 text-red-200 rounded-2xl p-4' : ''}
                    `}>
                    {msg.content}
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      )}
      {isChatOpen && (
        <Suspense fallback={<div />}>
          <Chatbot onClose={() => setIsChatOpen(false)} />
        </Suspense>
      )}
      <FloatingInputBar 
        onFileUpload={handleFileUpload} 
        onToggleChat={() => setIsChatOpen(true)}
        isProcessing={isProcessing} 
      />
    </div>
  );
};

export default App;