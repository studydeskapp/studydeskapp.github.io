import React, { useState } from 'react';

/**
 * Notes View - Mobile notes with rich text editing
 */
function NotesView({ notes = [], onAddNote, onUpdateNote, onDeleteNote }) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  // Get unique subjects from notes
  const subjects = [...new Set(notes.map(n => n.subject).filter(Boolean))];

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || note.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const handleAddNote = () => {
    setEditingNote(null);
    setShowEditor(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
  };

  return (
    <div className="mobile-view notes-view-mobile">
      {!showEditor ? (
        <>
          <h1 className="notes-title-mobile">Notes</h1>

          {/* Search and Filter */}
          <div className="notes-controls-mobile">
            <div className="notes-search-container">
              <svg className="notes-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="notes-search-input"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {subjects.length > 0 && (
              <select
                className="notes-filter-select"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            )}
          </div>

          {/* Notes List */}
          {filteredNotes.length > 0 ? (
            <div className="notes-list-mobile">
              {filteredNotes.map(note => (
                <div key={note.id} className="note-card-mobile" onClick={() => handleEditNote(note)}>
                  <div className="note-card-header">
                    <div className="note-card-title">{note.title || 'Untitled Note'}</div>
                    {note.subject && (
                      <div className="note-card-subject">{note.subject}</div>
                    )}
                  </div>
                  <div className="note-card-preview">
                    {note.content?.substring(0, 150)}
                    {note.content?.length > 150 && '...'}
                  </div>
                  <div className="note-card-footer">
                    <div className="note-card-date">
                      {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'No date'}
                    </div>
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="note-card-attachments">
                        📎 {note.attachments.length}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="notes-empty-state">
              <div className="notes-empty-icon">📝</div>
              <div className="notes-empty-title">
                {searchQuery || filterSubject !== 'all' ? 'No notes found' : 'No notes yet'}
              </div>
              <div className="notes-empty-text">
                {searchQuery || filterSubject !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Tap the + button to create your first note'}
              </div>
            </div>
          )}

          {/* Add Note Button */}
          <button className="notes-add-btn-mobile" onClick={handleAddNote}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </>
      ) : (
        <NoteEditor
          note={editingNote}
          onSave={(noteData) => {
            if (editingNote) {
              onUpdateNote(editingNote.id, noteData);
            } else {
              onAddNote(noteData);
            }
            handleCloseEditor();
          }}
          onCancel={handleCloseEditor}
          onDelete={editingNote ? () => {
            onDeleteNote(editingNote.id);
            handleCloseEditor();
          } : null}
        />
      )}
    </div>
  );
}

/**
 * Note Editor Component
 */
function NoteEditor({ note, onSave, onCancel, onDelete }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [subject, setSubject] = useState(note?.subject || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      alert('Please add a title or content');
      return;
    }

    onSave({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      subject: subject.trim(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="note-editor-mobile">
      {/* Editor Header */}
      <div className="note-editor-header">
        <button className="note-editor-back-btn" onClick={onCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="note-editor-title-text">
          {note ? 'Edit Note' : 'New Note'}
        </div>
        <button className="note-editor-save-btn" onClick={handleSave}>
          Save
        </button>
      </div>

      {/* Editor Content */}
      <div className="note-editor-content">
        <input
          type="text"
          className="note-editor-title-input"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          className="note-editor-subject-input"
          placeholder="Subject (optional)..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <textarea
          className="note-editor-textarea"
          placeholder="Start typing your notes..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
        />
      </div>

      {/* Editor Footer */}
      {onDelete && (
        <div className="note-editor-footer">
          {!showDeleteConfirm ? (
            <button 
              className="note-editor-delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ Delete Note
            </button>
          ) : (
            <div className="note-editor-delete-confirm">
              <span>Are you sure?</span>
              <button className="note-editor-confirm-yes" onClick={handleDelete}>
                Yes, Delete
              </button>
              <button className="note-editor-confirm-no" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotesView;
