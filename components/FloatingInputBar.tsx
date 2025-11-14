import React, { useRef } from 'react';
import { PaperClipIcon, ChatBubbleLeftRightIcon } from './Icon';

interface FloatingInputBarProps {
    onFileUpload: (file: File) => void;
    onToggleChat: () => void;
    isProcessing: boolean;
}

export const FloatingInputBar: React.FC<FloatingInputBarProps> = ({ onFileUpload, onToggleChat, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };
    
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div 
         style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
         className="animate-floatIn fixed bottom-6 right-6 z-30"
        >
            <div className="flex flex-col sm:flex-row items-center gap-3">
                 <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                />
                 <button
                    onClick={onToggleChat}
                    disabled={isProcessing}
                    className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110"
                    aria-label="Chat with agent"
                >
                    <ChatBubbleLeftRightIcon className="w-7 h-7" />
                </button>
                <button
                    onClick={triggerFileSelect}
                    disabled={isProcessing}
                    className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 text-gray-800 shadow-lg hover:bg-white disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110"
                    aria-label="Upload image or video"
                >
                    <PaperClipIcon className="w-7 h-7" />
                </button>
            </div>
        </div>
    );
};