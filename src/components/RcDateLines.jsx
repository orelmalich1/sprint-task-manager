import React from 'react';
import { useQuarterSprints } from '../hooks/useQuarterSprints';

const RcDateLines = ({ rcDates }) => {
  const { Q_START_DATE, SPRINT_WIDTH_PX, SPRINT_DURATION_DAYS } = useQuarterSprints();

  const calculatePosition = (dateString) => {
    const rcDate = new Date(dateString);
    const days = (rcDate - Q_START_DATE) / (1000 * 60 * 60 * 24);
    return (days / SPRINT_DURATION_DAYS) * SPRINT_WIDTH_PX;
  };

  return (
    <>
      {rcDates.map((rc) => (
        <div
          key={rc.id}
          className="rc-date-line"
          style={{ left: `${calculatePosition(rc.date)}px` }}
        />
      ))}
    </>
  );
};

export default RcDateLines;
