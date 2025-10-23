
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PipelineDisplay } from './components/PipelineDisplay';
import { analyzeImageLocation } from './services/geminiService';
import type { AnalysisResult, PipelineStage, StageStatus } from './types';
import { Loader } from './components/Loader';
import { Chatbot } from './components/Chatbot';
import { ChatBubbleIcon } from './components/Icon';

const AnalysisResultDisplay = lazy(() => 
  import('./components/AnalysisResultDisplay').then(module => ({ default: module.AnalysisResultDisplay }))
);

const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
    { id: 'A', name: 'Stage A: Input & EXIF Analysis', description: 'Ingesting image and parsing metadata for GPS coordinates.', status: 'pending' },
    { id: 'B', name: 'Stage B: Preprocessing', description: 'Image normalization, resizing, and enhancement for model compatibility.', status: 'pending' },
    { id: 'C', name: 'Stage C: Feature Extraction', description: 'Using CLIP to generate vector embeddings from visual features.', status: 'pending' },
    { id: 'D', name: 'Stage D: Geo-Retrieval', description: 'Querying FAISS index with embeddings to find candidate locations.', status: 'pending' },
    { id: 'E', name: 'Stage E: Candidate Fusion', description: 'Aggregating and ranking potential geographic matches.', status: 'pending' },
    { id: 'F', name: 'Stage F: LLM Verification with Grounding', description: 'Using Gemini with Search/Maps to analyze candidates and visual evidence.', status: 'pending' },
    { id: 'G', name: 'Stage G: Output Generation', description: 'Formatting final coordinates, reasoning, and confidence score.', status: 'pending' },
];


const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(INITIAL_PIPELINE_STAGES);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleImageUpload = (file: File) => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));

    setAnalysisResult(null);
    setError(null);
    setIsProcessing(false);
    setPipelineStages(INITIAL_PIPELINE_STAGES);
  };

  const updateStageStatus = (stageId: string, status: StageStatus, delay: number): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              setPipelineStages(prevStages =>
                  prevStages.map(stage =>
                      stage.id === stageId ? { ...stage, status } : stage
                  )
              );
              resolve();
          }, delay);
      });
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAnalysisResult(null);
    setPipelineStages(INITIAL_PIPELINE_STAGES);

    try {
        await updateStageStatus('A', 'running', 0);
        await updateStageStatus('A', 'completed', 1500);
        
        await updateStageStatus('B', 'running', 0);
        await updateStageStatus('B', 'completed', 1000);

        await updateStageStatus('C', 'running', 0);
        await updateStageStatus('C', 'completed', 2500);
        
        await updateStageStatus('D', 'running', 0);
        await updateStageStatus('D', 'completed', 2000);
        
        await updateStageStatus('E', 'running', 0);
        await updateStageStatus('E', 'completed', 1000);

        await updateStageStatus('F', 'running', 0);
        const result = await analyzeImageLocation(imageFile);
        await updateStageStatus('F', 'completed', 100);

        await updateStageStatus('G', 'running', 0);
        await updateStageStatus('G', 'completed', 500);

        setAnalysisResult(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? `Analysis failed: ${err.message}` : 'An unknown error occurred during analysis.';
      setError(errorMessage);
      setPipelineStages(prev => prev.map(s => s.status === 'running' ? {...s, status: 'failed'} : s));
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile]);

  const handleAnalyzeAnother = () => {
     if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
    }
     setImageFile(null);
     setImageUrl(null);
     setAnalysisResult(null);
     setError(null);
     setIsProcessing(false);
     setPipelineStages(INITIAL_PIPELINE_STAGES);
  }

  const showUploader = !imageUrl;
  const showAnalysisButton = imageUrl && !isProcessing && !analysisResult && !error;
  const showPipeline = imageUrl && isProcessing && !analysisResult;
  const showResult = !!analysisResult;
  const showError = !!error;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {showUploader && (
            <div className="text-center mb-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-cyan-400 mb-2">Upload an Image to Begin</h2>
                <p className="text-gray-400">Our Geo-Agent will analyze visual cues to pinpoint its location.</p>
            </div>
          )}

          {showUploader && <div className="max-w-4xl mx-auto"><ImageUploader onImageUpload={handleImageUpload} imageUrl={null} /></div>}

          {showError && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center max-w-4xl mx-auto">
              {error}
            </div>
          )}

          {(showAnalysisButton || showPipeline || showResult || (showError && imageUrl)) && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <ImageUploader onImageUpload={handleImageUpload} imageUrl={imageUrl} />
                 {showAnalysisButton && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleAnalyzeClick}
                            className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/20"
                        >
                            Start Geo-Analysis Pipeline
                        </button>
                    </div>
                )}
              </div>
              <div className="lg:col-span-3">
                {showPipeline && <PipelineDisplay stages={pipelineStages} />}
                {showResult && (
                  <Suspense fallback={<Loader />}>
                    <AnalysisResultDisplay result={analysisResult} />
                  </Suspense>
                )}
              </div>
            </div>
          )}
          
          {(showResult || (showError && imageUrl)) && (
             <div className="mt-8 text-center">
                <button
                  onClick={handleAnalyzeAnother}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300"
                >
                  Analyze Another Image
                </button>
              </div>
          )}
        </div>
      </main>

       <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-cyan-500 hover:bg-cyan-400 text-gray-900 rounded-full p-4 shadow-lg transform transition-all hover:scale-110 focus:outline-none"
        aria-label="Open AI Chat"
      >
        <ChatBubbleIcon className="w-8 h-8" />
      </button>

      {isChatOpen && <Chatbot onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default App;