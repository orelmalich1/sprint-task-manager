import React from 'react';
import { useQuarterSprints } from '../hooks/useQuarterSprints';

const TodayIndicator = () => {
  const { Q_START_DATE, Q_END_DATE, SPRINT_WIDTH_PX, SPRINT_DURATION_DAYS } = useQuarterSprints();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today is within the current quarter
  if (today < Q_START_DATE || today > Q_END_DATE) {
    return null; // Don't show if today is not in this quarter
  }

  const calculatePosition = () => {
    const daysSinceStart = Math.floor((today - Q_START_DATE) / (1000 * 60 * 60 * 24));
    const sprintsFraction = daysSinceStart / SPRINT_DURATION_DAYS;
    return sprintsFraction * SPRINT_WIDTH_PX;
  };

  const position = calculatePosition();

  return (
    <div
      className="today-indicator"
      style={{ left: `${position}px` }}
    >
      <div className="today-label">
        Today
      </div>
    </div>
  );
};

export default TodayIndicator;
