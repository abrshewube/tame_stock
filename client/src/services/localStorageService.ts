// Local Storage Service for Development
// This service handles file uploads locally for development purposes
// Can be easily replaced with Firebase Storage later

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  folder?: string;
}

class LocalStorageService {
  private baseUrl = '/uploads'; // This will serve files from public/uploads
  private maxFileSize = 5 * 1024 * 1024; // 5MB default
  private allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Upload a file to local storage (development only)
   * In production, this would upload to Firebase Storage
   */
  async uploadFile(
    file: File, 
    options: FileUploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, options);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create a unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // Create folder path
      const folder = options.folder || 'products';
      const fullPath = `${folder}/${fileName}`;

      // Convert file to base64 for localStorage
      const base64 = await this.fileToBase64(file);
      
      // Store in localStorage with metadata
      const fileData = {
        name: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        data: base64,
        uploadedAt: new Date().toISOString(),
        path: fullPath
      };

      // Store in localStorage
      const existingFiles = this.getStoredFiles();
      existingFiles[fullPath] = fileData;
      localStorage.setItem('uploadedFiles', JSON.stringify(existingFiles));

      // Return the URL that would be used to access the file
      const url = `${this.baseUrl}/${fullPath}`;
      
      return {
        success: true,
        url,
        fileName: fullPath
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: 'Failed to upload file'
      };
    }
  }

  /**
   * Get file from local storage
   */
  getFile(filePath: string): string | null {
    const storedFiles = this.getStoredFiles();
    const fileData = storedFiles[filePath];
    
    if (fileData && fileData.data) {
      return fileData.data;
    }
    
    return null;
  }

  /**
   * Delete file from local storage
   */
  deleteFile(filePath: string): boolean {
    try {
      const storedFiles = this.getStoredFiles();
      delete storedFiles[filePath];
      localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get all stored files
   */
  getAllFiles(): Record<string, any> {
    return this.getStoredFiles();
  }

  /**
   * Clear all uploaded files (useful for testing)
   */
  clearAllFiles(): void {
    localStorage.removeItem('uploadedFiles');
  }

  /**
   * Export all files as a downloadable JSON (for backup)
   */
  exportFiles(): void {
    const files = this.getStoredFiles();
    const dataStr = JSON.stringify(files, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uploaded-files-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import files from JSON backup
   */
  importFiles(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const files = JSON.parse(e.target?.result as string);
          localStorage.setItem('uploadedFiles', JSON.stringify(files));
          resolve(true);
        } catch (error) {
          console.error('Error importing files:', error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }

  // Private helper methods
  private validateFile(file: File, options: FileUploadOptions): { valid: boolean; error?: string } {
    const maxSize = options.maxSize || this.maxFileSize;
    const allowedTypes = options.allowedTypes || this.allowedTypes;

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${this.formatFileSize(maxSize)}`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private getStoredFiles(): Record<string, any> {
    try {
      const stored = localStorage.getItem('uploadedFiles');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading stored files:', error);
      return {};
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
export const localStorageService = new LocalStorageService();

// Firebase Storage Service (placeholder for future implementation)
export class FirebaseStorageService {
  // This will be implemented when Firebase is set up
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<UploadResult> {
    // TODO: Implement Firebase Storage upload
    console.log('Firebase Storage not implemented yet. Using local storage fallback.');
    return localStorageService.uploadFile(file, options);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    // TODO: Implement Firebase Storage delete
    console.log('Firebase Storage not implemented yet. Using local storage fallback.');
    return localStorageService.deleteFile(filePath);
  }

  getFileUrl(filePath: string): string {
    // TODO: Implement Firebase Storage URL generation
    console.log('Firebase Storage not implemented yet. Using local storage fallback.');
    return `${localStorageService.baseUrl}/${filePath}`;
  }
}

// Export the appropriate service based on environment
export const storageService = process.env.NODE_ENV === 'production' 
  ? new FirebaseStorageService() 
  : localStorageService;

export default storageService;
