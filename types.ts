

export interface GroundingChunk {
  type: 'web' | 'maps';
  uri: string;
  title: string;
}

export interface AnalysisResult {
  locationName: string;
  latitude: number;
  longitude: number;
  reasoning: string;
  confidence: number;
  grounding?: GroundingChunk[];
}

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: StageStatus;
}

export type ChatMessage = {
  role: 'user' | 'model' | 'error';
  text: string;
};

export type ChatHistoryItem = {
  role: 'user' | 'model';
  parts: [{ text: string }];
};