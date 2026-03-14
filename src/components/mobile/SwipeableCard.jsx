import React, { useState, useRef } from 'react';

/**
 * Swipeable Card - Touch-optimized card with swipe gestures
 * Swipe right = complete, Swipe left = actions menu
 */
function SwipeableCard({ 
  children, 
  onSwipeRight, 
  onSwipeLeft,
  rightAction = { icon: '✓', color: '#10b981', label: 'Complete' },
  leftAction = { icon: '⋯', color: '#6366f1', label: 'More' },
  disabled = false
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef(null);
  const threshold = 80; // pixels to trigger action

  const handleTouchStart = (e) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || disabled) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    if (offset > threshold && onSwipeRight) {
      // Swipe right - complete action
      onSwipeRight();
    } else if (offset < -threshold && onSwipeLeft) {
      // Swipe left - more actions
      onSwipeLeft();
    }

    // Reset position
    setOffset(0);
  };

  const getBackgroundColor = () => {
    if (offset > threshold) return rightAction.color;
    if (offset < -threshold) return leftAction.color;
    return 'transparent';
  };

  return (
    <div className="swipeable-card-container">
      <div 
        className="swipeable-card-background"
        style={{ backgroundColor: getBackgroundColor() }}
      >
        {offset > threshold && (
          <div className="swipeable-action swipeable-action-right">
            <span className="swipeable-action-icon">{rightAction.icon}</span>
            <span className="swipeable-action-label">{rightAction.label}</span>
          </div>
        )}
        {offset < -threshold && (
          <div className="swipeable-action swipeable-action-left">
            <span className="swipeable-action-label">{leftAction.label}</span>
            <span className="swipeable-action-icon">{leftAction.icon}</span>
          </div>
        )}
      </div>
      
      <div
        ref={cardRef}
        className={`swipeable-card ${isDragging ? 'dragging' : ''}`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default SwipeableCard;
