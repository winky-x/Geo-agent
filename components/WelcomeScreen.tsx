import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './Icon';

interface WelcomeScreenProps {
  onFileUpload: (file: File) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>, enter: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(enter);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-fadeInUp">
      <div className="max-w-2xl">
        <h2 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
          Upload Media to Begin
        </h2>
        <p className="text-lg text-gray-400 mb-8">
          Our Geo-Agent will perform a forensic analysis of your image or video to pinpoint its location.
        </p>

        <div
          onClick={triggerFileSelect}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDragOver={(e) => handleDrag(e, true)}
          onDrop={handleDrop}
          className={`
            w-full max-w-lg mx-auto h-64 flex flex-col items-center justify-center 
            border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer 
            bg-gray-900/40 backdrop-blur-sm transition-all duration-300
            ${isDragging ? 'border-blue-500 bg-blue-900/30 scale-105' : 'hover:border-gray-500 hover:bg-black/20'}
          `}
        >
          <UploadIcon className={`w-12 h-12 text-gray-500 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
          <p className="mt-4 text-lg font-semibold text-gray-300">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-gray-500">Image or Video File</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
      </div>
    </main>
  );
};