// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  FILE UTILITIES                                                              │
// │  File upload, validation, and storage utilities for StudyDesk.              │
// └──────────────────────────────────────────────────────────────────────────────┘

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
];

/**
 * Validates a file against size and type constraints
 */
export function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images, PDFs, or Office documents.'
    };
  }

  return { valid: true };
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets appropriate icon for file type
 */
export function getFileIcon(type) {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('excel') || type.includes('sheet')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
  if (type.includes('text') || type.includes('csv')) return '📄';
  return '📎';
}

/**
 * Creates a file attachment object
 */
export function createFileAttachment(file) {
  return {
    id: Date.now() + Math.random(),
    name: file.name,
    type: file.type,
    size: file.size,
    url: URL.createObjectURL(file),
    uploadedAt: new Date().toISOString()
  };
}

/**
 * Converts file to base64 for storage
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Downloads a file from URL
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Preview file in new window
 */
export function previewFile(url, type) {
  if (type.startsWith('image/')) {
    const win = window.open();
    win.document.write(`<img src="${url}" style="max-width:100%;height:auto;">`);
  } else if (type.includes('pdf')) {
    window.open(url, '_blank');
  } else {
    downloadFile(url, url.split('/').pop());
  }
}

/**
 * Compresses image files if needed
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Extracts text content from file (for AI analysis)
 */
export async function extractTextFromFile(file) {
  if (file.type.startsWith('image/')) {
    // For images, you'd need OCR service like Tesseract.js
    // For now, return placeholder
    return '[Image content - OCR analysis would go here]';
  }
  
  if (file.type === 'text/plain') {
    return await file.text();
  }
  
  // For other file types, you'd need specialized libraries
  return '[File content extraction not supported for this type]';
}

/**
 * File upload progress tracker
 */
export class FileUploadTracker {
  constructor() {
    this.uploads = new Map();
  }

  startUpload(fileId, fileName) {
    this.uploads.set(fileId, {
      fileName,
      progress: 0,
      status: 'uploading',
      error: null
    });
  }

  updateProgress(fileId, progress) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.progress = progress;
    }
  }

  completeUpload(fileId) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.progress = 100;
      upload.status = 'completed';
    }
  }

  failUpload(fileId, error) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.status = 'failed';
      upload.error = error;
    }
  }

  getUpload(fileId) {
    return this.uploads.get(fileId);
  }

  removeUpload(fileId) {
    this.uploads.delete(fileId);
  }

  getAllUploads() {
    return Array.from(this.uploads.entries()).map(([id, upload]) => ({ id, ...upload }));
  }
}

export const fileUploadTracker = new FileUploadTracker();

/**
 * Simulates file upload with progress
 */
export function simulateFileUpload(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fileId = Date.now() + Math.random();
    fileUploadTracker.startUpload(fileId, file.name);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        fileUploadTracker.completeUpload(fileId);
        resolve({
          id: fileId,
          ...createFileAttachment(file)
        });
      } else {
        fileUploadTracker.updateProgress(fileId, progress);
        onProgress?.(progress);
      }
    }, 100 + Math.random() * 200);
  });
}

/**
 * Batch file upload handler
 */
export async function uploadMultipleFiles(files, onProgress, onComplete) {
  const results = [];
  const totalFiles = files.length;
  let completedFiles = 0;

  for (const file of files) {
    try {
      const result = await simulateFileUpload(file, (progress) => {
        const overallProgress = ((completedFiles + progress / 100) / totalFiles) * 100;
        onProgress?.(overallProgress);
      });
      results.push(result);
      completedFiles++;
    } catch (error) {
      results.push({ error: error.message, fileName: file.name });
      completedFiles++;
    }
  }

  onComplete?.();
  return results;
}
