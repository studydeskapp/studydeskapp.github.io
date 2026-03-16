import React, { useState, useRef, useEffect } from 'react';
import { fmtDate } from '../../utils/helpers';
import EmptyState from '../shared/EmptyState';

function NotesTab({ notes, assignments, onAddNote, onUpdateNote, onDeleteNote, darkMode }) {
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Filter notes based on search and subject
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Get unique subjects from notes and assignments
  const subjects = ['all', ...new Set([
    ...notes.map(n => n.subject).filter(Boolean),
    ...assignments.map(a => a.subject).filter(Boolean)
  ])];

  return (
    <div className="tab-content">
      {/* Header */}
      <div className="notes-header">
        <div className="notes-controls">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="notes-search"
            style={{
              background: darkMode ? 'var(--bg3)' : 'var(--bg2)',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              color: darkMode ? 'var(--text)' : 'var(--text)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: 'var(--fs-md)',
              width: '250px',
              marginRight: '12px'
            }}
          />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              background: darkMode ? 'var(--bg3)' : 'var(--bg2)',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              color: darkMode ? 'var(--text)' : 'var(--text)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: 'var(--fs-md)',
              marginRight: '12px'
            }}
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingNote(null);
              setShowNoteEditor(true);
            }}
            className="btn-primary"
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: 'var(--fs-md)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
          >
            + New Note
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
          title={searchTerm || selectedSubject !== 'all' ? 'No matching notes' : 'No notes yet'}
          description={searchTerm || selectedSubject !== 'all' 
            ? 'Try adjusting your search or filter criteria' 
            : 'Create your first note to get started with organized studying'}
          actionText="Create Note"
          onAction={() => {
            setEditingNote(null);
            setShowNoteEditor(true);
          }}
        />
      ) : (
        <div className="notes-grid">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              darkMode={darkMode}
              onEdit={() => {
                setEditingNote(note);
                setShowNoteEditor(true);
              }}
              onDelete={() => onDeleteNote(note.id)}
            />
          ))}
        </div>
      )}

      {/* Note Editor Modal */}
      {showNoteEditor && (
        <NoteEditor
          note={editingNote}
          subjects={subjects.filter(s => s !== 'all')}
          assignments={assignments}
          onSave={(noteData) => {
            if (editingNote) {
              onUpdateNote(editingNote.id, noteData);
            } else {
              onAddNote(noteData);
            }
            setShowNoteEditor(false);
            setEditingNote(null);
          }}
          onCancel={() => {
            setShowNoteEditor(false);
            setEditingNote(null);
          }}
          darkMode={darkMode}
        />
      )}

      <style jsx>{`
        .notes-header {
          margin-bottom: 24px;
        }
        .notes-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .notes-search:focus {
          outline: none;
          box-shadow: var(--focus-ring);
        }
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        @media (max-width: 768px) {
          .notes-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .notes-search {
            width: 100% !important;
            margin-right: 0 !important;
            margin-bottom: 12px;
          }
          .notes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// Note Card Component
function NoteCard({ note, darkMode, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Truncate content for preview
  const contentPreview = note.content.length > 150 
    ? note.content.substring(0, 150) + '...' 
    : note.content;

  // Strip HTML for preview
  const textPreview = contentPreview.replace(/<[^>]*>/g, '');

  return (
    <div
      className="note-card"
      style={{
        background: darkMode ? 'var(--card)' : 'var(--card2)',
        border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
        borderRadius: '14px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        position: 'relative'
      }}
      onClick={onEdit}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = darkMode 
          ? '0 8px 32px rgba(0,0,0,0.4)' 
          : '0 8px 32px rgba(24,25,43,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Subject Badge */}
      {note.subject && (
        <div
          className="note-subject"
          style={{
            background: darkMode ? 'var(--accent)' : 'var(--accent2)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: 'var(--fs-xs)',
            fontWeight: 'var(--fw-semibold)',
            display: 'inline-block',
            marginBottom: '12px'
          }}
        >
          {note.subject}
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          fontSize: 'var(--fs-lg)',
          fontWeight: 'var(--fw-semibold)',
          color: darkMode ? 'var(--text)' : 'var(--text)',
          marginBottom: '8px',
          lineHeight: '1.3'
        }}
      >
        {note.title}
      </h3>

      {/* Content Preview */}
      <p
        style={{
          fontSize: 'var(--fs-md)',
          color: darkMode ? 'var(--text2)' : 'var(--text3)',
          lineHeight: '1.5',
          marginBottom: '12px'
        }}
      >
        {textPreview}
      </p>

      {/* Metadata */}
      <div
        className="note-meta"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--fs-xs)',
          color: darkMode ? 'var(--text3)' : 'var(--text4)'
        }}
      >
        <span>{fmtDate(note.updatedAt || note.createdAt)}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {note.assignmentId && (
            <span style={{ opacity: 0.7 }}>📋 Linked</span>
          )}
          {note.attachments && note.attachments.length > 0 && (
            <span style={{ opacity: 0.7 }}>📎 {note.attachments.length}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="note-actions"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          opacity: 0,
          transition: 'opacity var(--transition-base)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            background: darkMode ? 'var(--bg3)' : 'var(--bg)',
            color: darkMode ? 'var(--text)' : 'var(--text2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
        >
          ✏️
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            background: darkMode ? 'var(--bg3)' : 'var(--bg)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
        >
          🗑️
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          className="delete-confirm"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: darkMode ? 'var(--bg2)' : 'var(--card)',
            border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: darkMode 
              ? '0 8px 32px rgba(0,0,0,0.6)' 
              : '0 8px 32px rgba(24,25,43,0.2)',
            zIndex: 10,
            minWidth: '200px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ 
            fontSize: 'var(--fs-sm)', 
            marginBottom: '12px', 
            color: darkMode ? 'var(--text)' : 'var(--text)' 
          }}>
            Delete this note?
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                background: 'transparent',
                color: darkMode ? 'var(--text)' : 'var(--text)',
                fontSize: 'var(--fs-xs)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontSize: 'var(--fs-xs)',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .note-card:hover .note-actions {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// Note Editor Component
function NoteEditor({ note, subjects, assignments, onSave, onCancel, darkMode }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [subject, setSubject] = useState(note?.subject || '');
  const [assignmentId, setAssignmentId] = useState(note?.assignmentId || '');
  const [attachments, setAttachments] = useState(note?.attachments || []);
  const editorRef = useRef(null);

  // Rich text editor commands
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleContentChange = () => {
    setContent(editorRef.current?.innerHTML || '');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    onSave({
      title: title.trim(),
      content: content.trim(),
      subject,
      assignmentId,
      attachments,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div
      className="note-editor-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        className="note-editor"
        style={{
          background: darkMode ? 'var(--bg2)' : 'var(--card)',
          border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: darkMode 
            ? '0 16px 64px rgba(0,0,0,0.6)' 
            : '0 16px 64px rgba(24,25,43,0.2)'
        }}
      >
        {/* Header */}
        <div
          className="editor-header"
          style={{
            padding: '20px',
            borderBottom: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ 
            fontSize: 'var(--fs-xl)', 
            fontWeight: 'var(--fw-bold)',
            color: darkMode ? 'var(--text)' : 'var(--text)' 
          }}>
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={onCancel}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: darkMode ? 'var(--bg3)' : 'var(--bg)',
              color: darkMode ? 'var(--text)' : 'var(--text2)',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
          {/* Title */}
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              borderRadius: '10px',
              fontSize: 'var(--fs-lg)',
              fontWeight: 'var(--fw-semibold)',
              background: darkMode ? 'var(--bg3)' : 'var(--bg2)',
              color: darkMode ? 'var(--text)' : 'var(--text)',
              marginBottom: '16px'
            }}
          />

          {/* Subject and Assignment */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                borderRadius: '10px',
                fontSize: 'var(--fs-md)',
                background: darkMode ? 'var(--bg3)' : 'var(--bg2)',
                color: darkMode ? 'var(--text)' : 'var(--text)'
              }}
            >
              <option value="">No subject</option>
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
            <select
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                borderRadius: '10px',
                fontSize: 'var(--fs-md)',
                background: darkMode ? 'var(--bg3)' : 'var(--bg2)',
                color: darkMode ? 'var(--text)' : 'var(--text)'
              }}
            >
              <option value="">No assignment</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
          </div>

          {/* Formatting Toolbar */}
          <div
            className="formatting-toolbar"
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              background: darkMode ? 'var(--bg3)' : 'var(--bg)',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              borderTop: 'none',
              borderTopLeftRadius: '0',
              borderTopRightRadius: '0',
              marginBottom: '0',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => execCommand('bold')}
              style={toolbarButtonStyle(darkMode)}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => execCommand('italic')}
              style={toolbarButtonStyle(darkMode)}
            >
              <em>I</em>
            </button>
            <button
              onClick={() => execCommand('underline')}
              style={toolbarButtonStyle(darkMode)}
            >
              <u>U</u>
            </button>
            <div style={{ width: '1px', height: '24px', background: darkMode ? 'var(--border)' : 'var(--border2)' }} />
            <button
              onClick={() => execCommand('insertUnorderedList')}
              style={toolbarButtonStyle(darkMode)}
            >
              • List
            </button>
            <button
              onClick={() => execCommand('insertOrderedList')}
              style={toolbarButtonStyle(darkMode)}
            >
              1. List
            </button>
            <div style={{ width: '1px', height: '24px', background: darkMode ? 'var(--border)' : 'var(--border2)' }} />
            <select
              onChange={(e) => execCommand('formatBlock', e.target.value)}
              style={toolbarSelectStyle(darkMode)}
            >
              <option value="">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
            <input
              type="color"
              onChange={(e) => execCommand('foreColor', e.target.value)}
              style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            />
          </div>

          {/* Content Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            style={{
              minHeight: '300px',
              padding: '16px',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              borderTop: 'none',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
              fontSize: 'var(--fs-md)',
              lineHeight: '1.6',
              background: darkMode ? 'var(--bg3)' : 'var(--bg2)',
              color: darkMode ? 'var(--text)' : 'var(--text)',
              outline: 'none'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* File Attachments */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ 
                fontSize: 'var(--fs-md)', 
                fontWeight: 'var(--fw-semibold)',
                color: darkMode ? 'var(--text)' : 'var(--text)' 
              }}>
                Attachments
              </h4>
              <label
                style={{
                  padding: '8px 12px',
                  background: darkMode ? 'var(--bg3)' : 'var(--bg)',
                  border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                  borderRadius: '8px',
                  fontSize: 'var(--fs-xs)',
                  cursor: 'pointer',
                  color: darkMode ? 'var(--text)' : 'var(--text)'
                }}
              >
                + Add File
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p style={{ 
                fontSize: 'var(--fs-sm)', 
                color: darkMode ? 'var(--text3)' : 'var(--text4)',
                fontStyle: 'italic'
              }}>
                No attachments
              </p>
            ) : (
              <div className="attachments-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachments.map(att => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: darkMode ? 'var(--bg)' : 'var(--bg2)',
                      border: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{getFileIcon(att.type)}</span>
                      <div>
                        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-medium)' }}>
                          {att.name}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: darkMode ? 'var(--text3)' : 'var(--text4)' }}>
                          {formatFileSize(att.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(att.id)}
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
        </div>

        {/* Footer */}
        <div
          className="editor-footer"
          style={{
            padding: '20px',
            borderTop: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              background: 'transparent',
              color: darkMode ? 'var(--text)' : 'var(--text)',
              fontSize: 'var(--fs-md)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 'var(--fs-md)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer'
            }}
          >
            {note ? 'Update' : 'Create'} Note
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function toolbarButtonStyle(darkMode) {
  return {
    padding: '6px 10px',
    border: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
    borderRadius: '6px',
    background: darkMode ? 'var(--bg2)' : 'var(--card)',
    color: darkMode ? 'var(--text)' : 'var(--text)',
    cursor: 'pointer',
    fontSize: 'var(--fs-xs)',
    fontWeight: 'var(--fw-medium)'
  };
}

function toolbarSelectStyle(darkMode) {
  return {
    padding: '6px 10px',
    border: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
    borderRadius: '6px',
    background: darkMode ? 'var(--bg2)' : 'var(--card)',
    color: darkMode ? 'var(--text)' : 'var(--text)',
    fontSize: 'var(--fs-xs)',
    fontWeight: 'var(--fw-medium)'
  };
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word')) return '📝';
  if (type.includes('excel') || type.includes('sheet')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default NotesTab;
