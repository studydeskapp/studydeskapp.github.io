// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  GOOGLE DRIVE AI ORGANIZATION                                               │
// │  Gemini-powered intelligent file organization.                              │
// └──────────────────────────────────────────────────────────────────────────────┘

import { callGemini } from '../utils/gemini';
import { exportFileAsText } from '../utils/googleDrive';

/**
 * Generate AI organization plan using Gemini
 * @param {Array} files - Drive files to organize
 * @param {Array} classes - User's class schedule
 * @param {Array} assignments - User's assignments
 * @param {string} token - Drive access token
 */
export async function generateOrganizationPlan(files, classes, assignments, token) {
  // Process files in smaller batches to avoid incomplete JSON responses
  const maxFiles = 20; // Further reduced to ensure complete JSON responses
  const filesToAnalyze = files.slice(0, maxFiles);
  
  console.log(`Analyzing ${filesToAnalyze.length} of ${files.length} files`);
  
  if (files.length > maxFiles) {
    console.log(`Note: Only analyzing first ${maxFiles} files. Run again after organizing these to continue.`);
  }
  
  // Build simpler context
  const classNames = classes.map(c => c.name).join(', ') || 'No classes';
  
  // Ultra-compact file list
  const fileList = filesToAnalyze.map(f => 
    `${f.id}|${f.name}`
  ).join('\n');
  
  const prompt = `Organize ${filesToAnalyze.length} Drive files. Classes: ${classNames}

Files (ID|Name):
${fileList}

Return ONLY valid JSON. Use exact IDs. Create action for EVERY file.
{"folderStructure":{"2025-26":{"Math":[]}},"actions":[{"type":"move","fileId":"ID","fileName":"name","from":"My Drive","to":"2025-26/Math","reasoning":"brief","confidence":0.9}],"summary":{"totalFiles":${filesToAnalyze.length},"filesToMove":${filesToAnalyze.length},"filesToRename":0,"foldersToCreate":5,"duplicatesFound":0}}`;

  try {
    const response = await callGemini(
      prompt, 
      "You are a JSON API. Return ONLY valid complete JSON. No markdown. No truncation.",
      [], // no history
      8192 // maxOutputTokens - maximum for Gemini 2.5 Flash
    );
    
    console.log('AI Response:', response);
    console.log('Response length:', response.length);
    
    // Try multiple JSON extraction methods
    let plan = null;
    
    // Method 1: Try parsing the entire response
    try {
      plan = JSON.parse(response);
      console.log('Method 1 (direct parse) succeeded');
    } catch (e) {
      console.log('Method 1 failed:', e.message);
      // Method 2: Extract JSON from markdown code blocks (improved regex)
      const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          plan = JSON.parse(codeBlockMatch[1]);
          console.log('Method 2 (code block) succeeded');
        } catch (parseError) {
          console.log('Method 2 parse failed:', parseError.message);
        }
      } else {
        console.log('Method 2 failed: no code block found');
        // Method 3: Find first { to last }
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
          console.log('Method 3 (regex match) succeeded');
        } else {
          console.log('Method 3 failed: no JSON pattern found');
          console.log('Full response:', response);
          throw new Error('No JSON found in response');
        }
      }
    }
    
    if (!plan) {
      console.error('AI Response:', response);
      throw new Error('Could not extract valid JSON from AI response');
    }
    
    // Validate and enhance plan
    return validateAndEnhancePlan(plan, files);
  } catch (error) {
    console.error('AI organization error:', error);
    console.error('Full error details:', error.message);
    throw new Error('Failed to generate organization plan: ' + error.message);
  }
}

/**
 * Build context string for AI
 */
function buildContext(files, classes, assignments) {
  const subjects = classes.map(c => c.name).join(', ');
  const upcomingAssignments = assignments
    .filter(a => a.progress < 100)
    .slice(0, 10)
    .map(a => `- ${a.title} (${a.subject}) - Due: ${a.dueDate}`)
    .join('\n');
  
  return `
**Classes:** ${subjects || 'None'}

**Upcoming Assignments:**
${upcomingAssignments || 'None'}

**Current Date:** ${new Date().toLocaleDateString()}
`;
}

/**
 * Format files for AI analysis
 */
function formatFilesForAI(files) {
  return files.map((f, i) => {
    const created = f.createdTime ? new Date(f.createdTime).toLocaleDateString() : 'Unknown';
    const modified = f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Unknown';
    const type = getFileType(f.mimeType);
    const size = f.size ? `${Math.round(f.size / 1024)}KB` : 'N/A';
    const content = f.contentPreview ? `\n  Preview: ${f.contentPreview.substring(0, 150)}...` : '';
    
    return `File ID: ${f.id}
Name: "${f.name}"
Type: ${type}
Size: ${size}
Created: ${created}
Modified: ${modified}${content}`;
  }).join('\n\n');
}

/**
 * Sample file content for AI analysis
 */
async function sampleFileContent(files, token) {
  const filesWithContent = [];
  
  for (const file of files) {
    const fileData = { ...file };
    
    // Only sample Google Docs, Sheets, Slides
    if (file.mimeType.includes('google-apps')) {
      try {
        const content = await exportFileAsText(token, file.id, file.mimeType);
        fileData.contentPreview = content.substring(0, 500); // First 500 chars
      } catch (error) {
        console.warn(`Failed to export ${file.name}:`, error);
      }
    }
    
    filesWithContent.push(fileData);
  }
  
  return filesWithContent;
}

/**
 * Get human-readable file type
 */
function getFileType(mimeType) {
  if (mimeType.includes('document')) return 'Google Doc';
  if (mimeType.includes('spreadsheet')) return 'Google Sheet';
  if (mimeType.includes('presentation')) return 'Google Slides';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('image')) return 'Image';
  if (mimeType.includes('folder')) return 'Folder';
  return 'File';
}

/**
 * Validate and enhance AI plan
 */
function validateAndEnhancePlan(plan, files) {
  // Ensure all required fields exist
  if (!plan.folderStructure) plan.folderStructure = {};
  if (!plan.actions) plan.actions = [];
  if (!plan.summary) {
    plan.summary = {
      totalFiles: files.length,
      filesToMove: plan.actions.filter(a => a.type === 'move').length,
      filesToRename: plan.actions.filter(a => a.type === 'rename').length,
      foldersToCreate: countFoldersToCreate(plan.folderStructure),
      duplicatesFound: 0
    };
  }
  
  // Create a map of valid file IDs
  const validFileIds = new Set(files.map(f => f.id));
  
  // Filter out actions with invalid file IDs
  const validActions = plan.actions.filter(action => {
    if (!validFileIds.has(action.fileId)) {
      console.warn(`Skipping action for invalid file ID: ${action.fileId} (${action.fileName})`);
      return false;
    }
    return true;
  });
  
  console.log(`Validated ${validActions.length} of ${plan.actions.length} actions`);
  plan.actions = validActions;
  
  // Add file metadata to actions
  plan.actions = plan.actions.map(action => {
    const file = files.find(f => f.id === action.fileId);
    if (file) {
      return {
        ...action,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
        currentParents: file.parents || []
      };
    }
    return action;
  });
  
  // Sort actions by confidence (highest first)
  plan.actions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  // Update summary with validated counts
  plan.summary.filesToMove = plan.actions.filter(a => a.type === 'move').length;
  plan.summary.filesToRename = plan.actions.filter(a => a.type === 'rename').length;
  
  return plan;
}

/**
 * Count total folders to create
 */
function countFoldersToCreate(structure, count = 0) {
  for (const key in structure) {
    count++;
    if (typeof structure[key] === 'object' && !Array.isArray(structure[key])) {
      count = countFoldersToCreate(structure[key], count);
    } else if (Array.isArray(structure[key])) {
      count += structure[key].length;
    }
  }
  return count;
}

/**
 * Regenerate plan with user feedback
 */
export async function regenerateWithFeedback(files, classes, assignments, token, feedback) {
  const context = buildContext(files, classes, assignments);
  
  const prompt = `You previously generated a file organization plan. The user provided this feedback:

"${feedback}"

Please regenerate the plan taking this feedback into account.

**Student Context:**
${context}

**Files to Organize (${files.length} total):**
${formatFilesForAI(files.slice(0, 20))}

Generate an improved organization plan in the same JSON format as before.`;

  try {
    const response = await callGemini(prompt, "You are a professional file organization assistant. Always respond with valid JSON only.");
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');
    
    const plan = JSON.parse(jsonMatch[0]);
    return validateAndEnhancePlan(plan, files);
  } catch (error) {
    console.error('Regeneration error:', error);
    throw error;
  }
}
