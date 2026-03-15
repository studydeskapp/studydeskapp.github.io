import React, { useState } from 'react';
import { callGemini, uploadFileToGemini, callGeminiWithFile, deleteGeminiFile } from '../../utils/gemini';
import { extractTextFromFile, validateFile, createFileAttachment } from '../../utils/fileUtils';

function AINoteAnalyzer({ notes, assignments, darkMode }) {
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedGeminiFiles, setUploadedGeminiFiles] = useState([]); // Store Gemini file references
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const handleNoteSelection = (noteId) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const fileAttachments = [];
    const geminiFiles = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(`File "${file.name}" is invalid: ${validation.error}`);
        continue;
      }
      
      try {
        const attachment = createFileAttachment(file);
        fileAttachments.push(attachment);
        validFiles.push(file);

        // Upload to Gemini Files API for PDFs and images
        if (file.type.includes('pdf') || file.type.startsWith('image/')) {
          try {
            console.log(`Uploading ${file.name} to Gemini...`);
            const geminiFile = await uploadFileToGemini(file);
            console.log(`Successfully uploaded ${file.name} to Gemini:`, geminiFile);
            geminiFiles.push({
              ...attachment,
              geminiFile: geminiFile
            });
          } catch (error) {
            console.error(`Failed to upload ${file.name} to Gemini:`, error);
            alert(`Failed to upload ${file.name} to Gemini: ${error.message}. Will use filename analysis instead.`);
            // Still add the file even if Gemini upload fails
            geminiFiles.push(attachment);
          }
        } else {
          geminiFiles.push(attachment);
        }
      } catch (error) {
        alert(`Failed to process file "${file.name}": ${error.message}`);
      }
    }

    if (fileAttachments.length > 0) {
      setUploadedFiles(prev => [...prev, ...fileAttachments]);
      setUploadedGeminiFiles(prev => [...prev, ...geminiFiles]);
      
      // Log the final state
      console.log('Uploaded files:', fileAttachments.length);
      console.log('Gemini files:', geminiFiles.filter(f => f.geminiFile).length);
    }
  };

  const removeUploadedFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    
    // Also remove from Gemini files and cleanup
    const geminiFileToRemove = uploadedGeminiFiles.find(file => file.id === fileId);
    if (geminiFileToRemove?.geminiFile) {
      deleteGeminiFile(geminiFileToRemove.geminiFile);
    }
    setUploadedGeminiFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const extractContentFromUploadedFiles = async () => {
    const content = [];
    
    for (const file of uploadedFiles) {
      try {
        let textContent = '';
        
        if (file.type.startsWith('image/')) {
          textContent = `[Image: ${file.name} - Visual content that would need OCR analysis. Based on filename, this appears to be related to visual learning materials.]`;
        } else if (file.type === 'text/plain') {
          // For text files, we can read the content directly
          const reader = new FileReader();
          textContent = await new Promise((resolve, reject) => {
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        } else if (file.type.includes('pdf')) {
          // Extract meaningful info from filename for PDF analysis
          const filename = file.name.toLowerCase();
          let subjectGuess = '';
          let topicGuess = '';
          
          if (filename.includes('chemistry') || filename.includes('chem')) {
            subjectGuess = 'Chemistry';
            if (filename.includes('foundations')) topicGuess = 'Foundational chemistry concepts';
            else if (filename.includes('organic')) topicGuess = 'Organic chemistry';
            else if (filename.includes('inorganic')) topicGuess = 'Inorganic chemistry';
            else if (filename.includes('physical')) topicGuess = 'Physical chemistry';
            else topicGuess = 'General chemistry topics';
          } else if (filename.includes('physics')) {
            subjectGuess = 'Physics';
            topicGuess = 'Physics concepts and problems';
          } else if (filename.includes('biology') || filename.includes('bio')) {
            subjectGuess = 'Biology';
            topicGuess = 'Biological concepts and processes';
          } else if (filename.includes('math') || filename.includes('calculus') || filename.includes('algebra')) {
            subjectGuess = 'Mathematics';
            topicGuess = 'Mathematical concepts and problems';
          } else if (filename.includes('history')) {
            subjectGuess = 'History';
            topicGuess = 'Historical events and periods';
          } else if (filename.includes('english') || filename.includes('literature')) {
            subjectGuess = 'English/Literature';
            topicGuess = 'Literary analysis and writing';
          }
          
          textContent = `[PDF Document: ${file.name}
Subject: ${subjectGuess || 'Unknown subject'}
Topic: ${topicGuess || 'General study material'}
File size: ${Math.round(file.size / 1024)} KB
Note: This appears to be a ${subjectGuess ? subjectGuess + ' ' : ''}document. For detailed content analysis, the PDF text would need to be extracted using a PDF parsing library.]`;
        } else if (file.type.includes('word') || file.type.includes('document')) {
          textContent = `[Word Document: ${file.name} - Content extraction would require DOCX parsing library. File size: ${Math.round(file.size / 1024)} KB]`;
        } else {
          textContent = `[File: ${file.name} - Content type: ${file.type}, Size: ${Math.round(file.size / 1024)} KB]`;
        }
        
        content.push(`--- Content from ${file.name} ---\n${textContent}`);
      } catch (error) {
        console.warn(`Failed to extract text from ${file.name}:`, error);
        content.push(`--- Content from ${file.name} ---\n[File content extraction failed]`);
      }
    }
    
    return content.join('\n\n');
  };

  const getSelectedNotesContent = () => {
    return notes.filter(note => selectedNotes.includes(note.id));
  };

  const generateAnalysis = async () => {
    if (selectedNotes.length === 0 && uploadedFiles.length === 0 && !textInput.trim()) {
      alert('Please select at least one note, upload a file, or enter text to analyze');
      return;
    }

    setLoading(true);
    const selectedNotesData = getSelectedNotesContent();

    try {
      let response = '';
      
      // Check if we have any Gemini-uploaded files (PDFs or images)
      const geminiUploadedFiles = uploadedGeminiFiles.filter(file => file.geminiFile);
      
      const prompt = await createAnalysisPrompt(selectedNotesData, assignments, await extractContentFromUploadedFiles(), textInput);
      
      if (geminiUploadedFiles.length > 0 && selectedNotes.length === 0 && !textInput.trim()) {
        // Use Gemini Files API for PDF/image analysis
        const geminiFile = geminiUploadedFiles[0].geminiFile;
        response = await callGeminiWithFile(prompt, geminiFile, "You are a helpful AI study assistant. Provide comprehensive analysis of study materials.");
      } else {
        // Notes or mixed content
        response = await callGemini(prompt, "You are a helpful AI study assistant. Provide comprehensive analysis of study materials.");
      }
      
      setAnalysis(response);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createAnalysisPrompt = async (notes, assignments, uploadedContent, textInput) => {
    const notesText = notes.map(note => 
      `Title: ${note.title}\nSubject: ${note.subject || 'No subject'}\nContent: ${note.content.replace(/<[^>]*>/g, '')}`
    ).join('\n\n---\n\n');

    const fullContent = notesText + (uploadedContent ? `\n\n--- UPLOADED FILES ---\n\n${uploadedContent}` : '') + (textInput ? `\n\n--- TEXT INPUT ---\n\n${textInput}` : '');

    return `You are an expert study assistant. Analyze the following notes and extract the most important information.

NOTES:
${fullContent}

Provide a comprehensive analysis with these sections:

## 📚 Key Concepts
List all main topics, concepts, and themes covered in the notes.

## 📖 Important Definitions
Define all key terms, vocabulary, and terminology.

## 🔢 Formulas & Equations
List any formulas, equations, or mathematical expressions (if applicable).

## 💡 Core Ideas
Explain the fundamental principles and main takeaways.

## � How Concepts Connect
Show how the different ideas and concepts relate to each other.

## ⚠️ Important Details
Highlight critical facts, dates, examples, or information that shouldn't be missed.

Use clear markdown formatting with headers, bullet points, and organized sections.`;
  };

  // Markdown renderer function
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^####\s(.*)$/gm, '<h4 style="font-size:1rem;font-weight:700;margin:12px 0 6px;color:var(--text);">$1</h4>')
      .replace(/^###\s(.*)$/gm,  '<h3 style="font-size:1.1rem;font-weight:700;margin:16px 0 8px;color:var(--text);">$1</h3>')
      .replace(/^##\s(.*)$/gm,   '<h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 10px;color:var(--text);">$1</h2>')
      .replace(/^#\s(.*)$/gm,    '<h1 style="font-size:1.3rem;font-weight:700;margin:20px 0 10px;color:var(--text);">$1</h1>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg3);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:.85em;color:var(--text);">$1</code>')
      .replace(/^- (.*)$/gm, '<li style="margin:4px 0;color:var(--text);">• $1</li>')
      .replace(/^\d+\. (.*)$/gm, '<li style="margin:4px 0;color:var(--text);">$1</li>')
      .replace(/\n\n/g, '</p><p style="color:var(--text);margin:8px 0;">')
      .replace(/\n/g, '<br>');
  };

  const renderAnalysis = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid var(--border)', 
            borderTop: '4px solid var(--accent)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: darkMode ? 'var(--text2)' : 'var(--text3)' }}>
            Analyzing your files...
          </p>
        </div>
      );
    }

    if (!analysis) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: darkMode ? 'var(--text3)' : 'var(--text4)' }}>📊</div>
          <p style={{ color: darkMode ? 'var(--text2)' : 'var(--text3)' }}>
            Select notes or upload files and choose an analysis type to get started
          </p>
        </div>
      );
    }

    return (
      <div className="analysis-result" style={{ color: 'var(--text)', lineHeight: '1.6' }}>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />
      </div>
    );
  };

  return (
    <div className="ai-note-analyzer">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: 'var(--fs-xl)', 
          fontWeight: 'var(--fw-bold)',
          color: darkMode ? 'var(--text)' : 'var(--text)',
          marginBottom: '8px'
        }}>
          🧠 AI Note Analyzer
        </h2>
        <p style={{ 
          color: darkMode ? 'var(--text2)' : 'var(--text3)',
          fontSize: 'var(--fs-md)'
        }}>
          Get AI-powered insights from your study notes
        </p>
      </div>

      {/* File Upload Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: 'var(--fs-lg)', 
          fontWeight: 'var(--fw-semibold)',
          color: darkMode ? 'var(--text)' : 'var(--text)',
          marginBottom: '12px'
        }}>
          Add Content to Analyze
        </h3>
        
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              background: darkMode ? 'var(--card)' : 'var(--bg2)',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              borderRadius: '10px',
              fontSize: 'var(--fs-sm)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              color: darkMode ? 'var(--text)' : 'var(--text)',
              transition: 'all var(--transition-base)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = darkMode ? 'var(--bg3)' : 'var(--bg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = darkMode ? 'var(--card)' : 'var(--bg2)';
            }}
          >
            📁 Choose Files
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />
          </label>
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            style={{
              padding: '10px 16px',
              background: showTextInput ? 'var(--accent)' : (darkMode ? 'var(--card)' : 'var(--bg2)'),
              border: `1.5px solid ${showTextInput ? 'var(--accent)' : (darkMode ? 'var(--border)' : 'var(--border2)')}`,
              borderRadius: '10px',
              fontSize: 'var(--fs-sm)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              color: showTextInput ? 'white' : (darkMode ? 'var(--text)' : 'var(--text)'),
              transition: 'all var(--transition-base)'
            }}
          >
            ✍️ Text Entry
          </button>
          <span style={{ 
            fontSize: 'var(--fs-xs)', 
            color: darkMode ? 'var(--text3)' : 'var(--text4)',
            alignSelf: 'center'
          }}>
            {uploadedFiles.length > 0 && `${uploadedFiles.length} file(s) uploaded`}
            {textInput && uploadedFiles.length > 0 && ' • '}
            {textInput && 'Text entered'}
          </span>
        </div>

        {showTextInput && (
          <div style={{ marginBottom: '12px' }}>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste or type your notes here..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '12px',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                background: 'var(--bg2)',
                color: 'var(--text)',
                fontSize: 'var(--fs-sm)',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '12px',
            background: darkMode ? 'var(--bg3)' : 'var(--bg)',
            border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
            borderRadius: '10px'
          }}>
            {uploadedFiles.map(file => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: darkMode ? 'var(--card)' : 'var(--bg2)',
                  border: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 'var(--fs-sm)' }}>
                    {file.type.startsWith('image/') ? '🖼️' : 
                     file.type.includes('pdf') ? '📄' : 
                     file.type.includes('word') ? '📝' : 
                     file.type.includes('text') ? '📄' : '📎'}
                  </span>
                  <div>
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-medium)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: darkMode ? 'var(--text3)' : 'var(--text4)' }}>
                      {Math.round(file.size / 1024)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeUploadedFile(file.id)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Selection */}
      <div style={{ marginBottom: '24px' }}>
        {(() => {
          const totalItems = selectedNotes.length + uploadedFiles.length;
          const selectionText = selectedNotes.length > 0 && uploadedFiles.length > 0 
            ? `${selectedNotes.length} notes + ${uploadedFiles.length} files`
            : selectedNotes.length > 0 
            ? `${selectedNotes.length} note${selectedNotes.length > 1 ? 's' : ''}`
            : `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`;

          return (
            <div>
              <h3 style={{ 
                fontSize: 'var(--fs-lg)', 
                fontWeight: 'var(--fw-semibold)',
                color: darkMode ? 'var(--text)' : 'var(--text)',
                marginBottom: '12px'
              }}>
                Items to Analyze ({selectionText})
              </h3>
              
              {notes.length === 0 && uploadedFiles.length === 0 ? (
                <p style={{ 
                  color: darkMode ? 'var(--text3)' : 'var(--text4)',
                  fontStyle: 'italic'
                }}>
                  No notes or files available. Create some notes or upload files to analyze them.
                </p>
              ) : notes.length === 0 ? (
                <p style={{ 
                  color: darkMode ? 'var(--text3)' : 'var(--text4)',
                  fontStyle: 'italic',
                  marginBottom: '12px'
                }}>
                  No notes available. Create some notes first to analyze them.
                </p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '12px',
                  background: darkMode ? 'var(--bg3)' : 'var(--bg)',
                  border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                  borderRadius: '10px'
                }}>
                  {notes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleNoteSelection(note.id)}
                      style={{
                        padding: '12px',
                        border: `1.5px solid ${selectedNotes.includes(note.id) ? 'var(--accent)' : (darkMode ? 'var(--border)' : 'var(--border2)')}`,
                        borderRadius: '8px',
                        background: selectedNotes.includes(note.id) ? (darkMode ? 'var(--accent)' : 'var(--accent2)') + '20' : (darkMode ? 'var(--card)' : 'var(--bg2)'),
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedNotes.includes(note.id)}
                          onChange={() => handleNoteSelection(note.id)}
                          style={{ margin: 0 }}
                        />
                        <span style={{ 
                          fontSize: 'var(--fs-sm)', 
                          fontWeight: 'var(--fw-semibold)',
                          color: darkMode ? 'var(--text)' : 'var(--text)'
                        }}>
                          {note.title}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: 'var(--fs-xs)', 
                        color: darkMode ? 'var(--text3)' : 'var(--text4)',
                        marginLeft: '24px'
                      }}>
                        {note.subject && `Subject: ${note.subject}`}
                        {note.attachments && note.attachments.length > 0 && ` • ${note.attachments.length} attachments`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Action Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={generateAnalysis}
          disabled={selectedNotes.length === 0 && uploadedFiles.length === 0 && !textInput.trim() || loading}
          style={{
            padding: '12px 24px',
            background: (selectedNotes.length > 0 || uploadedFiles.length > 0 || textInput.trim()) && !loading ? 'var(--accent)' : (darkMode ? 'var(--bg3)' : 'var(--bg)'),
            color: (selectedNotes.length > 0 || uploadedFiles.length > 0 || textInput.trim()) && !loading ? 'white' : (darkMode ? 'var(--text3)' : 'var(--text4)'),
            border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
            borderRadius: '10px',
            fontSize: 'var(--fs-md)',
            fontWeight: 'var(--fw-semibold)',
            cursor: (selectedNotes.length > 0 || uploadedFiles.length > 0 || textInput.trim()) && !loading ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition-base)'
          }}
        >
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
      </div>

      {/* Results */}
      {renderAnalysis()}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AINoteAnalyzer;
