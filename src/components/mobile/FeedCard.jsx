import React from 'react';

/**
 * Feed Card - Reusable card component for mobile feed
 * Supports different card types: assignment, class, buddy, quest
 */
function FeedCard({ 
  type = 'default',
  title,
  subtitle,
  icon,
  color,
  badge,
  action,
  children,
  onClick,
  className = ''
}) {
  const getCardClass = () => {
    const base = 'feed-card';
    const typeClass = `feed-card-${type}`;
    return `${base} ${typeClass} ${className}`.trim();
  };

  return (
    <div 
      className={getCardClass()}
      onClick={onClick}
      style={{ '--card-color': color }}
    >
      {icon && (
        <div className="feed-card-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
      )}
      
      <div className="feed-card-content">
        <div className="feed-card-header">
          <h3 className="feed-card-title">{title}</h3>
          {badge && <span className="feed-card-badge">{badge}</span>}
        </div>
        
        {subtitle && <p className="feed-card-subtitle">{subtitle}</p>}
        
        {children && <div className="feed-card-body">{children}</div>}
      </div>

      {action && (
        <button className="feed-card-action" onClick={(e) => {
          e.stopPropagation();
          action.onClick();
        }}>
          {action.icon || action.label}
        </button>
      )}
    </div>
  );
}

export default FeedCard;
