
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToChatbot } from '../services/geminiService';
import type { ChatMessage, ChatHistoryItem } from '../types';
import { CloseIcon, SendIcon, SpinnerIcon } from './Icon';

interface ChatbotProps {
    onClose: () => void;
}

const initialMessage: ChatMessage = {
    role: 'model',
    text: "Hello! I'm the Geo-Agent assistant. Ask me anything about geolocation, this app, or the world!"
};

export const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
    const [history, setHistory] = useState<ChatHistoryItem[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const modelResponse = await sendMessageToChatbot(input, history);
            setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
            // Update history for next conversation turn
            const newHistory: ChatHistoryItem[] = [
                ...history,
                { role: 'user', parts: [{ text: input }] },
                { role: 'model', parts: [{ text: modelResponse }] }
            ];
            setHistory(newHistory);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage = error instanceof Error ? error.message : "Sorry, something went wrong.";
            setMessages(prev => [...prev, { role: 'error', text: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 sm:bottom-auto sm:top-24 sm:right-6 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[600px] bg-gray-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-cyan-400">Geo-Agent Assistant</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role !== 'user' && <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex-shrink-0"></div>}
                        <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-xl whitespace-pre-wrap ${
                            msg.role === 'model' ? 'bg-gray-800 text-gray-200' :
                            msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-red-900/50 text-red-200'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex-shrink-0"></div>
                        <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-xl bg-gray-800 text-gray-200 flex items-center">
                            <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-full py-2 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || input.trim() === ''}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-500 text-gray-900 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};