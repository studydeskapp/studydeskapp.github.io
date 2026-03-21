// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  GOOGLE DRIVE API UTILITIES                                                  │
// │  REST API functions for Google Drive integration.                           │
// └──────────────────────────────────────────────────────────────────────────────┘

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
].join(' ');

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  AUTHENTICATION                                                              │
// └──────────────────────────────────────────────────────────────────────────────┘

/**
 * Initialize Google Drive OAuth
 * Returns access token on success
 */
export async function initDriveAuth() {
  return new Promise((resolve, reject) => {
    // Load Google Identity Services
    if (!window.google?.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => requestDriveAccess(resolve, reject);
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    } else {
      requestDriveAccess(resolve, reject);
    }
  });
}

function requestDriveAccess(resolve, reject) {
  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPES,
    callback: (response) => {
      if (response.access_token) {
        // Store token with expiry
        const expiry = Date.now() + (response.expires_in * 1000);
        localStorage.setItem('sd-drive-token', response.access_token);
        localStorage.setItem('sd-drive-token-expiry', expiry.toString());
        resolve(response.access_token);
      } else {
        reject(new Error('No access token received'));
      }
    },
    error_callback: (error) => {
      reject(new Error(error.message || 'OAuth failed'));
    }
  });
  
  client.requestAccessToken();
}

/**
 * Get stored Drive access token (if valid)
 */
export function getDriveToken() {
  const token = localStorage.getItem('sd-drive-token');
  const expiry = localStorage.getItem('sd-drive-token-expiry');
  
  if (!token || !expiry) return null;
  
  // Check if token expired (with 5 min buffer)
  if (Date.now() >= (parseInt(expiry) - 5 * 60 * 1000)) {
    clearDriveToken();
    return null;
  }
  
  return token;
}

/**
 * Clear stored Drive token
 */
export function clearDriveToken() {
  localStorage.removeItem('sd-drive-token');
  localStorage.removeItem('sd-drive-token-expiry');
}

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  FILE OPERATIONS                                                             │
// └──────────────────────────────────────────────────────────────────────────────┘

/**
 * List all files in Drive
 * @param {string} token - Access token
 * @param {object} options - Query options
 */
export async function listDriveFiles(token, options = {}) {
  const {
    pageSize = 1000,
    orderBy = 'modifiedTime desc',
    q = "trashed = false"
  } = options;
  
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    orderBy,
    q,
    fields: 'files(id,name,mimeType,createdTime,modifiedTime,parents,webViewLink,iconLink,size)',
  });
  
  const response = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to list files');
  }
  
  const data = await response.json();
  return data.files || [];
}

/**
 * Get file metadata
 */
export async function getFileMetadata(token, fileId) {
  const response = await fetch(`${DRIVE_API}/files/${fileId}?fields=*`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get file metadata');
  }
  
  return response.json();
}

/**
 * Create a folder
 */
export async function createFolder(token, name, parentId = null) {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] })
  };
  
  const response = await fetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create folder');
  }
  
  return response.json();
}

/**
 * Move file to folder
 */
export async function moveFile(token, fileId, newParentId, oldParentId = null) {
  const params = new URLSearchParams({
    addParents: newParentId,
    ...(oldParentId && { removeParents: oldParentId })
  });
  
  const response = await fetch(`${DRIVE_API}/files/${fileId}?${params}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    
    // Handle specific error cases
    if (response.status === 403) {
      throw new Error('Permission denied - file may be in a shared folder or you lack edit access');
    }
    if (response.status === 404) {
      throw new Error('File or folder not found');
    }
    
    throw new Error(error.error?.message || 'Failed to move file');
  }
  
  return response.json();
}

/**
 * Rename file
 */
export async function renameFile(token, fileId, newName) {
  const response = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: newName })
  });
  
  if (!response.ok) {
    throw new Error('Failed to rename file');
  }
  
  return response.json();
}

/**
 * Get folder by name (or create if doesn't exist)
 */
export async function getOrCreateFolder(token, name, parentId = null) {
  // Search for existing folder
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentId ? ` and '${parentId}' in parents` : ''}`;
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name)'
  });
  
  const response = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to search for folder');
  }
  
  const data = await response.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  
  // Create folder if not found
  return createFolder(token, name, parentId);
}

/**
 * Export Google Doc/Slides/Sheets as text for AI analysis
 */
export async function exportFileAsText(token, fileId, mimeType) {
  let exportMimeType = 'text/plain';
  
  // Determine export format based on file type
  if (mimeType.includes('document')) {
    exportMimeType = 'text/plain';
  } else if (mimeType.includes('spreadsheet')) {
    exportMimeType = 'text/csv';
  } else if (mimeType.includes('presentation')) {
    exportMimeType = 'text/plain';
  }
  
  const response = await fetch(`${DRIVE_API}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to export file');
  }
  
  return response.text();
}

/**
 * Batch get file metadata (for multiple files)
 */
export async function batchGetFiles(token, fileIds) {
  const promises = fileIds.map(id => getFileMetadata(token, id).catch(() => null));
  return Promise.all(promises);
}
