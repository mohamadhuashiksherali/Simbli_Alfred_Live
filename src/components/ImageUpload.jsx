import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Sparkles, Camera } from 'lucide-react';

const ImageUpload = ({ onImageUpload, className = '' }) => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      if (onImageUpload) {
        onImageUpload(file);
      }
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 3 * 1024 * 1024 // 3MB
  });

  const removeImage = () => {
    setUploadedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  return (
    <div className={className}>
      {!uploadedImage ? (
        <div
          {...getRootProps()}
          className={`group relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
            isDragActive
              ? 'border-green-500 bg-green-50 shadow-lg'
              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
          }`}
        >
          <input {...getInputProps()} />
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-4 w-8 h-8 bg-green-400 rounded-full"></div>
            <div className="absolute top-12 right-6 w-6 h-6 bg-green-500 rounded-full"></div>
            <div className="absolute bottom-8 left-8 w-4 h-4 bg-green-600 rounded-full"></div>
          </div>

          {/* Icon and Text */}
          <div className="relative z-10">
            <div className={`w-16 h-16 mx-auto mb-4 transition-all duration-300 ${
              isDragActive ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              {isDragActive ? (
                <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
              )}
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 transition-colors ${
              isDragActive ? 'text-green-700' : 'text-gray-700 group-hover:text-gray-900'
            }`}>
              {isDragActive ? 'Drop your image here!' : 'Upload an Image'}
            </h3>
            
            <p className={`text-sm mb-3 transition-colors ${
              isDragActive ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-600'
            }`}>
              {isDragActive
                ? 'Release to upload your image'
                : 'Drag & drop an image here, or click to browse'}
            </p>
            
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <ImageIcon className="w-3 h-3 mr-1" />
                JPG, PNG, GIF
              </span>
              <span>•</span>
              <span>Max 3MB</span>
            </div>

            {/* Upload Button */}
            <button className="mt-4 px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Upload className="w-4 h-4 inline mr-2" />
              Choose File
            </button>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-green-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ) : (
        <div className="relative group">
          {/* Image Preview */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-green-200 shadow-lg">
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Remove Button */}
            <button
              onClick={removeImage}
              className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Image Info */}
            <div className="absolute bottom-3 left-3 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span className="font-medium">{uploadedImage.name}</span>
              </div>
              <div className="text-xs opacity-80">
                {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>

          {/* Success Indicator */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
