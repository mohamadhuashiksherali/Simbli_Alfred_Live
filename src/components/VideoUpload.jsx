import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Video, Sparkles, Play } from 'lucide-react';

const VideoUpload = ({ onVideoUpload, className = '' }) => {
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedVideo(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      if (onVideoUpload) {
        onVideoUpload(file);
      }
    }
  }, [onVideoUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv']
    },
    multiple: false,
    maxSize: 15 * 1024 * 1024 // 15MB
  });

  const removeVideo = () => {
    setUploadedVideo(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  return (
    <div className={className}>
      {!uploadedVideo ? (
        <div
          {...getRootProps()}
          className={`group relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 shadow-lg'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-4 w-8 h-8 bg-blue-400 rounded-full"></div>
            <div className="absolute top-12 right-6 w-6 h-6 bg-blue-500 rounded-full"></div>
            <div className="absolute bottom-8 left-8 w-4 h-4 bg-blue-600 rounded-full"></div>
          </div>

          {/* Icon and Text */}
          <div className="relative z-10">
            <div className={`w-16 h-16 mx-auto mb-4 transition-all duration-300 ${
              isDragActive ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              {isDragActive ? (
                <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
              )}
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 transition-colors ${
              isDragActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
            }`}>
              {isDragActive ? 'Drop your video here!' : 'Upload a Video'}
            </h3>
            
            <p className={`text-sm mb-3 transition-colors ${
              isDragActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
            }`}>
              {isDragActive
                ? 'Release to upload your video'
                : 'Drag & drop a video here, or click to browse'}
            </p>
            
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <Video className="w-3 h-3 mr-1" />
                MP4, MOV, AVI
              </span>
              <span>•</span>
              <span>Max 15MB</span>
            </div>

            {/* Upload Button */}
            <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Upload className="w-4 h-4 inline mr-2" />
              Choose File
            </button>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ) : (
        <div className="relative group">
          {/* Video Preview */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 shadow-lg">
            <video
              src={previewUrl}
              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
              controls
              preload="metadata"
            />
            
            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Remove Button */}
            <button
              onClick={removeVideo}
              className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Video Info */}
            <div className="absolute bottom-3 left-3 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span className="font-medium">{uploadedVideo.name}</span>
              </div>
              <div className="text-xs opacity-80">
                {(uploadedVideo.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>

          {/* Success Indicator */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;


