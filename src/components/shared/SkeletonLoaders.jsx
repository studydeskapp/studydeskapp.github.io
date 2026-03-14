import React from 'react';

export function StatSkeleton() {
  return (
    <div className="skeleton skeleton-stat" aria-hidden="true" />
  );
}

export function StatSkeletonGrid({ count = 5 }) {
  return (
    <div className="stats">
      {Array.from({ length: count }).map((_, i) => (
        <StatSkeleton key={i} />
      ))}
    </div>
  );
}

export function AssignmentCardSkeleton() {
  return (
    <div className="skeleton-row skeleton" aria-hidden="true">
      <div className="skeleton skeleton-avatar" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="skeleton skeleton-line" style={{ width: '75%', marginBottom: 8 }} />
        <div className="skeleton skeleton-line-sm" />
      </div>
    </div>
  );
}

export function AssignmentListSkeleton({ count = 5 }) {
  return (
    <div className="alist">
      {Array.from({ length: count }).map((_, i) => (
        <AssignmentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="tab-content">
      <StatSkeletonGrid />
      <div className="skeleton skeleton skeleton-stat-lg" style={{ marginBottom: 20, height: 80 }} aria-hidden="true" />
      <div className="dash-grid">
        <div className="dcard">
          <div className="dcard-hdr">
            <span className="skeleton skeleton-line" style={{ width: 120, height: 16, display: 'inline-block' }} />
          </div>
          <div className="dcard-body">
            <AssignmentListSkeleton count={4} />
          </div>
        </div>
        <div className="dcard">
          <div className="dcard-hdr">
            <span className="skeleton skeleton-line" style={{ width: 100, height: 16, display: 'inline-block' }} />
          </div>
          <div className="dcard-body">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-row skeleton">
                <div className="skeleton skeleton-avatar" style={{ width: 24, height: 24 }} />
                <div className="skeleton skeleton-line" style={{ flex: 1, height: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
