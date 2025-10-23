
import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult, GroundingChunk, ChatHistoryItem } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeImageLocation = async (imageFile: File): Promise<AnalysisResult> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY environment variable not set");

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const imagePart = await fileToGenerativePart(imageFile);

    const prompt = `You are Geo-Agent, an expert in geographic localization from images. Analyze the provided image and determine its location. Use the available tools (Google Search, Google Maps) to get up-to-date information if necessary. Provide your in a structured JSON format inside a JSON markdown block. The JSON object must have the following keys: 'locationName' (e.g., 'Eiffel Tower, Paris, France'), 'latitude' (a number), 'longitude' (a number), 'reasoning' (a detailed explanation of how you identified the location, citing visual clues from the image and information from your tools), and 'confidence' (a score from 0 to 100 representing your certainty).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            tools: [{ googleSearch: {} }, { googleMaps: {} }],
        }
    });

    const groundingChunks: GroundingChunk[] = [];
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    for (const chunk of rawChunks) {
        if (chunk.web) {
            groundingChunks.push({ type: 'web', uri: chunk.web.uri, title: chunk.web.title || 'Web Search Result' });
        } else if (chunk.maps) {
            groundingChunks.push({ type: 'maps', uri: chunk.maps.uri, title: chunk.maps.title || 'Google Maps Result' });
        }
    }

    try {
        let resultText = response.text.trim();
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = resultText.match(jsonRegex);
        if (match && match[1]) {
            resultText = match[1];
        }
        
        const parsedResult: AnalysisResult = JSON.parse(resultText);
        parsedResult.grounding = groundingChunks;
        return parsedResult;
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("The AI returned an invalid response format. Please try again.");
    }
};

export const sendMessageToChatbot = async (message: string, history: ChatHistoryItem[]): Promise<string> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY environment variable not set");

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
    });
    
    // Pass the message as a `Part` array to ensure consistent request formatting.
    const response = await chat.sendMessage([{ text: message }]);
    return response.text;
};
