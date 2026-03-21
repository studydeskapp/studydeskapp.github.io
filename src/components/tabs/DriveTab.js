import React, { useState, useEffect } from 'react';
import { 
  initDriveAuth, 
  getDriveToken, 
  clearDriveToken,
  listDriveFiles 
} from '../../utils/googleDrive';
import { generateOrganizationPlan, regenerateWithFeedback } from '../../services/driveAI';
import { executeOrganizationPlan, estimateExecutionTime } from '../../services/driveOrganizer';

export default function DriveTab({ classes, assignments, darkMode }) {
  const [driveConnected, setDriveConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    const token = getDriveToken();
    if (token) {
      setDriveConnected(true);
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await initDriveAuth();
      setDriveConnected(true);
    } catch (error) {
      console.error('Drive auth error:', error);
      alert('Failed to connect to Google Drive: ' + error.message);
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    clearDriveToken();
    setDriveConnected(false);
    setFiles([]);
    setPlan(null);
  };

  const handleScanFiles = async () => {
    setLoading(true);
    try {
      const token = getDriveToken();
      if (!token) throw new Error('Not authenticated');
      
      const driveFiles = await listDriveFiles(token);
      
      // Filter out folders
      const filesOnly = driveFiles.filter(f => 
        f.mimeType !== 'application/vnd.google-apps.folder'
      );
      
      // Smart filtering: Only organize files in root "My Drive"
      // This allows students to run organization multiple times
      // Files already in folders will be skipped
      const unorganizedFiles = filesOnly.filter(f => {
        // Check if file is in root by looking at parent folders
        // Files in root typically have no parents or a single "root" parent
        if (!f.parents || f.parents.length === 0) return true;
        
        // Check if any parent indicates it's in root
        // Root folder IDs are typically "root" or start with specific patterns
        const isInRoot = f.parents.some(parentId => 
          parentId === 'root' || 
          parentId === '0AHRbmF6YmRoZUk9PVA' || // Common root ID pattern
          !parentId // No parent means root
        );
        
        return isInRoot;
      });
      
      console.log(`📊 Scan Results:
        - Total files: ${filesOnly.length}
        - Files in root (unorganized): ${unorganizedFiles.length}
        - Files already organized: ${filesOnly.length - unorganizedFiles.length}`);
      
      setFiles(unorganizedFiles);
      
      if (unorganizedFiles.length === 0) {
        const organizedCount = filesOnly.length;
        if (organizedCount > 0) {
          alert(`✅ Great job! All ${organizedCount} files are already organized in folders.\n\nNo files found in root "My Drive" to organize.`);
        } else {
          alert('No files found to organize. Your Drive only contains folders.');
        }
        setLoading(false);
        return;
      }
      
      const orgPlan = await generateOrganizationPlan(unorganizedFiles, classes, assignments, token);
      setPlan(orgPlan);
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan files: ' + error.message);
    }
    setLoading(false);
  };

  const handleToggleAction = (index) => {
    setPlan(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => 
        i === index ? { ...a, accepted: a.accepted === false ? true : !a.accepted } : a
      )
    }));
  };

  const handleEditAction = (index, updates) => {
    setPlan(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => 
        i === index ? { ...a, ...updates } : a
      )
    }));
  };

  const handleExecute = async () => {
    if (!plan) return;
    
    const acceptedCount = plan.actions.filter(a => a.accepted !== false).length;
    const confirmed = window.confirm(
      `This will organize ${acceptedCount} files. Continue?`
    );
    
    if (!confirmed) return;
    
    setExecuting(true);
    setProgress({ stage: 'starting', current: 0, total: 0 });
    
    try {
      const token = getDriveToken();
      const execResults = await executeOrganizationPlan(plan, token, setProgress);
      setResults(execResults);
      setPlan(null);
    } catch (error) {
      console.error('Execution error:', error);
      alert('Organization failed: ' + error.message);
    }
    
    setExecuting(false);
    setProgress(null);
  };

  const handleRegenerate = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback first');
      return;
    }
    
    setLoading(true);
    try {
      const token = getDriveToken();
      const newPlan = await regenerateWithFeedback(files, classes, assignments, token, feedback);
      setPlan(newPlan);
      setShowFeedback(false);
      setFeedback('');
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('Failed to regenerate plan: ' + error.message);
    }
    setLoading(false);
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const filteredActions = plan?.actions.filter(action => {
    if (filter === 'all') return true;
    if (filter === 'accepted') return action.accepted !== false;
    if (filter === 'rejected') return action.accepted === false;
    return action.type === filter;
  }) || [];

  const acceptedCount = plan?.actions.filter(a => a.accepted !== false).length || 0;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: NOT CONNECTED
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!driveConnected) {
    return (
      <div style={styles.container(darkMode)}>
        <div style={styles.emptyState(darkMode)}>
          <div style={styles.emptyIcon(darkMode)}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <path d="M12 11v6m-3-3h6" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={styles.emptyTitle(darkMode)}>AI-Powered Drive Organization</h2>
          <p style={styles.emptyDescription(darkMode)}>
            Connect your Google Drive and let AI automatically organize your files based on your classes, 
            assignments, and file content. Smart, fast, and personalized.
          </p>
          <div style={styles.featureGrid}>
            <div style={styles.featureItem(darkMode)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>Smart Categorization</span>
            </div>
            <div style={styles.featureItem(darkMode)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span>Confidence Scores</span>
            </div>
            <div style={styles.featureItem(darkMode)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Review & Edit</span>
            </div>
          </div>
          <button 
            onClick={handleConnect} 
            disabled={loading}
            style={styles.primaryButton(darkMode, loading)}
          >
            {loading ? (
              <>
                <div style={styles.buttonSpinner}></div>
                Connecting...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Connect Google Drive
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: RESULTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (results) {
    const hasErrors = results.failed.length > 0;
    return (
      <div style={styles.container(darkMode)}>
        <div style={styles.resultsCard(darkMode)}>
          <div style={styles.resultsIcon(hasErrors)}>
            {hasErrors ? (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
          </div>
          <h2 style={styles.resultsTitle(darkMode)}>
            {hasErrors ? 'Organization Completed with Issues' : 'Organization Complete!'}
          </h2>
          <p style={styles.resultsSubtitle(darkMode)}>
            {hasErrors 
              ? 'Some files couldn\'t be moved. Check the details below.'
              : 'All files have been organized successfully.'}
          </p>
          
          <div style={styles.statsGrid}>
            <div style={styles.statCard(darkMode, 'success')}>
              <div style={styles.statValue}>{results.success.length}</div>
              <div style={styles.statLabel}>Organized</div>
            </div>
            <div style={styles.statCard(darkMode, 'error')}>
              <div style={styles.statValue}>{results.failed.length}</div>
              <div style={styles.statLabel}>Failed</div>
            </div>
            <div style={styles.statCard(darkMode, 'neutral')}>
              <div style={styles.statValue}>{results.skipped.length}</div>
              <div style={styles.statLabel}>Skipped</div>
            </div>
          </div>
          
          {hasErrors && (
            <div style={styles.errorSection(darkMode)}>
              <div style={styles.errorHeader(darkMode)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Files That Couldn't Be Moved</span>
              </div>
              <p style={styles.errorHint(darkMode)}>
                These files are likely in shared folders or you don't have edit permission.
              </p>
              <div style={styles.errorList}>
                {results.failed.slice(0, 5).map((item, i) => (
                  <div key={i} style={styles.errorItem(darkMode)}>
                    <div style={styles.errorItemName}>{item.fileName}</div>
                    <div style={styles.errorItemMessage}>{item.error}</div>
                  </div>
                ))}
                {results.failed.length > 5 && (
                  <div style={styles.errorMore}>
                    + {results.failed.length - 5} more files
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => { setResults(null); setFiles([]); }}
            style={styles.primaryButton(darkMode)}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: EXECUTING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (executing) {
    const percent = progress ? (progress.current / progress.total * 100) : 0;
    return (
      <div style={styles.container(darkMode)}>
        <div style={styles.executingCard(darkMode)}>
          <div style={styles.executingSpinner}></div>
          <h2 style={styles.executingTitle(darkMode)}>Organizing Your Files</h2>
          {progress && (
            <>
              <p style={styles.executingStage(darkMode)}>
                {progress.stage === 'folders' ? 'Creating folder structure...' : 'Moving files...'}
              </p>
              {progress.action && (
                <p style={styles.executingAction(darkMode)}>{progress.action}</p>
              )}
              <div style={styles.progressBarContainer}>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill(percent)}></div>
                </div>
                <div style={styles.progressStats}>
                  <span>{progress.current} / {progress.total}</span>
                  <span>{Math.round(percent)}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: MAIN VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div style={styles.container(darkMode)}>
      {/* Header */}
      <div style={styles.header(darkMode)}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon(darkMode)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.headerTitle(darkMode)}>Drive Organization</h1>
            <p style={styles.headerSubtitle(darkMode)}>
              {files.length > 0 ? `${files.length} files ready to organize` : 'Connected to Google Drive'}
            </p>
          </div>
        </div>
        <button onClick={handleDisconnect} style={styles.disconnectButton(darkMode)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Disconnect
        </button>
      </div>

      {/* No Plan Yet - Show Scan Button */}
      {!plan && (
        <div style={styles.scanSection(darkMode)}>
          {files.length > 20 && (
            <div style={styles.infoCard(darkMode)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <div>
                <div style={styles.infoTitle(darkMode)}>Large File Set Detected</div>
                <div style={styles.infoText(darkMode)}>
                  You have {files.length} files. We'll organize 20 at a time for best results. 
                  Run the scan multiple times to organize everything.
                </div>
              </div>
            </div>
          )}
          
          <div style={styles.scanCard(darkMode)}>
            <div style={styles.scanIcon(darkMode)}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h3 style={styles.scanTitle(darkMode)}>Ready to Organize</h3>
            <p style={styles.scanDescription(darkMode)}>
              AI will analyze your files and create a smart organization plan based on your classes and assignments.
            </p>
            <button 
              onClick={handleScanFiles} 
              disabled={loading}
              style={styles.primaryButton(darkMode, loading)}
            >
              {loading ? (
                <>
                  <div style={styles.buttonSpinner}></div>
                  Analyzing Files...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  Scan & Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Plan View */}
      {plan && (
        <>
          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard(darkMode)}>
              <div style={styles.summaryIcon('#6366f1')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div style={styles.summaryContent}>
                <div style={styles.summaryValue}>{plan.summary.totalFiles}</div>
                <div style={styles.summaryLabel}>Files Analyzed</div>
              </div>
            </div>
            
            <div style={styles.summaryCard(darkMode)}>
              <div style={styles.summaryIcon('#10b981')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={styles.summaryContent}>
                <div style={styles.summaryValue}>{acceptedCount}</div>
                <div style={styles.summaryLabel}>Actions Ready</div>
              </div>
            </div>
            
            <div style={styles.summaryCard(darkMode)}>
              <div style={styles.summaryIcon('#f59e0b')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style={styles.summaryContent}>
                <div style={styles.summaryValue}>{plan.summary.foldersToCreate}</div>
                <div style={styles.summaryLabel}>New Folders</div>
              </div>
            </div>
            
            <div style={styles.summaryCard(darkMode)}>
              <div style={styles.summaryIcon('#8b5cf6')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div style={styles.summaryContent}>
                <div style={styles.summaryValue}>{estimateExecutionTime(plan)}</div>
                <div style={styles.summaryLabel}>Est. Time</div>
              </div>
            </div>
          </div>

          {/* Folder Structure Preview */}
          <div style={styles.section(darkMode)}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle(darkMode)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                Folder Structure
              </h3>
            </div>
            <div style={styles.folderPreview(darkMode)}>
              <FolderTree 
                structure={plan.folderStructure} 
                expanded={expandedFolders}
                onToggle={toggleFolder}
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* Actions List */}
          <div style={styles.section(darkMode)}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle(darkMode)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                File Actions ({filteredActions.length})
              </h3>
              <div style={styles.filterGroup}>
                {['all', 'move', 'accepted', 'rejected'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={styles.filterButton(darkMode, filter === f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={styles.actionsList}>
              {filteredActions.map((action, index) => (
                <ActionCard
                  key={action.fileId}
                  action={action}
                  index={plan.actions.indexOf(action)}
                  onToggle={handleToggleAction}
                  onEdit={handleEditAction}
                  darkMode={darkMode}
                />
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={styles.bottomBar(darkMode)}>
            <button 
              onClick={() => setShowFeedback(true)}
              style={styles.secondaryButton(darkMode)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Give Feedback
            </button>
            <button 
              onClick={handleExecute}
              disabled={acceptedCount === 0}
              style={styles.executeButton(darkMode, acceptedCount === 0)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Execute Plan ({acceptedCount})
            </button>
          </div>

          {/* Feedback Modal */}
          {showFeedback && (
            <FeedbackModal
              feedback={feedback}
              setFeedback={setFeedback}
              onSubmit={handleRegenerate}
              onClose={() => setShowFeedback(false)}
              loading={loading}
              darkMode={darkMode}
            />
          )}
        </>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUB-COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FolderTree({ structure, expanded, onToggle, darkMode, path = '' }) {
  return (
    <div style={styles.folderTree}>
      {Object.entries(structure).map(([name, children]) => {
        const currentPath = path ? `${path}/${name}` : name;
        const isExpanded = expanded.has(currentPath);
        const hasChildren = typeof children === 'object';
        
        return (
          <div key={currentPath} style={styles.folderItem}>
            <div 
              style={styles.folderRow(darkMode, hasChildren)}
              onClick={() => hasChildren && onToggle(currentPath)}
            >
              {hasChildren && (
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{
                    marginRight: '8px',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', color: '#f59e0b'}}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{name}</span>
            </div>
            {hasChildren && isExpanded && (
              <div style={styles.folderChildren(darkMode)}>
                {Array.isArray(children) ? (
                  children.map(child => (
                    <div key={child} style={styles.folderRow(darkMode, false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', marginLeft: '22px', color: '#f59e0b'}}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>{child}</span>
                    </div>
                  ))
                ) : (
                  <FolderTree 
                    structure={children} 
                    expanded={expanded}
                    onToggle={onToggle}
                    darkMode={darkMode}
                    path={currentPath}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionCard({ action, index, onToggle, onEdit, darkMode }) {
  const [editing, setEditing] = useState(false);
  const [editedTo, setEditedTo] = useState(action.to || '');
  const [editedName, setEditedName] = useState(action.newName || '');
  
  const isAccepted = action.accepted !== false;
  const confidenceColor = action.confidence >= 0.8 ? '#10b981' : 
                          action.confidence >= 0.5 ? '#f59e0b' : '#ef4444';
  
  const handleSaveEdit = () => {
    onEdit(index, {
      ...(action.type === 'move' && { to: editedTo }),
      ...(action.type === 'rename' && { newName: editedName })
    });
    setEditing(false);
  };
  
  return (
    <div style={styles.actionCard(darkMode, isAccepted)}>
      <div style={styles.actionCardHeader}>
        <div style={styles.actionCardLeft}>
          <input
            type="checkbox"
            checked={isAccepted}
            onChange={() => onToggle(index)}
            style={styles.checkbox}
          />
          <div style={styles.actionCardInfo}>
            <div style={styles.actionFileName(darkMode)}>{action.fileName}</div>
            <div style={styles.actionMeta}>
              <span style={styles.actionBadge(action.type)}>{action.type}</span>
              <span style={styles.confidenceBadge(confidenceColor)}>
                {Math.round(action.confidence * 100)}% confident
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {action.type === 'move' && (
        <div style={styles.actionDetails(darkMode)}>
          <div style={styles.actionPath(darkMode)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px', opacity: 0.5}}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={styles.pathLabel}>From:</span>
            <span style={styles.pathValue(darkMode)}>{action.from || 'My Drive'}</span>
          </div>
          <div style={styles.actionPath(darkMode)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px', opacity: 0.5}}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span style={styles.pathLabel}>To:</span>
            {editing ? (
              <input
                type="text"
                value={editedTo}
                onChange={(e) => setEditedTo(e.target.value)}
                style={styles.editInput(darkMode)}
              />
            ) : (
              <span style={styles.pathValue(darkMode)}>{action.to}</span>
            )}
          </div>
        </div>
      )}
      
      {action.type === 'rename' && (
        <div style={styles.actionDetails(darkMode)}>
          <div style={styles.actionPath(darkMode)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px', opacity: 0.5}}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span style={styles.pathLabel}>New name:</span>
            {editing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={styles.editInput(darkMode)}
              />
            ) : (
              <span style={styles.pathValue(darkMode)}>{action.newName}</span>
            )}
          </div>
        </div>
      )}
      
      <div style={styles.actionReasoning(darkMode)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px', opacity: 0.6}}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        {action.reasoning}
      </div>
      
      <div style={styles.actionButtons}>
        {editing ? (
          <>
            <button onClick={handleSaveEdit} style={styles.saveButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Save
            </button>
            <button onClick={() => setEditing(false)} style={styles.cancelButton}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={styles.editActionButton(darkMode)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function FeedbackModal({ feedback, setFeedback, onSubmit, onClose, loading, darkMode }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal(darkMode)} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle(darkMode)}>Provide Feedback</h3>
          <button onClick={onClose} style={styles.modalClose(darkMode)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p style={styles.modalDescription(darkMode)}>
          Tell the AI how to improve the organization plan. Be specific about what you'd like changed.
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="E.g., 'Create separate folders for each semester', 'Move all PDFs to a Documents folder', 'Too many subfolders'"
          style={styles.feedbackTextarea(darkMode)}
          rows={6}
          autoFocus
        />
        <div style={styles.modalActions}>
          <button onClick={onClose} style={styles.modalCancelButton(darkMode)}>
            Cancel
          </button>
          <button 
            onClick={onSubmit} 
            disabled={loading || !feedback.trim()}
            style={styles.modalSubmitButton(darkMode, loading || !feedback.trim())}
          >
            {loading ? (
              <>
                <div style={styles.buttonSpinner}></div>
                Regenerating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                Regenerate Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = {
  container: (dark) => ({
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: dark ? '#0f0f0f' : '#fafaf8',
    minHeight: '100vh'
  }),

  // ━━━ HEADER ━━━
  header: (dark) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '16px',
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'
  }),

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },

  headerIcon: (dark) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: dark ? '#6366f1' : '#eef2ff',
    color: dark ? '#fff' : '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),

  headerTitle: (dark) => ({
    fontSize: '24px',
    fontWeight: '700',
    color: dark ? '#fff' : '#1B1F3B',
    marginBottom: '4px'
  }),

  headerSubtitle: (dark) => ({
    fontSize: '14px',
    color: dark ? '#999' : '#666',
    fontWeight: '400'
  }),

  disconnectButton: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    color: dark ? '#ef4444' : '#dc2626',
    border: `2px solid ${dark ? '#ef4444' : '#dc2626'}`,
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: dark ? '#ef444410' : '#fef2f2'
    }
  }),

  // ━━━ EMPTY STATE ━━━
  emptyState: (dark) => ({
    maxWidth: '600px',
    margin: '80px auto',
    textAlign: 'center',
    padding: '48px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '20px',
    boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)'
  }),

  emptyIcon: (dark) => ({
    width: '120px',
    height: '120px',
    margin: '0 auto 24px',
    borderRadius: '24px',
    backgroundColor: dark ? '#6366f1' : '#eef2ff',
    color: dark ? '#fff' : '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),

  emptyTitle: (dark) => ({
    fontSize: '28px',
    fontWeight: '700',
    color: dark ? '#fff' : '#1B1F3B',
    marginBottom: '12px'
  }),

  emptyDescription: (dark) => ({
    fontSize: '16px',
    lineHeight: '1.6',
    color: dark ? '#aaa' : '#666',
    marginBottom: '32px'
  }),

  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '32px'
  },

  featureItem: (dark) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: dark ? '#0f0f0f' : '#f9fafb',
    borderRadius: '12px',
    fontSize: '13px',
    color: dark ? '#999' : '#666',
    fontWeight: '500'
  }),

  // ━━━ BUTTONS ━━━
  primaryButton: (dark, disabled = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: disabled ? '#9ca3af' : '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
    ':hover': disabled ? {} : {
      backgroundColor: '#5558e3',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)'
    }
  }),

  secondaryButton: (dark) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    color: dark ? '#6366f1' : '#4f46e5',
    border: `2px solid ${dark ? '#6366f1' : '#4f46e5'}`,
    borderRadius: '12px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: dark ? '#6366f110' : '#eef2ff'
    }
  }),

  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },

  // ━━━ SCAN SECTION ━━━
  scanSection: (dark) => ({
    maxWidth: '800px',
    margin: '0 auto'
  }),

  infoCard: (dark) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: dark ? '#1a1a1a' : '#fef3c7',
    border: `1px solid ${dark ? '#fbbf24' : '#fcd34d'}`,
    borderRadius: '12px',
    marginBottom: '24px',
    color: dark ? '#fbbf24' : '#92400e'
  }),

  infoTitle: (dark) => ({
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
    color: dark ? '#fbbf24' : '#92400e'
  }),

  infoText: (dark) => ({
    fontSize: '13px',
    lineHeight: '1.5',
    color: dark ? '#d97706' : '#78350f'
  }),

  scanCard: (dark) => ({
    textAlign: 'center',
    padding: '48px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '16px',
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'
  }),

  scanIcon: (dark) => ({
    width: '96px',
    height: '96px',
    margin: '0 auto 24px',
    borderRadius: '20px',
    backgroundColor: dark ? '#6366f1' : '#eef2ff',
    color: dark ? '#fff' : '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),

  scanTitle: (dark) => ({
    fontSize: '24px',
    fontWeight: '700',
    color: dark ? '#fff' : '#1B1F3B',
    marginBottom: '12px'
  }),

  scanDescription: (dark) => ({
    fontSize: '15px',
    lineHeight: '1.6',
    color: dark ? '#aaa' : '#666',
    marginBottom: '32px',
    maxWidth: '500px',
    margin: '0 auto 32px'
  }),

  // ━━━ SUMMARY CARDS ━━━
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },

  summaryCard: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '16px',
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'translateY(-2px)'
    }
  }),

  summaryIcon: (color) => ({
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: `${color}15`,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }),

  summaryContent: {
    flex: 1
  },

  summaryValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#6366f1',
    lineHeight: 1,
    marginBottom: '6px'
  },

  summaryLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  // ━━━ SECTIONS ━━━
  section: (dark) => ({
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'
  }),

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px'
  },

  sectionTitle: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: '700',
    color: dark ? '#fff' : '#1B1F3B'
  }),

  // ━━━ FOLDER PREVIEW ━━━
  folderPreview: (dark) => ({
    backgroundColor: dark ? '#0f0f0f' : '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    maxHeight: '400px',
    overflowY: 'auto'
  }),

  folderTree: {
    fontSize: '14px'
  },

  folderItem: {
    marginBottom: '4px'
  },

  folderRow: (dark, hasChildren) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: hasChildren ? 'pointer' : 'default',
    transition: 'all 0.2s',
    color: dark ? '#ddd' : '#333',
    fontWeight: '500',
    ':hover': hasChildren ? {
      backgroundColor: dark ? '#1a1a1a' : '#f3f4f6'
    } : {}
  }),

  folderChildren: (dark) => ({
    marginLeft: '8px',
    paddingLeft: '16px',
    borderLeft: `2px solid ${dark ? '#333' : '#e5e7eb'}`
  }),

  // ━━━ FILTER GROUP ━━━
  filterGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },

  filterButton: (dark, active) => ({
    backgroundColor: active ? '#6366f1' : (dark ? '#0f0f0f' : '#f3f4f6'),
    color: active ? '#fff' : (dark ? '#ddd' : '#666'),
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: active ? '#5558e3' : (dark ? '#1a1a1a' : '#e5e7eb')
    }
  }),

  // ━━━ ACTIONS LIST ━━━
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '600px',
    overflowY: 'auto',
    paddingRight: '4px'
  },

  actionCard: (dark, accepted) => ({
    backgroundColor: dark ? '#0f0f0f' : '#f9fafb',
    border: `2px solid ${accepted ? (dark ? '#333' : '#e5e7eb') : '#ef4444'}`,
    borderRadius: '12px',
    padding: '20px',
    opacity: accepted ? 1 : 0.5,
    transition: 'all 0.2s',
    ':hover': {
      borderColor: accepted ? (dark ? '#6366f1' : '#c7d2fe') : '#ef4444'
    }
  }),

  actionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '12px'
  },

  actionCardLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1
  },

  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    marginTop: '2px',
    accentColor: '#6366f1'
  },

  actionCardInfo: {
    flex: 1
  },

  actionFileName: (dark) => ({
    fontSize: '16px',
    fontWeight: '600',
    color: dark ? '#fff' : '#1B1F3B',
    marginBottom: '8px',
    lineHeight: '1.4'
  }),

  actionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },

  actionBadge: (type) => ({
    backgroundColor: type === 'move' ? '#3b82f6' : type === 'rename' ? '#f59e0b' : '#8b5cf6',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }),

  confidenceBadge: (color) => ({
    fontSize: '12px',
    fontWeight: '600',
    color: color,
    padding: '4px 10px',
    backgroundColor: `${color}15`,
    borderRadius: '6px'
  }),

  actionDetails: (dark) => ({
    marginBottom: '16px',
    fontSize: '14px'
  }),

  actionPath: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    padding: '8px 12px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '8px'
  }),

  pathLabel: {
    fontWeight: '600',
    color: '#666',
    minWidth: '50px'
  },

  pathValue: (dark) => ({
    flex: 1,
    color: dark ? '#ddd' : '#333'
  }),

  editInput: (dark) => ({
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: `2px solid ${dark ? '#6366f1' : '#c7d2fe'}`,
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    color: dark ? '#fff' : '#1B1F3B',
    fontSize: '14px',
    outline: 'none'
  }),

  actionReasoning: (dark) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    color: dark ? '#999' : '#666',
    fontStyle: 'italic',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '8px',
    lineHeight: '1.5'
  }),

  actionButtons: {
    display: 'flex',
    gap: '8px'
  },

  editActionButton: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'transparent',
    color: dark ? '#6366f1' : '#4f46e5',
    border: `2px solid ${dark ? '#6366f1' : '#4f46e5'}`,
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: dark ? '#6366f110' : '#eef2ff'
    }
  }),

  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#059669'
    }
  },

  cancelButton: {
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#4b5563'
    }
  },

  // ━━━ BOTTOM BAR ━━━
  bottomBar: (dark) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '16px',
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
    position: 'sticky',
    bottom: '24px',
    zIndex: 10
  }),

  executeButton: (dark, disabled) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: disabled ? '#9ca3af' : '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
    ':hover': disabled ? {} : {
      backgroundColor: '#059669',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
    }
  }),

  // ━━━ EXECUTING STATE ━━━
  executingCard: (dark) => ({
    maxWidth: '500px',
    margin: '100px auto',
    textAlign: 'center',
    padding: '48px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '20px',
    boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)'
  }),

  executingSpinner: {
    width: '64px',
    height: '64px',
    border: '6px solid #e5e7eb',
    borderTop: '6px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 24px'
  },

  executingTitle: (dark) => ({
    fontSize: '24px',
    fontWeight: '700',
    color: dark ? '#fff' : '#1B1F3B',
    marginBottom: '12px'
  }),

  executingStage: (dark) => ({
    fontSize: '16px',
    color: dark ? '#aaa' : '#666',
    marginBottom: '8px'
  }),

  executingAction: (dark) => ({
    fontSize: '14px',
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: '24px'
  }),

  progressBarContainer: {
    marginTop: '24px'
  },

  progressBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '12px'
  },

  progressFill: (percent) => ({
    width: `${percent}%`,
    height: '100%',
    backgroundColor: '#6366f1',
    transition: 'width 0.3s ease',
    borderRadius: '5px'
  }),

  progressStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6366f1'
  },

  // ━━━ RESULTS STATE ━━━
  resultsCard: (dark) => ({
    maxWidth: '700px',
    margin: '80px auto',
    textAlign: 'center',
    padding: '48px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '20px',
    boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)'
  }),

  resultsIcon: (hasErrors) => ({
    width: '96px',
    height: '96px',
    margin: '0 auto 24px',
    borderRadius: '50%',
    backgroundColor: hasErrors ? '#fef2f2' : '#f0fdf4',
    color: hasErrors ? '#f59e0b' : '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }),

  resultsTitle: (dark) => ({
    fontSize: '28px',
    fontWeight: '700',
    color: dark ? '#fff' : '#1B1F3B',
    marginBottom: '12px'
  }),

  resultsSubtitle: (dark) => ({
    fontSize: '16px',
    color: dark ? '#aaa' : '#666',
    marginBottom: '32px'
  }),

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '32px'
  },

  statCard: (dark, type) => {
    const colors = {
      success: { bg: '#f0fdf4', text: '#10b981' },
      error: { bg: '#fef2f2', text: '#ef4444' },
      neutral: { bg: '#f3f4f6', text: '#6b7280' }
    };
    const color = colors[type] || colors.neutral;
    
    return {
      padding: '24px',
      backgroundColor: dark ? '#0f0f0f' : color.bg,
      borderRadius: '12px',
      textAlign: 'center'
    };
  },

  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#6366f1',
    lineHeight: 1,
    marginBottom: '8px'
  },

  statLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  errorSection: (dark) => ({
    textAlign: 'left',
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: dark ? '#0f0f0f' : '#fef2f2',
    borderRadius: '12px',
    border: `1px solid ${dark ? '#ef4444' : '#fecaca'}`
  }),

  errorHeader: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: '8px'
  }),

  errorHint: (dark) => ({
    fontSize: '13px',
    color: dark ? '#aaa' : '#666',
    marginBottom: '16px',
    fontStyle: 'italic'
  }),

  errorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto'
  },

  errorItem: (dark) => ({
    padding: '12px',
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '8px',
    borderLeft: '3px solid #ef4444'
  }),

  errorItemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px'
  },

  errorItemMessage: {
    fontSize: '12px',
    color: '#ef4444',
    fontFamily: 'monospace'
  },

  errorMore: {
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
    padding: '12px',
    fontStyle: 'italic'
  },

  // ━━━ MODAL ━━━
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },

  modal: (dark) => ({
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '550px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    maxHeight: '90vh',
    overflowY: 'auto'
  }),

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },

  modalTitle: (dark) => ({
    fontSize: '24px',
    fontWeight: '700',
    color: dark ? '#fff' : '#1B1F3B'
  }),

  modalClose: (dark) => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: dark ? '#999' : '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: dark ? '#0f0f0f' : '#f3f4f6'
    }
  }),

  modalDescription: (dark) => ({
    fontSize: '14px',
    color: dark ? '#aaa' : '#666',
    marginBottom: '20px',
    lineHeight: '1.6'
  }),

  feedbackTextarea: (dark) => ({
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: `2px solid ${dark ? '#333' : '#e5e7eb'}`,
    backgroundColor: dark ? '#0f0f0f' : '#fff',
    color: dark ? '#fff' : '#1B1F3B',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '24px',
    lineHeight: '1.6',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#6366f1'
    }
  }),

  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },

  modalCancelButton: (dark) => ({
    backgroundColor: 'transparent',
    color: dark ? '#aaa' : '#666',
    border: `2px solid ${dark ? '#333' : '#e5e7eb'}`,
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: dark ? '#0f0f0f' : '#f3f4f6'
    }
  }),

  modalSubmitButton: (dark, disabled) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: disabled ? '#9ca3af' : '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
    ':hover': disabled ? {} : {
      backgroundColor: '#5558e3'
    }
  })
};

// Add keyframe animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
