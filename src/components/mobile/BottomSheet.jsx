import React, { useEffect, useRef, useState } from 'react';

/**
 * Bottom Sheet - Native-feeling modal that slides up from bottom
 * Supports drag-to-dismiss and snap points
 */
function BottomSheet({ 
  isOpen, 
  onClose, 
  title,
  children,
  snapPoints = ['90%', '50%'],
  initialSnap = 0
}) {
  const [snapIndex, setSnapIndex] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = currentY - startY;
    
    // If dragged down more than 100px, close
    if (diff > 100) {
      onClose();
    } else if (diff < -100 && snapIndex < snapPoints.length - 1) {
      // Dragged up, go to next snap point
      setSnapIndex(snapIndex + 1);
    } else if (diff > 50 && snapIndex > 0) {
      // Dragged down, go to previous snap point
      setSnapIndex(snapIndex - 1);
    }
  };

  if (!isOpen) return null;

  const translateY = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <>
      <div 
        className="bottom-sheet-overlay"
        onClick={onClose}
      />
      <div 
        ref={sheetRef}
        className={`bottom-sheet ${isDragging ? 'dragging' : ''}`}
        style={{
          height: snapPoints[snapIndex],
          transform: `translateY(${translateY}px)`
        }}
      >
        <div 
          className="bottom-sheet-handle-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bottom-sheet-handle" />
        </div>
        
        {title && (
          <div className="bottom-sheet-header">
            <h2 className="bottom-sheet-title">{title}</h2>
            <button 
              className="bottom-sheet-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}

export default BottomSheet;
