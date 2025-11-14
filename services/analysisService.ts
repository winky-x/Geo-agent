import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult, GroundingChunk, ChatHistoryItem, PipelineStage } from '../types';

// --- UTILITY FUNCTIONS ---

const base64FromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const extractFramesFromVideo = (videoFile: File, frameCount: number = 5): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                video.src = e.target.result as string;
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);

        video.onloadeddata = async () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const duration = video.duration;
            const frames: string[] = [];
            
            if (!context || duration === Infinity) {
                return reject(new Error("Could not process video metadata."));
            }
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            for (let i = 0; i < frameCount; i++) {
                const time = (duration / (frameCount + 1)) * (i + 1);
                video.currentTime = time;
                await new Promise(r => video.onseeked = r);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const frameDataUrl = canvas.toDataURL('image/jpeg');
                frames.push(frameDataUrl.split(',')[1]);
            }
            video.src = ''; // Clean up
            resolve(frames);
        };
        video.onerror = (e) => reject(new Error("Failed to load video."));
    });
};

// --- API CALL FUNCTIONS ---

const callOpenRouter = async (model: string, prompt: string, images: { mimeType: string, data: string }[]) => {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY environment variable not set");

    const imageUrls = images.map(img => `data:${img.mimeType};base64,${img.data}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "X-Title": "Geo-Agent Image Localizer",
        },
        body: JSON.stringify({
            "model": model,
            "messages": [{
                "role": "user",
                "content": [
                    { "type": "text", "text": prompt },
                    ...imageUrls.map(url => ({ "type": "image_url", "image_url": { "url": url } }))
                ]
            }],
            "max_tokens": 4096,
            "response_format": { "type": "json_object" }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

const parseJsonFromMarkdown = (text: string): any => {
    const jsonRegex = /(?:```json\s*)?({[\s\S]*})(?:\s*```)?/;
    const match = text.match(jsonRegex);
    if (!match || !match[1]) {
        // If no JSON block is found, try to parse the whole string as JSON
        try {
            return JSON.parse(text);
        } catch (e) {
             throw new Error("No valid JSON object found in the response.");
        }
    }
    return JSON.parse(match[1]);
};

// --- MAIN ANALYSIS ORCHESTRATOR ---

export const analyzeMediaLocation = async (
    mediaFile: File,
    onProgress: (stages: PipelineStage[]) => void,
    initialStages: PipelineStage[]
): Promise<AnalysisResult> => {
    
    let currentStages = [...initialStages];
    const updateStage = (id: string, status: 'running' | 'completed' | 'failed') => {
        currentStages = currentStages.map(s => s.id === id ? { ...s, status } : s);
        onProgress(currentStages);
    };

    // Stage A: Media Ingestion
    updateStage('A', 'running');
    const isVideo = mediaFile.type.startsWith('video/');
    const mediaParts = [];
    if (isVideo) {
        const frames = await extractFramesFromVideo(mediaFile);
        for(const frame of frames) {
            mediaParts.push({ inlineData: { data: frame, mimeType: 'image/jpeg' } });
        }
    } else {
        mediaParts.push({ inlineData: { data: await base64FromFile(mediaFile), mimeType: mediaFile.type } });
    }
    updateStage('A', 'completed');
    
    // Setup Gemini
    const GEMINI_API_KEY = process.env.API_KEY;
    if (!GEMINI_API_KEY) throw new Error("API_KEY environment variable not set");
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Stage B: Scene & Object Recognition
    updateStage('B', 'running');
    const sceneRecPrompt = `Analyze the provided media and identify key visual clues. List objects, landmarks, text (transcribe it), architectural styles, clothing, flora, fauna, and any other distinctive features. Be detailed and thorough. Output your findings as a JSON object with a single key 'observations', which is a rich, descriptive string.`;
    const sceneRecResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: sceneRecPrompt }, ...mediaParts] },
    });
    const sceneRecJson = parseJsonFromMarkdown(sceneRecResponse.text.trim());
    const sceneObservations = sceneRecJson.observations || "No specific observations were made.";
    updateStage('B', 'completed');
    
    // Stage C: Hypothesis Generation
    updateStage('C', 'running');
    const hypothesisPrompt = `Based on the following observations, generate up to 3 potential geographic locations. For each hypothesis, provide a location name, latitude, longitude, and reasoning.
    Observations: ${sceneObservations}
    Output your result in a structured JSON format inside a JSON markdown block. The JSON object must have a key 'hypotheses', which is an array of objects, each with 'locationName', 'latitude', 'longitude', and 'reasoning' keys.`;
    const hypothesisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: hypothesisPrompt }] }, // No media needed here, just text
    });
    const hypothesisJson = parseJsonFromMarkdown(hypothesisResponse.text.trim());
    const hypotheses = hypothesisJson.hypotheses || [];
    updateStage('C', 'completed');

    // Stage D: Visual Verification (Nemotron-VL)
    updateStage('D', 'running');
    const nemotronPrompt = `You are a visual verification agent. Given the following media and a list of location hypotheses, your job is to visually analyze the media and determine which hypothesis is the most plausible. Provide your own independent reasoning for your choice.
    Hypotheses: \n\n${JSON.stringify(hypotheses, null, 2)}\n\n
    Output your findings as a JSON object with a single key: 'reasoning'. This reasoning should clearly state which location you confirm and why, based on visual evidence.`;
    const nemotronResultText = await callOpenRouter('nvidia/nemotron-nano-12b-v2-vl:free', nemotronPrompt, mediaParts.map(p => p.inlineData));
    const nemotronJson = parseJsonFromMarkdown(nemotronResultText);
    const nemotronReasoning = nemotronJson.reasoning || "No reasoning provided by Nemotron.";
    updateStage('D', 'completed');

    // Stage E: Synthesis & Deep Reasoning (GPT-OSS)
    updateStage('E', 'running');
    const synthesisPrompt = `You are a master geo-analyst. Your task is to synthesize all available intelligence to produce a final, definitive conclusion.
    
    Initial Scene Observations:
    ${sceneObservations}
    
    Location Hypotheses Generated:
    ${JSON.stringify(hypotheses, null, 2)}
    
    Visual Verification Report:
    ${JSON.stringify(nemotronJson, null, 2)}

    Based on all this evidence, provide a final, highly accurate determination. Output your result as a single JSON object. This object MUST have: 'locationName', 'latitude', 'longitude', 'reasoning' (your final, synthesized justification), and 'confidence' (a score from 0 to 100).`;
    const finalResultText = await callOpenRouter('openai/gpt-oss-120b', synthesisPrompt, mediaParts.map(p => p.inlineData));
    const finalJson = parseJsonFromMarkdown(finalResultText);
    updateStage('E', 'completed');
    
    // Stage F: Grounding
    updateStage('F', 'running');
    const groundingResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: `Find sources for the location: ${finalJson.locationName}` }] },
        config: {
            tools: [{ googleSearch: {} }, { googleMaps: {} }],
        }
    });
    const groundingChunks: GroundingChunk[] = [];
    const rawChunks = groundingResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    for (const chunk of rawChunks) {
        if (chunk.web) {
            groundingChunks.push({ type: 'web', uri: chunk.web.uri, title: chunk.web.title || 'Web Search Result' });
        } else if (chunk.maps) {
            groundingChunks.push({ type: 'maps', uri: chunk.maps.uri, title: chunk.maps.title || 'Google Maps Result' });
        }
    }
    updateStage('F', 'completed');
    
    // Stage G: Dossier Compilation
    updateStage('G', 'running');
    const finalResult: AnalysisResult = {
        ...finalJson,
        grounding: groundingChunks,
        intermediateSteps: [
            { model: 'Scene Recognition (Gemini)', reasoning: sceneObservations },
            { model: 'Hypothesis Generation (Gemini)', reasoning: JSON.stringify(hypotheses, null, 2) },
            { model: 'Visual Verification (Nemotron-VL)', reasoning: nemotronReasoning },
        ]
    };
    updateStage('G', 'completed');

    return finalResult;
};

// --- CHATBOT FUNCTIONALITY (Unchanged) ---
export const sendMessageToChatbot = async (message: string, history: ChatHistoryItem[]): Promise<string> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY environment variable not set");

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
    });
    
    const response = await chat.sendMessage({ message });
    return response.text;
};