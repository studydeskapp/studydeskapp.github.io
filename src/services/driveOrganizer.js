// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  DRIVE ORGANIZATION EXECUTOR                                                 │
// │  Execute AI-generated organization plans.                                    │
// └──────────────────────────────────────────────────────────────────────────────┘

import { 
  getOrCreateFolder, 
  moveFile, 
  renameFile 
} from '../utils/googleDrive';

/**
 * Execute organization plan
 * @param {object} plan - AI-generated plan
 * @param {string} token - Drive access token
 * @param {function} onProgress - Progress callback
 */
export async function executeOrganizationPlan(plan, token, onProgress) {
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  try {
    // Step 1: Create folder structure
    onProgress({ stage: 'folders', current: 0, total: plan.summary.foldersToCreate });
    const folderMap = await createFolderStructure(plan.folderStructure, token, onProgress);
    
    // Step 2: Execute actions
    const acceptedActions = plan.actions.filter(a => a.accepted !== false);
    const total = acceptedActions.length;
    
    for (let i = 0; i < acceptedActions.length; i++) {
      const action = acceptedActions[i];
      onProgress({ 
        stage: 'actions', 
        current: i + 1, 
        total,
        action: action.fileName 
      });
      
      try {
        await executeAction(action, folderMap, token);
        results.success.push(action);
        
        // Rate limiting - wait 100ms between actions
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to execute action for ${action.fileName}:`, error);
        console.error('Action details:', action);
        console.error('Error details:', error.message, error.stack);
        results.failed.push({ ...action, error: error.message });
      }
    }
    
    // Count skipped actions
    results.skipped = plan.actions.filter(a => a.accepted === false);
    
    onProgress({ stage: 'complete', results });
    return results;
    
  } catch (error) {
    console.error('Organization execution error:', error);
    throw error;
  }
}

/**
 * Create folder structure from plan
 */
async function createFolderStructure(structure, token, onProgress) {
  const folderMap = new Map(); // path -> folderId
  let created = 0;
  
  async function createLevel(obj, parentId = null, parentPath = '') {
    for (const [name, children] of Object.entries(obj)) {
      const path = parentPath ? `${parentPath}/${name}` : name;
      
      try {
        const folder = await getOrCreateFolder(token, name, parentId);
        folderMap.set(path, folder.id);
        created++;
        onProgress({ stage: 'folders', current: created, folder: path });
        
        // Create children
        if (typeof children === 'object' && !Array.isArray(children)) {
          await createLevel(children, folder.id, path);
        } else if (Array.isArray(children)) {
          for (const childName of children) {
            const childPath = `${path}/${childName}`;
            const childFolder = await getOrCreateFolder(token, childName, folder.id);
            folderMap.set(childPath, childFolder.id);
            created++;
            onProgress({ stage: 'folders', current: created, folder: childPath });
          }
        }
      } catch (error) {
        console.error(`Failed to create folder ${path}:`, error);
      }
    }
  }
  
  await createLevel(structure);
  return folderMap;
}

/**
 * Execute single action
 */
async function executeAction(action, folderMap, token) {
  switch (action.type) {
    case 'move':
      return executeMoveAction(action, folderMap, token);
    case 'rename':
      return executeRenameAction(action, token);
    case 'archive':
      return executeArchiveAction(action, folderMap, token);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Execute move action
 */
async function executeMoveAction(action, folderMap, token) {
  const targetFolderId = folderMap.get(action.to);
  
  if (!targetFolderId) {
    throw new Error(`Target folder not found: ${action.to}`);
  }
  
  const oldParentId = action.currentParents?.[0] || null;
  await moveFile(token, action.fileId, targetFolderId, oldParentId);
}

/**
 * Execute rename action
 */
async function executeRenameAction(action, token) {
  await renameFile(token, action.fileId, action.newName);
}

/**
 * Execute archive action (move to Archive folder)
 */
async function executeArchiveAction(action, folderMap, token) {
  let archiveFolderId = folderMap.get('Archive');
  
  if (!archiveFolderId) {
    // Create Archive folder if it doesn't exist
    const archiveFolder = await getOrCreateFolder(token, 'Archive');
    archiveFolderId = archiveFolder.id;
    folderMap.set('Archive', archiveFolderId);
  }
  
  const oldParentId = action.currentParents?.[0] || null;
  await moveFile(token, action.fileId, archiveFolderId, oldParentId);
}

/**
 * Validate action before execution
 */
export function validateAction(action) {
  if (!action.fileId) {
    return { valid: false, error: 'Missing file ID' };
  }
  
  if (action.type === 'move' && !action.to) {
    return { valid: false, error: 'Missing destination folder' };
  }
  
  if (action.type === 'rename' && !action.newName) {
    return { valid: false, error: 'Missing new name' };
  }
  
  return { valid: true };
}

/**
 * Estimate execution time
 */
export function estimateExecutionTime(plan) {
  const folderCount = plan.summary.foldersToCreate || 0;
  const actionCount = plan.actions.filter(a => a.accepted !== false).length;
  
  // Rough estimate: 0.5s per folder, 0.3s per action
  const seconds = (folderCount * 0.5) + (actionCount * 0.3);
  
  if (seconds < 60) {
    return `${Math.ceil(seconds)} seconds`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
