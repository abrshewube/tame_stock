import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { storageService, UploadResult } from '../services/localStorageService';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onUploadComplete?: (result: UploadResult) => void;
  currentImageUrl?: string;
  disabled?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUploadComplete,
  currentImageUrl,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    // Validate file
    if (!allowedTypes.includes(file.type)) {
      setError(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    if (file.size > maxSize) {
      setError(`File size must be less than ${formatFileSize(maxSize)}`);
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Upload file
    setIsUploading(true);
    try {
      const result = await storageService.uploadFile(file, {
        maxSize,
        allowedTypes,
        folder: 'products'
      });

      if (result.success) {
        onFileSelect(file);
        onUploadComplete?.(result);
        setError(null);
      } else {
        setError(result.error || 'Upload failed');
        setPreviewUrl(null);
        onFileSelect(null);
      }
    } catch (err) {
      setError('Upload failed');
      setPreviewUrl(null);
      onFileSelect(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Product Image
      </label>
      
      {previewUrl ? (
        <div className="relative">
          <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={previewUrl}
              alt="Product preview"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={removeImage}
            disabled={disabled || isUploading}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center
            transition-colors cursor-pointer
            ${disabled || isUploading 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <ImageIcon className="h-3 w-3" />
        <span>Images are stored locally for development</span>
      </div>
    </div>
  );
};

export default FileUpload;
