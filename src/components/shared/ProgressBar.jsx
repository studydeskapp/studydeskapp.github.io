import React, { useState, useEffect, useRef } from 'react';

/**
 * Sleek animated progress bar for AI operations
 * Uses realistic progress curve that slows down near completion
 */
export default function ProgressBar({ 
  isLoading, 
  label = "Processing...",
  showPercentage = true,
  onComplete // Callback when progress reaches 100%
}) {
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const intervalRef = useRef(null);
  const completeIntervalRef = useRef(null);

  // Main progress effect
  useEffect(() => {
    // Clear any existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (completeIntervalRef.current) {
      clearInterval(completeIntervalRef.current);
      completeIntervalRef.current = null;
    }

    if (!isLoading) {
      // When loading stops, animate to completion
      if (progress > 0 && progress < 100 && !isCompleting) {
        setIsCompleting(true);
        
        // Smoothly animate from current position to 100%
        const startProgress = progress;
        const remaining = 100 - startProgress;
        const duration = 400; // 400ms to complete
        const steps = 20; // 20 steps for smooth animation
        const increment = remaining / steps;
        let currentStep = 0;
        
        completeIntervalRef.current = setInterval(() => {
          currentStep++;
          setProgress(prev => {
            const newProgress = startProgress + (increment * currentStep);
            if (newProgress >= 100 || currentStep >= steps) {
              if (completeIntervalRef.current) {
                clearInterval(completeIntervalRef.current);
                completeIntervalRef.current = null;
              }
              return 100;
            }
            return newProgress;
          });
        }, duration / steps);
        
        // Call onComplete callback when reaching 100%
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, duration + 100);
        
        // Reset after showing 100%
        setTimeout(() => {
          setProgress(0);
          setIsCompleting(false);
        }, duration + 200);
      }
      return;
    }

    // Start new loading session
    setProgress(0);
    setIsCompleting(false);
    
    // Smooth realistic progress simulation
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) {
          // Phase 4: Very slow crawl at 98-99%
          return Math.min(prev + 0.02, 99);
        } else if (prev >= 92) {
          // Phase 3: Slow at 92-98%
          return Math.min(prev + 0.1, 98);
        } else if (prev >= 80) {
          // Phase 2: Moderate at 80-92%
          return Math.min(prev + 0.3, 92);
        } else if (prev >= 60) {
          // Phase 1.5: Steady at 60-80%
          return Math.min(prev + 0.5, 80);
        } else {
          // Phase 1: Quick start 0-60%
          return Math.min(prev + 1, 60);
        }
      });
    }, 100); // Update every 100ms for smoother animation

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (completeIntervalRef.current) {
        clearInterval(completeIntervalRef.current);
        completeIntervalRef.current = null;
      }
    };
  }, [isLoading, onComplete]);

  if (!isLoading && progress === 0) return null;

  return (
    <div style={{
      width: '100%',
      marginBottom: 16,
      opacity: progress === 100 ? 0 : 1,
      transition: 'opacity 0.3s ease-out'
    }}>
      {label && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          fontSize: '.85rem',
          color: 'var(--text2)',
          fontWeight: 500
        }}>
          <span>{label}</span>
          {showPercentage && (
            <span style={{ 
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--accent)'
            }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      
      <div style={{
        width: '100%',
        height: 6,
        background: 'var(--bg3)',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Background shimmer effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
          animation: 'shimmer 2s infinite',
          pointerEvents: 'none'
        }} />
        
        {/* Progress fill */}
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          borderRadius: 10,
          transition: 'width 0.3s ease-out',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'shine 1.5s infinite',
            pointerEvents: 'none'
          }} />
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
