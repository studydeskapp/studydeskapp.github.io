import React from 'react';
import BuddyCreature from '../../shared/BuddyCreature';
import { getBuddyStage } from '../../../utils/helpers';
import { BUDDY_STAGES } from '../../../constants';

/**
 * Buddy View - Gamification and progress tracking
 */
function BuddyView({ game, assignments }) {
  const today = new Date().toISOString().split('T')[0];
  const todayCompleted = assignments.filter(a => {
    const completedDate = a.completedDate?.split('T')[0];
    return completedDate === today;
  }).length;

  const stage = getBuddyStage(game.streak);
  const stageInfo = BUDDY_STAGES[stage];
  const progress = stageInfo.next 
    ? Math.min(100, Math.round(((game.streak - stageInfo.min) / (stageInfo.next - stageInfo.min)) * 100))
    : 100;

  const questProgress = Math.min(3, todayCompleted);
  const streakBonus = Math.round(10 + game.streak * 4);

  return (
    <div className="mobile-view buddy-view">
      <h1 className="buddy-title">Buddy</h1>

      {/* Buddy Creature */}
      <div className="buddy-creature-card">
        <div className="buddy-creature-stage">
          <span className="buddy-stage-name">{stageInfo.name}</span>
          <span className="buddy-stage-level">Stage {stage}/5</span>
        </div>
        
        <div className="buddy-creature-container">
          <BuddyCreature stage={stage} eq={game.equipped || {}} />
        </div>
        
        <p className="buddy-stage-desc">{stageInfo.desc}</p>

        {stageInfo.next && (
          <div className="buddy-progress">
            <div className="buddy-progress-label">
              <span>Next: {BUDDY_STAGES[stage + 1].name}</span>
              <span>{game.streak}/{stageInfo.next} days</span>
            </div>
            <div className="buddy-progress-bar">
              <div 
                className="buddy-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="buddy-stats-grid">
        <div className="buddy-stat-card">
          <div className="buddy-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="buddy-stat-value">{game.points}</div>
          <div className="buddy-stat-label">Points</div>
        </div>

        <div className="buddy-stat-card">
          <div className="buddy-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1.5 3 4 4 7 4-3.5 3.5-3.5 9.5 0 13-3 0-5.5-1-7-3-1.5 2-4 3-7 3 3.5-3.5 3.5-9.5 0-13 3 0 5.5-1 7-4z"/>
            </svg>
          </div>
          <div className="buddy-stat-value">{game.streak}</div>
          <div className="buddy-stat-label">Day Streak</div>
        </div>

        <div className="buddy-stat-card">
          <div className="buddy-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="buddy-stat-value">{todayCompleted}</div>
          <div className="buddy-stat-label">Today</div>
        </div>
      </div>

      {/* Daily Quest */}
      <div className="buddy-quest-card">
        <div className="buddy-quest-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h3 className="buddy-quest-title">Daily Quest</h3>
        </div>
        
        <p className="buddy-quest-desc">
          Complete 3 assignments today to {game.streak > 0 ? `extend your ${game.streak}-day streak` : 'start your streak'}
        </p>

        <div className="buddy-quest-progress">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`buddy-quest-pip ${i < questProgress ? 'completed' : ''}`}
            >
              {i < questProgress && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          ))}
          <span className="buddy-quest-status">
            {questProgress >= 3 ? (
              <span className="buddy-quest-complete">+{streakBonus} points earned!</span>
            ) : (
              <span>{3 - questProgress} more to go</span>
            )}
          </span>
        </div>
      </div>

      {/* How Points Work */}
      <div className="buddy-points-info">
        <h3 className="buddy-section-title">How Points Work</h3>
        
        <div className="buddy-points-row">
          <span className="buddy-points-action">Complete an assignment</span>
          <span className="buddy-points-value">+15</span>
        </div>
        
        <div className="buddy-points-divider" />
        
        <div className="buddy-points-row">
          <span className="buddy-points-action">Daily streak bonus (3 per day)</span>
          <span className="buddy-points-value">+{streakBonus}</span>
        </div>
        
        <div className="buddy-points-divider" />
        
        <p className="buddy-points-note">
          Higher streaks = bigger bonuses!
        </p>
      </div>
    </div>
  );
}

export default BuddyView;
