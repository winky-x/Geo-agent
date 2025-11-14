import React from 'react';

interface MediaPreviewProps {
  mediaUrl: string | null;
  isVideo: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ mediaUrl, isVideo }) => {
  if (!mediaUrl) {
    return null;
  }
  
  return (
    <div className="p-2 border border-gray-700/80 rounded-2xl bg-gray-900/50 backdrop-blur-lg">
      {isVideo ? (
        <video 
          src={mediaUrl} 
          controls 
          className="w-full h-auto object-cover rounded-xl shadow-lg max-h-96"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <img 
          src={mediaUrl} 
          alt="Uploaded preview" 
          className="w-full h-auto object-cover rounded-xl shadow-lg max-h-96" 
        />
      )}
    </div>
  );
};