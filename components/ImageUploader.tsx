
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };
  
  const handleDragEvent = (e: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvent(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       if (e.dataTransfer.files[0].type.startsWith('image/')) {
        onImageUpload(e.dataTransfer.files[0]);
       }
    }
  }, [onImageUpload]);

  if (imageUrl) {
    return (
      <div className="mt-4 p-4 border border-white/10 rounded-2xl bg-black/20 backdrop-blur-lg">
        <h3 className="text-lg font-semibold text-center text-gray-300 mb-4">Uploaded Image</h3>
        <img src={imageUrl} alt="Uploaded preview" className="max-h-96 w-auto mx-auto rounded-lg shadow-lg" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <label
        htmlFor="image-upload"
        onDragEnter={e => handleDragEvent(e, true)}
        onDragLeave={e => handleDragEvent(e, false)}
        onDragOver={e => handleDragEvent(e, true)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
          ${isDragging ? 'border-cyan-400 bg-cyan-400/10 shadow-inner shadow-cyan-500/20' : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadIcon className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDragging ? 'text-cyan-400' : 'text-gray-400'}`} />
          <p className={`mb-2 text-lg transition-colors duration-300 ${isDragging ? 'text-white' : 'text-gray-300'}`}>
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-gray-500">PNG, JPG, GIF or WEBP</p>
        </div>
        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </label>
    </div>
  );
};
