import React from 'react';

/**
 * Reusable empty state with icon, title, description, and optional CTA.
 */
function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-p empty-state-cta"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
